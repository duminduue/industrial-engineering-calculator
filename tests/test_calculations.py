
import pytest

from app.engineering_calculator.calculations import (
    calculate_acceleration,
    calculate_electrical_power,
    calculate_force,
    calculate_kinetic_energy,
    calculate_pressure,
    calculate_speed,
    calculate_torque,
    calculate_voltage,
)


@pytest.mark.parametrize(
    ("distance", "time", "expected"),
    [
        (100, 20, 5),
        (0, 10, 0),
        (1, 2, 0.5),
    ],
)
def test_calculate_speed(distance, time, expected):
    assert calculate_speed(distance, time) == expected


def test_calculate_force():
    assert calculate_force(10, 9.81) == pytest.approx(98.1)


def test_calculate_pressure():
    assert calculate_pressure(100, 2) == 50


def test_calculate_torque():
    assert calculate_torque(20, 0.5) == 10


def test_calculate_voltage():
    assert calculate_voltage(2, 12) == 24


def test_calculate_electrical_power():
    assert calculate_electrical_power(12, 3) == 36


def test_calculate_kinetic_energy():
    assert calculate_kinetic_energy(2, 5) == 25


@pytest.mark.parametrize(
    ("distance", "time"),
    [
        (100, 0),
        (100, -1),
        (-1, 10),
        (float("nan"), 10),
        (float("inf"), 10),
    ],
)
def test_speed_rejects_invalid_inputs(distance, time):
    with pytest.raises(ValueError):
        calculate_speed(distance, time)


@pytest.mark.parametrize(
    ("force", "area"),
    [
        (100, 0),
        (100, -1),
        (-1, 2),
        (float("nan"), 2),
    ],
)
def test_pressure_rejects_invalid_inputs(force, area):
    with pytest.raises(ValueError):
        calculate_pressure(force, area)


@pytest.mark.parametrize(
    ("mass", "acceleration"),
    [
        (-1, 10),
        (10, -1),
        (float("nan"), 10),
        (float("inf"), 10),
    ],
)
def test_force_rejects_invalid_inputs(mass, acceleration):
    with pytest.raises(ValueError):
        calculate_force(mass, acceleration)


@pytest.mark.parametrize(
    ("force", "radius"),
    [
        (-1, 2),
        (10, -1),
        (float("nan"), 2),
    ],
)
def test_torque_rejects_invalid_inputs(force, radius):
    with pytest.raises(ValueError):
        calculate_torque(force, radius)


@pytest.mark.parametrize(
    ("current", "resistance"),
    [
        (-1, 12),
        (2, -1),
        (float("nan"), 12),
    ],
)
def test_voltage_rejects_invalid_inputs(current, resistance):
    with pytest.raises(ValueError):
        calculate_voltage(current, resistance)


@pytest.mark.parametrize(
    ("voltage", "current"),
    [
        (-1, 3),
        (12, -1),
        (float("inf"), 3),
    ],
)
def test_electrical_power_rejects_invalid_inputs(voltage, current):
    with pytest.raises(ValueError):
        calculate_electrical_power(voltage, current)


@pytest.mark.parametrize(
    ("mass", "velocity"),
    [
        (-1, 5),
        (2, -1),
        (float("nan"), 5),
    ],
)
def test_kinetic_energy_rejects_invalid_inputs(mass, velocity):
    with pytest.raises(ValueError):
        calculate_kinetic_energy(mass, velocity)


def test_calculate_acceleration():
    assert calculate_acceleration(0, 20, 5) == 4


def test_calculate_acceleration_with_negative_velocity():
    assert calculate_acceleration(10, -5, 3) == -5


def test_acceleration_rejects_zero_time():
    with pytest.raises(ValueError):
        calculate_acceleration(0, 20, 0)


@pytest.mark.parametrize(
    ("initial_velocity", "final_velocity", "time"),
    [
        (float("nan"), 10, 2),
        (0, float("inf"), 2),
        (0, 10, float("nan")),
        (0, 10, -1),
    ],
)
def test_acceleration_rejects_invalid_inputs(
    initial_velocity,
    final_velocity,
    time,
):
    with pytest.raises(ValueError):
        calculate_acceleration(initial_velocity, final_velocity, time)
