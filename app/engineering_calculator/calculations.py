
"""Engineering calculations with validated numeric inputs."""

import math
from functools import wraps


def _validate_finite(**values):
    """Reject booleans, non-numeric values, NaN, and infinity."""
    for name, value in values.items():
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{name} must be a number.")
        if not math.isfinite(value):
            raise ValueError(f"{name} must be a finite number.")


def _validate_non_negative(**values):
    """Validate quantities that cannot be negative."""
    _validate_finite(**values)
    for name, value in values.items():
        if value < 0:
            raise ValueError(f"{name} cannot be negative.")


def _validate_positive(**values):
    """Validate quantities that must be greater than zero."""
    _validate_finite(**values)
    for name, value in values.items():
        if value <= 0:
            raise ValueError(f"{name} must be greater than zero.")


def _validate_result(result):
    """Reject calculation results that are not finite numbers."""
    if isinstance(result, bool) or not isinstance(result, (int, float)):
        raise ValueError("Calculation result must be a number.")
    try:
        finite = math.isfinite(result)
    except OverflowError as exc:
        raise ValueError(
            "Calculation result is too large or not finite."
        ) from exc
    if not finite:
        raise ValueError("Calculation result is too large or not finite.")
    return result


def _validate_calculation_result(function):
    """Validate every public calculation result and normalize overflow errors."""
    @wraps(function)
    def wrapper(*args, **kwargs):
        try:
            result = function(*args, **kwargs)
        except OverflowError as exc:
            raise ValueError(
                "Calculation result is too large or not finite."
            ) from exc
        return _validate_result(result)

    return wrapper



# MOTION AND KINEMATICS

@_validate_calculation_result
def calculate_speed(distance_m, time_s):
    _validate_non_negative(distance_m=distance_m)
    _validate_positive(time_s=time_s)
    return _validate_result(distance_m / time_s)


@_validate_calculation_result
def calculate_acceleration(initial_velocity_m_s, final_velocity_m_s, time_s):
    _validate_finite(
        initial_velocity_m_s=initial_velocity_m_s,
        final_velocity_m_s=final_velocity_m_s,
    )
    _validate_positive(time_s=time_s)
    return (final_velocity_m_s - initial_velocity_m_s) / time_s


@_validate_calculation_result
def calculate_final_velocity(initial_velocity_m_s, acceleration_m_s2, time_s):
    _validate_finite(
        initial_velocity_m_s=initial_velocity_m_s,
        acceleration_m_s2=acceleration_m_s2,
    )
    _validate_non_negative(time_s=time_s)
    return initial_velocity_m_s + acceleration_m_s2 * time_s


@_validate_calculation_result
def calculate_displacement(initial_velocity_m_s, acceleration_m_s2, time_s):
    _validate_finite(
        initial_velocity_m_s=initial_velocity_m_s,
        acceleration_m_s2=acceleration_m_s2,
    )
    _validate_non_negative(time_s=time_s)
    return initial_velocity_m_s * time_s + 0.5 * acceleration_m_s2 * time_s**2


@_validate_calculation_result
def calculate_average_velocity(displacement_m, time_s):
    _validate_finite(displacement_m=displacement_m)
    _validate_positive(time_s=time_s)
    return displacement_m / time_s


@_validate_calculation_result
def calculate_free_fall_distance(time_s, gravity_m_s2=9.80665):
    """Distance fallen from rest, ignoring air resistance."""
    _validate_non_negative(time_s=time_s)
    _validate_positive(gravity_m_s2=gravity_m_s2)
    return 0.5 * gravity_m_s2 * time_s**2


# MECHANICS

@_validate_calculation_result
def calculate_force(mass_kg, acceleration_m_s2):
    _validate_non_negative(
        mass_kg=mass_kg,
        acceleration_m_s2=acceleration_m_s2,
    )
    return _validate_result(mass_kg * acceleration_m_s2)


@_validate_calculation_result
def calculate_weight(mass_kg, gravity_m_s2=9.80665):
    _validate_non_negative(mass_kg=mass_kg, gravity_m_s2=gravity_m_s2)
    return mass_kg * gravity_m_s2


@_validate_calculation_result
def calculate_mass_from_weight(weight_n, gravity_m_s2=9.80665):
    _validate_non_negative(weight_n=weight_n)
    _validate_positive(gravity_m_s2=gravity_m_s2)
    return weight_n / gravity_m_s2


@_validate_calculation_result
def calculate_pressure(force_n, area_m2):
    _validate_non_negative(force_n=force_n)
    _validate_positive(area_m2=area_m2)
    return force_n / area_m2


@_validate_calculation_result
def calculate_torque(force_n, radius_m):
    _validate_non_negative(force_n=force_n, radius_m=radius_m)
    return force_n * radius_m


@_validate_calculation_result
def calculate_work(force_n, displacement_m, angle_degrees=0):
    """Work by a constant force: W = F*s*cos(theta)."""
    _validate_non_negative(force_n=force_n, displacement_m=displacement_m)
    _validate_finite(angle_degrees=angle_degrees)
    return force_n * displacement_m * math.cos(math.radians(angle_degrees))


