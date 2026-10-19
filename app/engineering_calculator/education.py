
"""Educational solution builder for engineering calculations."""

from math import isfinite


def format_value(value):
    """Format numeric values for readable explanations."""
    if isinstance(value, list):
        return ", ".join(format_value(item) for item in value)

    if isinstance(value, (int, float)):
        if not isfinite(value):
            return str(value)
        return f"{value:,.8g}"

    return str(value)


def build_solution(
    formula_name,
    details,
    values,
    input_units,
    result,
    output_result=None,
    output_unit=None,
):
    """Build a structured educational solution for a formula."""

    if output_result is None:
        output_result = result

    if output_unit is None:
        output_unit = details["unit"]

    steps = []

    # Step 1: Formula
    steps.append(
        {
            "title": "1. Formula",
            "content": details["equation"],
        }
    )

    # Step 2: Explain the purpose
    steps.append(
        {
            "title": "2. What are we calculating?",
            "content": details.get(
                "explanation",
                details["description"],
            ),
        }
    )

    # Step 3: Given values
    given_values = []

    for (label, default_unit), value, unit in zip(
        details["inputs"],
        values,
        input_units,
        strict=True,
    ):
        given_values.append(
            f"{label} = {format_value(value)} {unit or default_unit}"
        )

    steps.append(
        {
            "title": "3. Given values",
            "content": "\n".join(given_values),
        }
    )

    # Step 4: Calculation
    # The registered function performs the actual numerical calculation.
    # A formula-specific substitution is provided where supported.
    substitutions = {
        "Speed": lambda v: (
            f"v = {format_value(v[0])} / {format_value(v[1])}"
        ),
        "Acceleration": lambda v: (
            f"a = ({format_value(v[1])} - "
            f"{format_value(v[0])}) / {format_value(v[2])}"
        ),
        "Force": lambda v: (
            f"F = {format_value(v[0])} × {format_value(v[1])}"
        ),
        "Pressure": lambda v: (
            f"P = {format_value(v[0])} / {format_value(v[1])}"
        ),
        "Torque": lambda v: (
            f"T = {format_value(v[0])} × {format_value(v[1])}"
        ),
        "Voltage (Ohm's Law)": lambda v: (
            f"V = {format_value(v[0])} × {format_value(v[1])}"
        ),
        "Electrical Power": lambda v: (
            f"P = {format_value(v[0])} × {format_value(v[1])}"
        ),
        "Kinetic Energy": lambda v: (
            f"KE = 0.5 × {format_value(v[0])} × "
            f"{format_value(v[1])}²"
        ),
        "Final Velocity": lambda v: (
            f"v = {format_value(v[0])} + "
            f"({format_value(v[1])} × {format_value(v[2])})"
        ),
        "Displacement": lambda v: (
            f"s = ({format_value(v[0])} × {format_value(v[2])}) "
            f"+ (0.5 × {format_value(v[1])} × "
            f"{format_value(v[2])}²)"
        ),
        "Weight": lambda v: (
            f"W = {format_value(v[0])} × {format_value(v[1])}"
        ),
        "Momentum": lambda v: (
            f"p = {format_value(v[0])} × {format_value(v[1])}"
        ),
        "Impulse": lambda v: (
            f"J = {format_value(v[0])} × {format_value(v[1])}"
        ),
        "Work": lambda v: (
            f"W = {format_value(v[0])} × {format_value(v[1])} "
            f"× cos({format_value(v[2])})"
        ),
        "Mechanical Power": lambda v: (
            f"P = {format_value(v[0])} / {format_value(v[1])}"
        ),
        "Density": lambda v: (
            f"ρ = {format_value(v[0])} / {format_value(v[1])}"
        ),
        "Normal Stress": lambda v: (
            f"σ = {format_value(v[0])} / {format_value(v[1])}"
        ),
        "Strain": lambda v: (
            f"ε = {format_value(v[0])} / {format_value(v[1])}"
        ),
        "Factor of Safety": lambda v: (
            f"FoS = {format_value(v[0])} / {format_value(v[1])}"
        ),
    }

    if formula_name in substitutions and all(
        isinstance(value, (int, float)) for value in values
    ):
        calculation = substitutions[formula_name](values)
    else:
        calculation = (
            "Apply the registered equation using the given values. "
            "The calculator evaluates the formula using its validated "
            "calculation function."
        )

    steps.append(
        {
            "title": "4. Substitute and calculate",
            "content": calculation,
        }
    )

    # Step 5: Answer
    steps.append(
        {
            "title": "5. Final answer",
            "content": (
                f"{format_value(output_result)} {output_unit}"
            ),
        }
    )

    # Step 6: Conversion, if applicable
    if output_result != result or output_unit != details["unit"]:
        steps.append(
            {
                "title": "6. Unit conversion",
                "content": (
                    f"{format_value(result)} {details['unit']} = "
                    f"{format_value(output_result)} {output_unit}"
                ),
            }
        )

    return steps
