
import math

import pytest

from app.engineering_calculator.calculations import (
    calculate_acceleration,
    calculate_current,
    calculate_density,
    calculate_efficiency,
    calculate_final_velocity,
    calculate_heat_energy,
    calculate_mass_from_weight,
    calculate_mechanical_power,
    calculate_momentum,
    calculate_normal_stress,
    calculate_potential_energy,
    calculate_resistance,
    calculate_strain,
    calculate_weight,
)


@pytest.mark.parametrize(
    ("function", "args"),
    [
        (calculate_acceleration, (1e308, -1e308, 1e-308)),
        (calculate_final_velocity, (1e308, 1e308, 1e308)),
        (calculate_current, (1e308, 1e-308)),
        (calculate_density, (1e308, 1e-308)),
        (calculate_mass_from_weight, (1e308, 1e-308)),
        (calculate_mechanical_power, (1e308, 1e-308)),
        (calculate_momentum, (1e308, 1e308)),
        (calculate_normal_stress, (1e308, 1e-308)),
        (calculate_potential_energy, (1e308, 1e308)),
        (calculate_resistance, (1e308, 1e-308)),
        (calculate_strain, (1e308, 1e-308)),
        (calculate_weight, (1e308, 1e308)),
    ],
)
def test_calculations_do_not_return_non_finite_results(function, args):
    try:
        result = function(*args)
    except (ValueError, OverflowError, ZeroDivisionError):
        return

    assert math.isfinite(result), (
        f"{function.__name__} returned a non-finite result: {result}"
    )


def test_efficiency_is_between_zero_and_one_hundred():
    assert calculate_efficiency(0, 100) == 0
    assert calculate_efficiency(50, 100) == 50
    assert calculate_efficiency(100, 100) == 100


def test_heat_energy_allows_negative_temperature_change():
    assert calculate_heat_energy(2, 100, -5) == -1000