@_validate_calculation_result
def calculate_mechanical_power(work_j, time_s):
    _validate_finite(work_j=work_j)
    _validate_positive(time_s=time_s)
    return work_j / time_s


@_validate_calculation_result
def calculate_momentum(mass_kg, velocity_m_s):
    _validate_non_negative(mass_kg=mass_kg)
    _validate_finite(velocity_m_s=velocity_m_s)
    return mass_kg * velocity_m_s


@_validate_calculation_result
def calculate_impulse(force_n, time_s):
    _validate_finite(force_n=force_n)
    _validate_non_negative(time_s=time_s)
    return force_n * time_s


@_validate_calculation_result
def calculate_friction_force(coefficient, normal_force_n):
    _validate_non_negative(coefficient=coefficient, normal_force_n=normal_force_n)
    return coefficient * normal_force_n


@_validate_calculation_result
def calculate_centripetal_force(mass_kg, velocity_m_s, radius_m):
    _validate_non_negative(mass_kg=mass_kg, velocity_m_s=velocity_m_s)
    _validate_positive(radius_m=radius_m)
    return mass_kg * velocity_m_s**2 / radius_m



@_validate_calculation_result
def calculate_kinetic_energy(mass_kg, velocity_m_s):
    _validate_non_negative(
        mass_kg=mass_kg,
        velocity_m_s=velocity_m_s,
    )

    try:
        result = 0.5 * mass_kg * velocity_m_s**2
    except OverflowError as exc:
        raise ValueError(
            "Calculation result is too large or not finite."
        ) from exc

    return _validate_result(result)



@_validate_calculation_result
def calculate_potential_energy(mass_kg, height_m, gravity_m_s2=9.80665):
    _validate_non_negative(mass_kg=mass_kg, height_m=height_m)
    _validate_non_negative(gravity_m_s2=gravity_m_s2)
    return mass_kg * gravity_m_s2 * height_m


# ELECTRICAL ENGINEERING

@_validate_calculation_result
def calculate_voltage(current_a, resistance_ohm):
    _validate_non_negative(
        current_a=current_a,
        resistance_ohm=resistance_ohm,
    )
    return current_a * resistance_ohm


@_validate_calculation_result
def calculate_current(voltage_v, resistance_ohm):
    _validate_finite(voltage_v=voltage_v)
    _validate_positive(resistance_ohm=resistance_ohm)
    return voltage_v / resistance_ohm


@_validate_calculation_result
def calculate_resistance(voltage_v, current_a):
    _validate_finite(voltage_v=voltage_v, current_a=current_a)
    if current_a == 0:
        raise ValueError("Current must not be zero.")
    return voltage_v / current_a


@_validate_calculation_result
def calculate_electrical_power(voltage_v, current_a):
    _validate_non_negative(voltage_v=voltage_v, current_a=current_a)
    return voltage_v * current_a


@_validate_calculation_result
def calculate_electrical_energy(power_w, time_s):
    _validate_non_negative(power_w=power_w, time_s=time_s)
    return power_w * time_s


@_validate_calculation_result
def calculate_charge(current_a, time_s):
    _validate_finite(current_a=current_a)
    _validate_non_negative(time_s=time_s)
    return current_a * time_s


@_validate_calculation_result
def calculate_series_resistance(resistances_ohm):
    """Total resistance of resistors in series."""
    values = list(resistances_ohm)
    if not values:
        raise ValueError("Provide at least one resistance.")
    _validate_non_negative(
        **{f"resistance_{i}": value for i, value in enumerate(values)}
    )
    return sum(values)


@_validate_calculation_result
def calculate_parallel_resistance(resistances_ohm):
    """Total resistance of resistors in parallel."""
    values = list(resistances_ohm)
    if not values:
        raise ValueError("Provide at least one resistance.")
    _validate_positive(
        **{f"resistance_{i}": value for i, value in enumerate(values)}
    )
    return 1 / sum(1 / value for value in values)


# FLUID MECHANICS

@_validate_calculation_result
def calculate_density(mass_kg, volume_m3):
    _validate_non_negative(mass_kg=mass_kg)
    _validate_positive(volume_m3=volume_m3)
    return mass_kg / volume_m3


@_validate_calculation_result
def calculate_specific_weight(density_kg_m3, gravity_m_s2=9.80665):
    _validate_non_negative(
        density_kg_m3=density_kg_m3,
        gravity_m_s2=gravity_m_s2,
    )
    return density_kg_m3 * gravity_m_s2


@_validate_calculation_result
def calculate_hydrostatic_pressure(
    density_kg_m3, depth_m, gravity_m_s2=9.80665
):
    """Gauge pressure in a stationary fluid."""
    _validate_non_negative(density_kg_m3=density_kg_m3, depth_m=depth_m)
    _validate_non_negative(gravity_m_s2=gravity_m_s2)
    return density_kg_m3 * gravity_m_s2 * depth_m


