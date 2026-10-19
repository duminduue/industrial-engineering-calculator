"""Industrial Engineering Calculator with Educational Mode."""

import json
import math

import streamlit as st
from engineering_calculator.history import (
    export_history_csv,
    get_history,
    save_calculation,
)
from engineering_calculator.registry import FORMULA_REGISTRY
from engineering_calculator.units import UNITS, convert_unit, get_units

st.set_page_config(
    page_title="Industrial Engineering Calculator",
    page_icon="⚙️",
    layout="wide",
)

st.title("⚙️ Industrial Engineering Calculator")
st.caption(
    "Engineering calculations, unit conversion, and learning in one place."
)

BASE_UNITS = {
    "length": "m",
    "area": "m²",
    "volume": "m³",
    "time": "s",
    "mass": "kg",
    "velocity": "m/s",
    "acceleration": "m/s²",
    "force": "N",
    "pressure": "Pa",
    "energy": "J",
    "power": "W",
    "torque": "N·m",
    "voltage": "V",
    "current": "A",
    "resistance": "Ω",
    "charge": "C",
    "density": "kg/m³",
    "flow_rate": "m³/s",
    "temperature": "K",
    "dimensionless": "ratio",
}

TEMPERATURE_FORMULAS = {
    "Celsius to Fahrenheit",
    "Fahrenheit to Celsius",
    "Celsius to Kelvin",
    "Kelvin to Celsius",
}


def all_formulas():
    """Flatten the formula registry for searching."""
    return [
        {
            "category": category,
            "name": name,
            **details,
        }
        for category, formulas in FORMULA_REGISTRY.items()
        for name, details in formulas.items()
    ]


def search_formulas(query, category_filter):
    """Search by formula name, category, equation, or keywords."""
    results = []

    for item in all_formulas():
        if (
            category_filter != "All categories"
            and item["category"] != category_filter
        ):
            continue

        searchable = " ".join(
            [
                item["name"],
                item["category"],
                item["description"],
                item["equation"],
                *item.get("keywords", []),
            ]
        ).casefold()

        if query.casefold() in searchable:
            results.append(item)

    return results


def units_for(dimension, default_unit):
    """Return units compatible with a dimension."""
    if dimension not in BASE_UNITS:
        return [default_unit]

    base_unit = BASE_UNITS[dimension]
    candidates = list(get_units(dimension))

    if default_unit not in UNITS:
        return [default_unit]

    if UNITS[default_unit][0] != dimension:
        return [default_unit]

    for unit in (base_unit, default_unit):
        if unit not in candidates and unit in UNITS:
            candidates.insert(0, unit)

    return candidates or [default_unit]


def to_base_unit(value, unit, dimension):
    """Convert a value to the standard unit expected by the formula."""
    if dimension not in BASE_UNITS:
        return value

    base_unit = BASE_UNITS[dimension]

    if unit == base_unit:
        return value

    return convert_unit(value, unit, base_unit)


def from_base_unit(value, unit, dimension):
    """Convert a result from its standard unit to the selected unit."""
    if dimension not in BASE_UNITS:
        return value

    base_unit = BASE_UNITS[dimension]

    if unit == base_unit:
        return value

    return convert_unit(value, base_unit, unit)


def format_number(value):
    """Format numbers for readable educational explanations."""
    return f"{value:,.8g}"


def build_input_summary(details, raw_values, raw_units):
    """Create a readable list of the values entered by the user."""
    summary = []

    for (label, default_unit), value, unit in zip(
        details["inputs"],
        raw_values,
        raw_units,
        strict=True,
    ):
        if isinstance(value, list):
            formatted_value = ", ".join(format_number(v) for v in value)
        else:
            formatted_value = format_number(value)

        summary.append(
            {
                "label": label,
                "value": formatted_value,
                "unit": unit or default_unit,
            }
        )

    return summary


def show_educational_solution(
    details,
    entered_inputs,
    result,
    output_result,
    output_unit,
):
    """Show the equation, inputs, substitution, and result."""
    st.subheader("📘 Educational Solution")

    st.markdown("**1. Understand the formula**")
    st.write(details["description"])
    st.code(details["equation"], language="text")

    st.markdown("**2. Identify the given values**")

    for item in entered_inputs:
        st.write(
            f"- **{item['label']}:** "
            f"{item['value']} {item['unit']}"
        )

    st.markdown("**3. Substitute the values**")

    input_values = [item["value"] for item in entered_inputs]
    substitution = details["equation"]

    if input_values:
        substitution += "\n\nEntered values: " + ", ".join(
            f"{item['label']} = {item['value']} {item['unit']}"
            for item in entered_inputs
        )

    st.code(substitution, language="text")

    st.markdown("**4. Calculate the result**")
    st.write(
        f"Using the registered calculation for this formula, "
        f"the result is **{format_number(result)} "
        f"{details['unit']}**."
    )

    if output_unit != details["unit"] or output_result != result:
        st.markdown("**5. Convert to the selected output unit**")
        st.write(
            f"{format_number(result)} {details['unit']} "
            f"= **{format_number(output_result)} {output_unit}**"
        )

    st.success(
        f"Final answer: {format_number(output_result)} {output_unit}"
    )

    with st.expander("📚 More information"):
        st.write(details.get("explanation", details["description"]))
        st.write("**Assumptions:**")
        st.write(
            "This result follows the registered formula and its stated "
            "assumptions. Check whether those assumptions apply to your "
            "real engineering problem."
        )


