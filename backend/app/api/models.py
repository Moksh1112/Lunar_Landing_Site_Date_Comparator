"""Pydantic models for every object in docs/CONTRACT.md (v1.0)."""
from datetime import UTC, date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

LAT_MAX_ABS = 89.99

Lat = Annotated[float, Field(ge=-LAT_MAX_ABS, le=LAT_MAX_ABS)]
Lon = Annotated[float, Field(ge=0, lt=360)]
ObserverHeight = Annotated[float, Field(ge=0, le=20)]
# Upper bound (8,760 h) is enforced in the routes as 413 RANGE_TOO_LARGE, per the contract error table.
MissionHours = Annotated[float, Field(ge=1)]
ErrorCode = Literal[
    "INVALID_INPUT", "NOT_FOUND", "RANGE_TOO_LARGE", "NOT_IN_COVERAGE", "UPSTREAM_UNAVAILABLE", "INTERNAL"
]


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Site(Strict):
    site_id: str | None = None
    name: str | None = None
    lat_deg: float | None = None
    lon_east_deg: float | None = None

    @field_validator("lat_deg")
    @classmethod
    def _lat(cls, v: float | None) -> float | None:
        if v is None:
            return v
        if not -90 <= v <= 90:
            raise ValueError("must be between -90 and 90")
        if abs(v) > LAT_MAX_ABS:
            raise ValueError("must be at least 0.01 degrees away from the poles")
        return v

    @field_validator("lon_east_deg")
    @classmethod
    def _lon(cls, v: float | None) -> float | None:
        if v is not None and not 0 <= v < 360:
            raise ValueError("must be at least 0 and less than 360")
        return v

    @model_validator(mode="after")
    def _either(self) -> "Site":
        if self.site_id is None and (self.lat_deg is None or self.lon_east_deg is None):
            raise ValueError("provide site_id, or both lat_deg and lon_east_deg")
        return self


class Thresholds(Strict):
    sun_pct_min: Annotated[float, Field(ge=0, le=100)] = 50
    earth_pct_min: Annotated[float, Field(ge=0, le=100)] = 50
    dark_gap_h_max: Annotated[float, Field(ge=0)] = 48
    blackout_h_max: Annotated[float, Field(ge=0)] = 72


class Meta(Strict):
    ephemeris: Literal["SPICE DE440 (JPL NAIF)"]
    kernels: list[str]
    horizon_mode: Literal["terrain", "terrain_coarse", "geometric"]
    dem: str | None
    step_minutes: float
    observer_height_m: float
    app_version: str
    contract_version: Literal["1.0"]
    computed_at: str
    data_label: Literal["REAL", "SYNTHETIC"]


class Window(Strict):
    start: str
    end: str
    hours: float
    start_censored: bool
    end_censored: bool


class Metrics(Strict):
    sun_el_max_deg: float
    sun_el_mean_up_deg: float | None
    sun_hours: float
    sun_pct: float
    earth_hours: float
    earth_pct: float
    both_hours: float
    both_pct: float
    longest_dark_h: float
    longest_blackout_h: float


class Verdict(Strict):
    level: Literal["green", "amber", "red"]
    failed: list[Literal["sun_pct_min", "earth_pct_min", "dark_gap_h_max", "blackout_h_max"]]


class Skyline(Strict):
    az_step_deg: Literal[0.5]
    elev_deg: Annotated[list[float], Field(min_length=720, max_length=720)]
    block_dist_km: Annotated[list[float], Field(min_length=720, max_length=720)] | None


class Series(Strict):
    t_unix: list[int]
    sun_az: list[float]
    sun_el: list[float]
    earth_az: list[float]
    earth_el: list[float]
    sun_vis: list[Literal[0, 1]]
    earth_vis: list[Literal[0, 1]]


class Windows(Strict):
    sun: list[Window]
    earth: list[Window]
    both: list[Window]


class ScenarioResult(Strict):
    id: Literal["A", "B"]
    label: str
    site: Site
    meta: Meta
    skyline: Skyline
    series: Series
    windows: Windows
    metrics: Metrics
    verdict: Verdict


