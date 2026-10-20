import pytest

from app.engineering_calculator.registry import (
    FORMULA_REGISTRY,
    get_formula,
    search_formulas,
)


def test_registry_contains_all_categories():
    expected_categories = {
        "Motion",
        "Mechanics",
        "Electrical",
        "Circuits",
        "Fluid Mechanics",
        "Thermodynamics",
        "Temperature Conversion",
        "Materials and Machine Design",
        "Rotational Motion",
        "Industrial Engineering",
    }

    assert set(FORMULA_REGISTRY) == expected_categories


def test_registry_contains_expected_number_of_formulas():
    total = sum(len(formulas) for formulas in FORMULA_REGISTRY.values())

    # The expanded registry contains 55 formulas.
    assert total == 55


def test_every_formula_has_required_metadata():
    required_fields = {
        "description",
        "equation",
        "unit",
        "inputs",
        "input_keys",
        "input_dimensions",
        "output_dimension",
        "function",
        "keywords",
        "explanation",
    }

    for category, formulas in FORMULA_REGISTRY.items():
        for name, details in formulas.items():
            assert required_fields.issubset(details), (
                f"Missing metadata in {category} / {name}"
            )
            assert callable(details["function"])
            assert details["description"]
            assert details["equation"]
            assert details["unit"]
            assert len(details["inputs"]) == len(details["input_keys"])
            assert len(details["inputs"]) == len(details["input_dimensions"])


def test_formula_search_by_name():
    results = search_formulas("kinetic energy")

    assert any(item["name"] == "Kinetic Energy" for item in results)


def test_formula_search_by_keyword():
    results = search_formulas("gravity")

    assert results
    assert any(
        "gravity" in " ".join(item["keywords"]).lower()
        for item in results
    )


def test_formula_search_is_case_insensitive():
    assert search_formulas("SPEED") == search_formulas("speed")


def test_empty_search_returns_all_formulas():
    results = search_formulas("")
    total = sum(len(formulas) for formulas in FORMULA_REGISTRY.values())

    assert len(results) == total


def test_get_formula_returns_correct_definition():
    formula = get_formula("Motion", "Speed")

    assert formula["equation"] == "v = d / t"
    assert formula["unit"] == "m/s"


def test_get_formula_rejects_unknown_formula():
    with pytest.raises(ValueError):
        get_formula("Motion", "Unknown Formula")