page = st.sidebar.radio(
    "Navigation",
    ["Calculator", "Unit Converter", "Calculation History"],
)


# ==================================================
# CALCULATOR
# ==================================================

if page == "Calculator":
    st.sidebar.divider()
    st.sidebar.subheader("Formula Library")

    query = st.sidebar.text_input(
        "Search formulas",
        placeholder="Try force, speed, density...",
    )

    category_filter = st.sidebar.selectbox(
        "Category",
        ["All categories", *FORMULA_REGISTRY.keys()],
    )

    matches = search_formulas(query, category_filter)

    if not matches:
        st.warning("No formulas found. Try another keyword.")
        st.stop()

    labels = [
        f"{item['category']} — {item['name']}"
        for item in matches
    ]

    selected_label = st.sidebar.selectbox("Formula", labels)
    selected = matches[labels.index(selected_label)]

    category = selected["category"]
    formula = selected["name"]
    details = FORMULA_REGISTRY[category][formula]

    st.divider()
    st.subheader(formula)
    st.caption(f"Category: {category}")
    st.write(details["description"])
    st.latex(details["equation"])
    st.caption(f"Standard result unit: {details['unit']}")

    with st.expander("📖 Learn before calculating"):
        st.write(details.get("explanation", details["description"]))
        st.markdown("**Formula**")
        st.code(details["equation"], language="text")
        st.markdown("**Inputs required**")

        for (label, unit), _key in zip(
            details["inputs"],
            details["input_keys"],
            strict=True,
        ):
            st.write(f"- {label}: `{unit}`")

    temperature_conversion = formula in TEMPERATURE_FORMULAS

    entered_values = []
    entered_units = []
    dimensions = details["input_dimensions"]

    with st.form("engineering_calculator"):
        st.subheader("Enter values")

        columns = st.columns(2)

        for index, ((label, default_unit), key, dimension) in enumerate(
            zip(
                details["inputs"],
                details["input_keys"],
                dimensions,
                strict=True,
            )
        ):
            with columns[index % 2]:
                if dimension == "resistance_list":
                    raw_text = st.text_input(
                        f"{label} ({default_unit})",
                        value="2, 3, 5",
                        help="Enter values separated by commas.",
                        key=f"{category}_{formula}_{key}_list",
                    )

                    try:
                        value = [
                            float(part.strip())
                            for part in raw_text.split(",")
                            if part.strip()
                        ]

                        if not value:
                            raise ValueError("Enter at least one value.")

                        if not all(math.isfinite(v) for v in value):
                            raise ValueError("Values must be finite.")

                    except ValueError as error:
                        st.error(f"Invalid list: {error}")
                        value = None

                    selected_unit = default_unit

                else:
                    choices = units_for(dimension, default_unit)

                    if (
                        len(choices) > 1
                        and not temperature_conversion
                    ):
                        selected_unit = st.selectbox(
                            f"{label} unit",
                            choices,
                            index=choices.index(default_unit),
                            key=f"{category}_{formula}_{key}_unit",
                        )
                    else:
                        selected_unit = default_unit
                        st.caption(f"Unit: {default_unit}")

                    value = st.number_input(
                        f"{label} ({selected_unit})",
                        value=1.0,
                        step=1.0,
                        format="%.6f",
                        key=f"{category}_{formula}_{key}_value",
                    )

                entered_values.append(value)
                entered_units.append(selected_unit)

        output_dimension = details["output_dimension"]
        output_choices = units_for(output_dimension, details["unit"])

        if (
            len(output_choices) > 1
            and not temperature_conversion
        ):
            output_unit = st.selectbox(
                "Output unit",
                output_choices,
                index=output_choices.index(details["unit"]),
                key=f"{category}_{formula}_output_unit",
            )
        else:
            output_unit = details["unit"]
            st.caption(f"Output unit: {output_unit}")

        submitted = st.form_submit_button(
            "Calculate",
            type="primary",
            use_container_width=True,
        )

    if submitted:
        if any(value is None for value in entered_values):
            st.error("Please correct the invalid inputs.")
            st.stop()

        try:
            calculation_values = []

            for value, unit, dimension in zip(
                entered_values,
                entered_units,
                dimensions,
                strict=True,
            ):
                if dimension == "resistance_list":
                    calculation_values.append(
                        [
                            to_base_unit(v, unit, "resistance")
                            for v in value
                        ]
                    )
                elif temperature_conversion:
                    calculation_values.append(value)
                else:
                    calculation_values.append(
                        to_base_unit(value, unit, dimension)
                    )

            result = details["function"](*calculation_values)

            if (
                isinstance(result, bool)
                or not isinstance(result, (int, float))
                or not math.isfinite(result)
            ):
                st.error("The result is outside the supported numeric range.")
                st.stop()

            output_result = result

            if not temperature_conversion:
                output_result = from_base_unit(
                    result,
                    output_unit,
                    output_dimension,
                )

            if not math.isfinite(output_result):
                st.error("The converted result is not finite.")
                st.stop()

            st.metric(
                "Calculated result",
                f"{format_number(output_result)} {output_unit}",
            )

            entered_inputs = build_input_summary(
                details,
                entered_values,
                entered_units,
            )

            show_educational_solution(
                details,
                entered_inputs,
                result,
                output_result,
                output_unit,
            )

            history_inputs = {
                item["label"]: {
                    "value": item["value"],
                    "unit": item["unit"],
                }
                for item in entered_inputs
            }

            try:
                save_calculation(
                    formula,
                    history_inputs,
                    output_result,
                    output_unit,
                )
                st.success("Calculation saved to history.")
            except (OSError, ValueError, TypeError) as error:
                st.warning(
                    f"Calculation succeeded, but history saving failed: {error}"
                )

        except (
            ValueError,
            TypeError,
            OverflowError,
            ZeroDivisionError,
        ) as error:
            st.error(f"Unable to calculate: {error}")


