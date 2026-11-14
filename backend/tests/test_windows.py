import numpy as np
import pytest

from app.metrics import Window, intersect_windows, longest_gap_hours, visibility_windows

H = 3600.0


def t_hours(n):
    return np.arange(n, dtype=float) * H


def test_two_windows_interpolated_edges_and_censor():
    t = t_hours(6)
    m = np.array([-1, 1, 3, -1, -1, 2], dtype=float)
    w = visibility_windows(t, m)
    assert len(w) == 2
    assert w[0].start_unix == pytest.approx(1800, abs=1)
    assert w[0].end_unix == pytest.approx(9900, abs=1)
    assert (w[0].start_censored, w[0].end_censored) == (False, False)
    assert w[1].start_unix == pytest.approx(15600, abs=1)
    assert w[1].end_unix == pytest.approx(18000)
    assert (w[1].start_censored, w[1].end_censored) == (False, True)
    assert w[0].hours == pytest.approx(2.25)


def test_single_sample_run_interpolates_both_sides():
    w = visibility_windows(t_hours(3), np.array([-1.0, 2.0, -2.0]))
    assert len(w) == 1
    assert w[0].start_unix == pytest.approx(1200, abs=1)
    assert w[0].end_unix == pytest.approx(5400, abs=1)


def test_all_visible_is_one_censored_window():
    w = visibility_windows(t_hours(4), np.ones(4))
    assert w == [Window(0.0, 3 * H, True, True)]


def test_never_visible_and_zero_margin_is_not_visible():
    assert visibility_windows(t_hours(4), -np.ones(4)) == []
    assert visibility_windows(t_hours(4), np.zeros(4)) == []


def test_zero_margin_boundary_sample_not_visible():
    w = visibility_windows(t_hours(4), np.array([0.0, 1.0, 1.0, 0.0]))
    assert len(w) == 1
    assert w[0].start_unix == pytest.approx(0)  # crossing exactly at the zero-margin sample
    assert w[0].end_unix == pytest.approx(3 * H)
    assert not w[0].start_censored and not w[0].end_censored


def test_non_uniform_last_step_uses_actual_times():
    t = np.array([0, 3600, 7200, 9000], dtype=float)  # last step 1800 s
    w = visibility_windows(t, np.array([1.0, 1.0, 1.0, -1.0]))
    assert w[0].end_unix == pytest.approx(8100, abs=1)  # 7200 + 1800*0.5
    assert w[0].start_censored and not w[0].end_censored


@pytest.mark.parametrize("t,m", [
    (np.array([0.0]), np.array([1.0])),
    (np.array([]), np.array([])),
    (np.array([0.0, 2.0, 1.0]), np.ones(3)),
    (np.array([0.0, 1.0, 1.0]), np.ones(3)),
    (np.array([0.0, 1.0]), np.ones(3)),
    (np.array([0.0, 1.0]), np.array([1.0, np.nan])),
])
def test_invalid_input_raises(t, m):
    with pytest.raises(ValueError):
        visibility_windows(t, m)


def test_to_contract():
    d = Window(1800.4, 10800.0, False, True).to_contract()
    assert d == {"start": "1970-01-01T00:30:00Z", "end": "1970-01-01T03:00:00Z",
                 "hours": 2.5, "start_censored": False, "end_censored": True}


def test_intersect_basic_and_censor_flags():
    a = [Window(0, 10 * H, True, False), Window(20 * H, 30 * H, False, True)]
    b = [Window(5 * H, 25 * H, False, False)]
    r = intersect_windows(a, b)
    assert r == [Window(5 * H, 10 * H, False, False), Window(20 * H, 25 * H, False, False)]
    r2 = intersect_windows(a, [Window(0, 30 * H, True, True)])
    assert r2 == a
    assert intersect_windows(a, []) == []
    assert intersect_windows([Window(0, H, False, False)], [Window(H, 2 * H, False, False)]) == []


def test_longest_gap_includes_censored_edges():
    w = [Window(1800, 9900, False, False), Window(15600, 18000, False, True)]
    assert longest_gap_hours(w, 0, 18000) == pytest.approx(5700 / H)
    assert longest_gap_hours([Window(10 * H, 12 * H, False, False)], 0, 24 * H) == pytest.approx(12.0)
    assert longest_gap_hours([Window(0, 12 * H, True, False)], 0, 24 * H) == pytest.approx(12.0)
    assert longest_gap_hours([], 0, 5 * H) == pytest.approx(5.0)
    assert longest_gap_hours([Window(0, 5 * H, True, True)], 0, 5 * H) == 0.0