def _parse_utc(value: str) -> datetime:
    if not value.endswith("Z"):
        raise ValueError("must be an ISO 8601 UTC string ending in Z")
    try:
        parsed = datetime.fromisoformat(value)  # Python 3.11+ reads the trailing Z as UTC
    except ValueError:
        raise ValueError("must be a valid ISO 8601 UTC timestamp") from None
    return parsed.astimezone(UTC)


class CompareScenario(Strict):
    id: Literal["A", "B"]
    label: Annotated[str, Field(min_length=1, max_length=40)]
    site: Site
    start_utc: str
    mission_hours: MissionHours

    @field_validator("start_utc")
    @classmethod
    def _start(cls, v: str) -> str:
        _parse_utc(v)
        return v

    @property
    def start_dt(self) -> datetime:
        return _parse_utc(self.start_utc)


class CompareRequest(Strict):
    mode: Literal["site_vs_site", "date_shift", "free"]
    scenarios: Annotated[list[CompareScenario], Field(min_length=2, max_length=2)]
    step_minutes: Annotated[int, Field(ge=1, le=60)] = 10
    observer_height_m: ObserverHeight = 2
    thresholds: Thresholds = Field(default_factory=Thresholds)

    @model_validator(mode="after")
    def _ids(self) -> "CompareRequest":
        if {s.id for s in self.scenarios} != {"A", "B"}:
            raise ValueError("scenarios must have ids exactly A and B")
        return self


class CompareResponse(Strict):
    contract_version: Literal["1.0"]
    scenarios: Annotated[list[ScenarioResult], Field(min_length=2, max_length=2)]
    deltas: dict[str, float | None]
    limitations: list[str]


class SweepRequest(Strict):
    site: Site
    range_start: date
    range_end: date
    mission_hours: MissionHours
    observer_height_m: ObserverHeight = 2
    thresholds: Thresholds = Field(default_factory=Thresholds)

    @field_validator("range_start", "range_end", mode="before")
    @classmethod
    def _iso_date(cls, v: object) -> object:
        if isinstance(v, str):
            if len(v) != 10:
                raise ValueError("must be an ISO date YYYY-MM-DD")
            try:
                return date.fromisoformat(v)
            except ValueError:
                raise ValueError("must be an ISO date YYYY-MM-DD") from None
        return v

    @model_validator(mode="after")
    def _order(self) -> "SweepRequest":
        if self.range_end < self.range_start:
            raise ValueError("range_end must not be before range_start")
        return self


class SweepDay(Strict):
    date: str
    rank: int
    refined: bool
    metrics: Metrics
    verdict: Verdict


class SweepResponse(Strict):
    contract_version: Literal["1.0"]
    site: Site
    meta: Meta
    days: list[SweepDay]
    top: Annotated[list[str], Field(max_length=5)]


class SiteEntry(Strict):
    site_id: str
    name: str
    group: Literal["apollo", "clps", "commercial", "international", "artemis_candidate"]
    lat_deg: float
    lon_east_deg: float
    terrain_coverage: bool
    source_url: str
    source_note: str
    verified: bool


class SitesResponse(Strict):
    sites: list[SiteEntry]


class SkylineQuery(Strict):
    lat_deg: Lat
    lon_east_deg: Lon
    observer_height_m: ObserverHeight = 2


class TerrainTileQuery(Strict):
    lat_deg: Lat
    lon_east_deg: Lon
    size_km: Annotated[float, Field(gt=0, le=40)] = 20


class SkylineResponse(Strict):
    site: Site
    meta: Meta
    skyline: Skyline


class TerrainTileResponse(Strict):
    site: Site
    size_km: float
    width: Literal[256]
    height: Literal[256]
    heights_m_b64: str
    min_m: float
    max_m: float
    site_px: Annotated[list[float], Field(min_length=2, max_length=2)]
    data_label: Literal["REAL", "SYNTHETIC"]


class HealthResponse(Strict):
    status: Literal["ok"]
    app_version: str
    contract_version: Literal["1.0"]
    kernels_loaded: list[str]
    dems_loaded: list[str]
    mock: bool


class ErrorDetail(Strict):
    field: str
    reason: str


class ErrorBody(Strict):
    code: ErrorCode
    message: str
    details: list[ErrorDetail] = Field(default_factory=list)


class ErrorResponse(Strict):
    error: ErrorBody