# ==================================================
# UNIT CONVERTER
# ==================================================

elif page == "Unit Converter":
    st.subheader("🔁 Engineering Unit Converter")
    st.write("Convert compatible units without running a formula.")

    dimensions_available = sorted(
        {unit_data[0] for unit_data in UNITS.values()}
    )

    dimension = st.selectbox(
        "Quantity type",
        dimensions_available,
    )

    available_units = get_units(dimension)

    if len(available_units) < 2:
        st.info("More units will be added for this quantity.")
    else:
        left, right = st.columns(2)

        with left:
            input_unit = st.selectbox(
                "From unit",
                available_units,
                key="converter_from_unit",
            )
            input_value = st.number_input(
                "Value",
                value=1.0,
                format="%.8f",
                key="converter_value",
            )

        with right:
            output_unit = st.selectbox(
                "To unit",
                available_units,
                index=min(1, len(available_units) - 1),
                key="converter_to_unit",
            )

        if st.button("Convert units", type="primary"):
            try:
                converted = convert_unit(
                    input_value,
                    input_unit,
                    output_unit,
                )
                st.metric(
                    "Converted value",
                    f"{format_number(converted)} {output_unit}",
                )
            except (ValueError, TypeError, OverflowError) as error:
                st.error(f"Conversion failed: {error}")


# ==================================================
# CALCULATION HISTORY
# ==================================================

elif page == "Calculation History":
    st.subheader("📋 Calculation History")
    st.caption("Review and export previously saved calculations.")

    try:
        history = get_history()

        if history:
            st.metric("Saved calculations", len(history))

            st.download_button(
                "Download history as CSV",
                data=export_history_csv(),
                file_name="engineering_calculation_history.csv",
                mime="text/csv",
                type="primary",
            )

            st.divider()

            for item in history:
                with st.expander(
                    f"#{item['id']} — {item['formula']} — "
                    f"{item['result']:.4f} {item['unit']}"
                ):
                    st.write("Timestamp (UTC):", item["created_at"])

                    inputs = item["inputs"]

                    if isinstance(inputs, str):
                        try:
                            inputs = json.loads(inputs)
                        except json.JSONDecodeError:
                            pass

                    st.write("Inputs:", inputs)
                    st.write(
                        "Result:",
                        f"{item['result']:.8g} {item['unit']}",
                    )
        else:
            st.info("No calculations saved yet.")

    except (OSError, ValueError, TypeError) as error:
        st.error(f"Could not load calculation history: {error}")


st.divider()
st.caption(
    "Version 0.8 | Industrial Engineering Calculator | "
    "Educational and engineering reference tool"
)