@_validate_calculation_result
def calculate_volumetric_flow_rate(volume_m3, time_s):
    _validate_non_negative(volume_m3=volume_m3)
    _validate_positive(time_s=time_s)
    return volume_m3 / time_s


@_validate_calculation_result
def calculate_continuity_velocity(area_in_m2, velocity_in_m_s, area_out_m2):
    """For steady, incompressible flow: A1*v1 = A2*v2."""
    _validate_positive(
        area_in_m2=area_in_m2,
        velocity_in_m_s=velocity_in_m_s,
        area_out_m2=area_out_m2,
    )
    return area_in_m2 * velocity_in_m_s / area_out_m2


@_validate_calculation_result
def calculate_hydraulic_power(pressure_pa, flow_rate_m3_s):
    _validate_non_negative(pressure_pa=pressure_pa, flow_rate_m3_s=flow_rate_m3_s)
    return pressure_pa * flow_rate_m3_s


# THERMODYNAMICS AND HEAT

@_validate_calculation_result
def calculate_heat_energy(mass_kg, specific_heat_j_kg_k, temperature_change_k):
    _validate_non_negative(
        mass_kg=mass_kg,
        specific_heat_j_kg_k=specific_heat_j_kg_k,
    )
    _validate_finite(temperature_change_k=temperature_change_k)
    return mass_kg * specific_heat_j_kg_k * temperature_change_k


@_validate_calculation_result
def calculate_thermal_expansion(
    length_m, expansion_coefficient_per_k, temperature_change_k
):
    _validate_non_negative(
        length_m=length_m,
        expansion_coefficient_per_k=expansion_coefficient_per_k,
    )
    _validate_finite(temperature_change_k=temperature_change_k)
    return length_m * expansion_coefficient_per_k * temperature_change_k


@_validate_calculation_result
def calculate_ideal_gas_pressure(moles, temperature_k, volume_m3):
    """Ideal gas law using R = 8.314462618 J/(mol K)."""
    _validate_non_negative(moles=moles)
    _validate_positive(temperature_k=temperature_k, volume_m3=volume_m3)
    return moles * 8.314462618 * temperature_k / volume_m3


@_validate_calculation_result
def calculate_efficiency(useful_output, total_input):
    _validate_non_negative(useful_output=useful_output)
    _validate_positive(total_input=total_input)
    if useful_output > total_input:
        raise ValueError("Useful output cannot exceed total input.")
    return useful_output / total_input * 100


@_validate_calculation_result
def celsius_to_fahrenheit(temperature_c):
    _validate_finite(temperature_c=temperature_c)
    if temperature_c < -273.15:
        raise ValueError("Temperature cannot be below absolute zero.")
    return temperature_c * 9 / 5 + 32


@_validate_calculation_result
def fahrenheit_to_celsius(temperature_f):
    _validate_finite(temperature_f=temperature_f)
    if temperature_f < -459.67:
        raise ValueError("Temperature cannot be below absolute zero.")
    return (temperature_f - 32) * 5 / 9


@_validate_calculation_result
def celsius_to_kelvin(temperature_c):
    _validate_finite(temperature_c=temperature_c)
    result = temperature_c + 273.15
    if result < 0:
        raise ValueError("Temperature cannot be below absolute zero.")
    return result


@_validate_calculation_result
def kelvin_to_celsius(temperature_k):
    _validate_non_negative(temperature_k=temperature_k)
    return temperature_k - 273.15


# MATERIALS AND MACHINE DESIGN

@_validate_calculation_result
def calculate_normal_stress(force_n, area_m2):
    _validate_finite(force_n=force_n)
    _validate_positive(area_m2=area_m2)
    return force_n / area_m2


@_validate_calculation_result
def calculate_strain(change_in_length_m, original_length_m):
    _validate_finite(change_in_length_m=change_in_length_m)
    _validate_positive(original_length_m=original_length_m)
    return change_in_length_m / original_length_m


@_validate_calculation_result
def calculate_youngs_modulus(stress_pa, strain):
    _validate_finite(stress_pa=stress_pa, strain=strain)
    if strain == 0:
        raise ValueError("Strain must not be zero.")
    return stress_pa / strain


@_validate_calculation_result
def calculate_factor_of_safety(failure_strength_pa, working_stress_pa):
    _validate_positive(
        failure_strength_pa=failure_strength_pa,
        working_stress_pa=working_stress_pa,
    )
    return failure_strength_pa / working_stress_pa


@_validate_calculation_result
def calculate_spring_force(spring_constant_n_m, displacement_m):
    _validate_non_negative(spring_constant_n_m=spring_constant_n_m)
    _validate_finite(displacement_m=displacement_m)
    return spring_constant_n_m * displacement_m


@_validate_calculation_result
def calculate_spring_energy(spring_constant_n_m, displacement_m):
    _validate_non_negative(spring_constant_n_m=spring_constant_n_m)
    _validate_finite(displacement_m=displacement_m)
    return 0.5 * spring_constant_n_m * displacement_m**2