def test_registry_functions_return_expected_results():
    expected_results = {
        ("Motion", "Speed"): ([100, 5], 20),
        ("Motion", "Acceleration"): ([0, 20, 5], 4),
        ("Motion", "Final Velocity"): ([0, 2, 5], 10),
        ("Motion", "Displacement"): ([0, 2, 5], 25),
        ("Motion", "Average Velocity"): ([100, 5], 20),
        ("Motion", "Free-Fall Distance"): ([2, 9.80665], 19.6133),
        ("Mechanics", "Force"): ([10, 2], 20),
        ("Mechanics", "Weight"): ([10, 9.80665], 98.0665),
        ("Mechanics", "Mass from Weight"): ([98.0665, 9.80665], 10),
        ("Mechanics", "Pressure"): ([100, 2], 50),
        ("Mechanics", "Torque"): ([10, 2], 20),
        ("Mechanics", "Work"): ([10, 2, 0], 20),
        ("Mechanics", "Mechanical Power"): ([100, 5], 20),
        ("Mechanics", "Momentum"): ([10, 2], 20),
        ("Mechanics", "Impulse"): ([10, 2], 20),
        ("Mechanics", "Friction Force"): ([0.5, 10], 5),
        ("Mechanics", "Centripetal Force"): ([2, 4, 2], 16),
        ("Mechanics", "Kinetic Energy"): ([2, 3], 9),
        ("Mechanics", "Potential Energy"): ([2, 5, 10], 100),
        ("Electrical", "Voltage (Ohm's Law)"): ([2, 5], 10),
        ("Electrical", "Current (Ohm's Law)"): ([10, 2], 5),
        ("Electrical", "Resistance (Ohm's Law)"): ([10, 2], 5),
        ("Electrical", "Electrical Power"): ([12, 2], 24),
        ("Electrical", "Electrical Energy"): ([10, 5], 50),
        ("Electrical", "Electric Charge"): ([2, 5], 10),
        ("Circuits", "Series Resistance"): ([[2, 3, 5]], 10),
        ("Circuits", "Parallel Resistance"): ([[6, 3]], 2),
        ("Fluid Mechanics", "Density"): ([10, 2], 5),
        ("Fluid Mechanics", "Specific Weight"): ([2, 10], 20),
        ("Fluid Mechanics", "Hydrostatic Pressure"): ([1000, 2, 10], 20000),
        ("Fluid Mechanics", "Volumetric Flow Rate"): ([10, 2], 5),
        ("Fluid Mechanics", "Continuity Equation Velocity"): ([4, 2, 2], 4),
        ("Fluid Mechanics", "Hydraulic Power"): ([100, 2], 200),
        ("Thermodynamics", "Heat Energy"): ([2, 3, 4], 24),
        ("Thermodynamics", "Thermal Expansion"): ([2, 0.001, 10], 0.02),
        ("Thermodynamics", "Ideal Gas Pressure"): ([1, 300, 0.1], 24943.387854),
        ("Thermodynamics", "Efficiency"): ([80, 100], 80),
        ("Temperature Conversion", "Celsius to Fahrenheit"): ([25], 77),
        ("Temperature Conversion", "Fahrenheit to Celsius"): ([77], 25),
        ("Temperature Conversion", "Celsius to Kelvin"): ([25], 298.15),
        ("Temperature Conversion", "Kelvin to Celsius"): ([298.15], 25),
        ("Materials and Machine Design", "Normal Stress"): ([100, 2], 50),
        ("Materials and Machine Design", "Strain"): ([0.1, 2], 0.05),
        ("Materials and Machine Design", "Young's Modulus"): ([100, 0.5], 200),
        ("Materials and Machine Design", "Factor of Safety"): ([200, 100], 2),
        ("Materials and Machine Design", "Spring Force"): ([10, 2], 20),
        ("Materials and Machine Design", "Spring Potential Energy"): ([10, 2], 20),

        # Rotational Motion
        ("Rotational Motion", "Angular Velocity"): ([10, 2], 5),
        ("Rotational Motion", "Angular Acceleration"): ([2, 10, 4], 2),
        ("Rotational Motion", "Rotational Kinetic Energy"): ([2, 3], 9),

        # Industrial Engineering
        ("Industrial Engineering", "Production Rate"): ([100, 2], 50),
        ("Industrial Engineering", "Cycle Time"): ([120, 10], 12),
        ("Industrial Engineering", "Productivity"): ([100, 20], 5),
        (
            "Industrial Engineering",
            "Overall Equipment Effectiveness (OEE)",
        ): ([90, 80, 95], 68.4),
        (
            "Industrial Engineering",
            "Break-Even Quantity",
        ): ([1000, 50, 30], 50),
    }

    assert len(expected_results) == 55

    for (category, name), (inputs, expected) in expected_results.items():
        formula = get_formula(category, name)
        result = formula["function"](*inputs)

        assert result == pytest.approx(expected, rel=1e-6), (
            f"Unexpected result for {category} / {name}"
        )


def test_all_registered_functions_are_callable():
    for formulas in FORMULA_REGISTRY.values():
        for details in formulas.values():
            assert callable(details["function"])


@pytest.mark.parametrize(
    ("query", "expected_category", "expected_name"),
    [
        ("angular velocity", "Rotational Motion", "Angular Velocity"),
        (
            "angular acceleration",
            "Rotational Motion",
            "Angular Acceleration",
        ),
        (
            "rotational kinetic energy",
            "Rotational Motion",
            "Rotational Kinetic Energy",
        ),
        (
            "production rate",
            "Industrial Engineering",
            "Production Rate",
        ),
        ("cycle time", "Industrial Engineering", "Cycle Time"),
        ("productivity", "Industrial Engineering", "Productivity"),
        (
            "overall equipment effectiveness",
            "Industrial Engineering",
            "Overall Equipment Effectiveness (OEE)",
        ),
        (
            "break even",
            "Industrial Engineering",
            "Break-Even Quantity",
        ),
    ],
)
def test_search_finds_new_formulas(query, expected_category, expected_name):
    results = search_formulas(query)

    assert any(
        item["category"] == expected_category
        and item["name"] == expected_name
        for item in results
    )
