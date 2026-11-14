"""Allowlisted derived lunar map assets; raw DEMs and arbitrary paths are never served."""
import json

from fastapi import APIRouter, Request
from fastapi.responses import FileResponse

from app.api.errors import ApiError

router = APIRouter()
PNG = 'south_pole_hillshade_2048.png'


def _paths(request: Request):
    settings = request.app.state.settings
    png = settings.data_dir / 'dem' / PNG
    sidecar = png.with_suffix('.json')
    if settings.use_mock or not png.is_file() or not sidecar.is_file():
        raise ApiError('NOT_FOUND', 'Verified lunar hillshade is not installed on this server.', http=404)
    return png, sidecar


@router.get('/assets/lunar/south-pole-hillshade.png')
def image(request: Request):
    png, _ = _paths(request)
    return FileResponse(png, media_type='image/png', headers={'Cache-Control': 'no-cache'})


@router.get('/assets/lunar/south-pole-hillshade.json')
def metadata(request: Request):
    _, sidecar = _paths(request)
    result = json.loads(sidecar.read_text(encoding='utf-8'))
    result.update({'data_label': 'REAL', 'image_path': '/assets/lunar/south-pole-hillshade.png',
                   'source_url': 'https://pgda.gsfc.nasa.gov/products/90',
                   'citation': 'NASA LOLA / Barker et al. 2023, PGDA product 90',
                   'method': 'Derived hillshade of 160 m DEM; not a photograph or illumination prediction.'})
    return result
