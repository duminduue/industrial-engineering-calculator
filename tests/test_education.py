

from app.engineering_calculator.education import build_solution
from app.engineering_calculator.registry import FORMULA_REGISTRY


def test_speed_solution_contains_formula_and_answer():
    details = FORMULA_REGISTRY["Motion"]["Speed"]

    steps = build_solution(
        formula_name="Speed",
        details=details,
        values=[100, 5],
        input_units=["m", "s"],
        result=20,
        output_result=20,
        output_unit="m/s",
    )

    assert steps[0]["title"] == "1. Formula"
    assert steps[0]["content"] == details["equation"]
    assert any(
        "100" in step["content"] and "5" in step["content"]
        for step in steps
    )
    assert any(
        "20 m/s" in step["content"]
        for step in steps
    )


def test_acceleration_solution_uses_velocity_change():
    details = FORMULA_REGISTRY["Motion"]["Acceleration"]

    steps = build_solution(
        formula_name="Acceleration",
        details=details,
        values=[0, 20, 5],
        input_units=["m/s", "m/s", "s"],
        result=4,
        output_result=4,
        output_unit="m/s²",
    )

    calculation_step = next(
        step
        for step in steps
        if step["title"] == "4. Substitute and calculate"
    )

    assert "20" in calculation_step["content"]
    assert "5" in calculation_step["content"]
    assert "0" in calculation_step["content"]


def test_solution_contains_given_values():
    details = FORMULA_REGISTRY["Motion"]["Speed"]

    steps = build_solution(
        formula_name="Speed",
        details=details,
        values=[100, 5],
        input_units=["m", "s"],
        result=20,
    )

    given_step = next(
        step for step in steps if step["title"] == "3. Given values"
    )

    assert "Distance = 100 m" in given_step["content"]
    assert "Time = 5 s" in given_step["content"]


def test_solution_shows_unit_conversion():
    details = FORMULA_REGISTRY["Motion"]["Speed"]

    steps = build_solution(
        formula_name="Speed",
        details=details,
        values=[100, 5],
        input_units=["m", "s"],
        result=20,
        output_result=72,
        output_unit="km/h",
    )

    conversion_step = next(
        step
        for step in steps
        if step["title"] == "6. Unit conversion"
    )

    assert "20" in conversion_step["content"]
    assert "72 km/h" in conversion_step["content"]


def test_solution_uses_registered_description():
    details = FORMULA_REGISTRY["Motion"]["Speed"]

    steps = build_solution(
        formula_name="Speed",
        details=details,
        values=[100, 5],
        input_units=["m", "s"],
        result=20,
    )

    explanation_step = next(
        step
        for step in steps
        if step["title"] == "2. What are we calculating?"
    )

    assert explanation_step["content"] == details["explanation"] or (
        explanation_step["content"] == details["description"]
    )
