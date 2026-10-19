
"""Reusable engineering unit conversion utilities."""

import math

# Each unit is represented by:
# (dimension, scale_to_base, offset_to_base)
# Conversion: base_value = value * scale + offset
UNITS = {
    # Length: base unit m
    "m": ("length", 1.0, 0.0),
    "km": ("length", 1000.0, 0.0),
    "cm": ("length", 0.01, 0.0),
    "mm": ("length", 0.001, 0.0),
    "um": ("length", 1e-6, 0.0),
    "in": ("length", 0.0254, 0.0),
    "ft": ("length", 0.3048, 0.0),

    # Area: base unit m²
    "m²": ("area", 1.0, 0.0),
    "cm²": ("area", 1e-4, 0.0),
    "mm²": ("area", 1e-6, 0.0),
    "ft²": ("area", 0.09290304, 0.0),
    "in²": ("area", 0.00064516, 0.0),

    # Volume: base unit m³
    "m³": ("volume", 1.0, 0.0),
    "L": ("volume", 0.001, 0.0),
    "mL": ("volume", 1e-6, 0.0),
    "cm³": ("volume", 1e-6, 0.0),
    "ft³": ("volume", 0.028316846592, 0.0),

    # Time: base unit s
    "s": ("time", 1.0, 0.0),
    "min": ("time", 60.0, 0.0),
    "h": ("time", 3600.0, 0.0),
    "ms": ("time", 0.001, 0.0),

    # Mass: base unit kg
    "kg": ("mass", 1.0, 0.0),
    "g": ("mass", 0.001, 0.0),
    "mg": ("mass", 1e-6, 0.0),
    "tonne": ("mass", 1000.0, 0.0),
    "lb": ("mass", 0.45359237, 0.0),

    # Velocity: base unit m/s
    "m/s": ("velocity", 1.0, 0.0),
    "km/h": ("velocity", 1 / 3.6, 0.0),
    "mph": ("velocity", 0.44704, 0.0),
    "ft/s": ("velocity", 0.3048, 0.0),

    # Acceleration: base unit m/s²
    "m/s²": ("acceleration", 1.0, 0.0),
    "ft/s²": ("acceleration", 0.3048, 0.0),

    # Force: base unit N
    "N": ("force", 1.0, 0.0),
    "kN": ("force", 1000.0, 0.0),
    "lbf": ("force", 4.4482216152605, 0.0),

    # Pressure/stress: base unit Pa
    "Pa": ("pressure", 1.0, 0.0),
    "kPa": ("pressure", 1000.0, 0.0),
    "MPa": ("pressure", 1e6, 0.0),
    "GPa": ("pressure", 1e9, 0.0),
    "bar": ("pressure", 100000.0, 0.0),
    "psi": ("pressure", 6894.757293168, 0.0),
    "atm": ("pressure", 101325.0, 0.0),

    # Energy/work: base unit J
    "J": ("energy", 1.0, 0.0),
    "kJ": ("energy", 1000.0, 0.0),
    "MJ": ("energy", 1e6, 0.0),
    "Wh": ("energy", 3600.0, 0.0),
    "kWh": ("energy", 3.6e6, 0.0),
    "cal": ("energy", 4.184, 0.0),

    # Power: base unit W
    "W": ("power", 1.0, 0.0),
    "kW": ("power", 1000.0, 0.0),
    "MW": ("power", 1e6, 0.0),
    "hp": ("power", 745.6998715822702, 0.0),

    # Torque: base unit N·m
    "N·m": ("torque", 1.0, 0.0),
    "kN·m": ("torque", 1000.0, 0.0),
    "lbf·ft": ("torque", 1.3558179483314, 0.0),

    # Electrical
    "V": ("voltage", 1.0, 0.0),
    "mV": ("voltage", 0.001, 0.0),
    "kV": ("voltage", 1000.0, 0.0),
    "A": ("current", 1.0, 0.0),
    "mA": ("current", 0.001, 0.0),
    "kA": ("current", 1000.0, 0.0),
    "Ω": ("resistance", 1.0, 0.0),
    "kΩ": ("resistance", 1000.0, 0.0),
    "MΩ": ("resistance", 1e6, 0.0),
    "C": ("charge", 1.0, 0.0),
    "mAh": ("charge", 3.6, 0.0),

    # Density, flow and thermal quantities
    "kg/m³": ("density", 1.0, 0.0),
    "g/cm³": ("density", 1000.0, 0.0),
    "m³/s": ("flow_rate", 1.0, 0.0),
    "L/s": ("flow_rate", 0.001, 0.0),
    "L/min": ("flow_rate", 0.001 / 60, 0.0),
    "kg/m²": ("mass_per_area", 1.0, 0.0),
    "K": ("temperature", 1.0, 0.0),
    "°C": ("temperature", 1.0, 273.15),
    "°F": ("temperature", 5 / 9, 255.3722222222222),

    # Frequency and dimensionless quantities
    "Hz": ("frequency", 1.0, 0.0),
    "kHz": ("frequency", 1000.0, 0.0),
    "%": ("dimensionless", 0.01, 0.0),
    "ratio": ("dimensionless", 1.0, 0.0),
}


def convert_unit(value, from_unit, to_unit):
    """Convert a numeric value between compatible units."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("Value must be a number.")
    if not math.isfinite(value):
        raise ValueError("Value must be finite.")

    if from_unit not in UNITS:
        raise ValueError(f"Unsupported unit: {from_unit}")
    if to_unit not in UNITS:
        raise ValueError(f"Unsupported unit: {to_unit}")

    source_dimension, source_scale, source_offset = UNITS[from_unit]
    target_dimension, target_scale, target_offset = UNITS[to_unit]

    if source_dimension != target_dimension:
        raise ValueError(
            f"Incompatible units: {from_unit} cannot be converted to {to_unit}."
        )

    base_value = value * source_scale + source_offset
    result = (base_value - target_offset) / target_scale

    if not math.isfinite(result):
        raise ValueError("Conversion result is not finite.")

    if target_dimension == "temperature" and result < 0:
        raise ValueError("Temperature cannot be below absolute zero.")

    return result


def get_units(dimension=None):
    """Return all supported units, optionally filtered by dimension."""
    if dimension is None:
        return list(UNITS)

    return [
        unit
        for unit, details in UNITS.items()
        if details[0] == dimension
    ]


def get_unit_dimension(unit):
    """Return a unit's dimension, or raise an error if unknown."""
    if unit not in UNITS:
        raise ValueError(f"Unsupported unit: {unit}")
    return UNITS[unit][0]
