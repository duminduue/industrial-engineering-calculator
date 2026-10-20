"""FastAPI endpoints for the Industrial Engineering Calculator."""

import math
from typing import Any

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.engineering_calculator.calculations import (
    calculate_density,
    calculate_electrical_power,
    calculate_force,
    calculate_mechanical_power,
    calculate_pressure,
    calculate_speed,
)
from app.engineering_calculator.education import build_solution
from app.engineering_calculator.history import (
    export_history_csv,
    export_history_excel,
    get_history,
    save_calculation,
)
from app.engineering_calculator.registry import (
    FORMULA_REGISTRY,
    get_formula,
    search_formulas,
)
from app.engineering_calculator.units import UNITS, convert_unit, get_unit_dimension

app = FastAPI(
    title="Industrial Engineering Calculator API",
    description=(
        "API for engineering formulas, calculations, "
        "educational solutions, and calculation history."
    ),
    version="1.4.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


# --------------------------------------------------
# EXISTING REQUEST MODELS
# --------------------------------------------------


class SpeedRequest(BaseModel):
    distance_m: float = Field(ge=0, allow_inf_nan=False)
    time_s: float = Field(gt=0, allow_inf_nan=False)


class ForceRequest(BaseModel):
    mass_kg: float = Field(ge=0, allow_inf_nan=False)
    acceleration_m_s2: float = Field(ge=0, allow_inf_nan=False)


class DensityRequest(BaseModel):
    mass_kg: float = Field(ge=0, allow_inf_nan=False)
    volume_m3: float = Field(gt=0, allow_inf_nan=False)


class PressureRequest(BaseModel):
    force_n: float = Field(ge=0, allow_inf_nan=False)
    area_m2: float = Field(gt=0, allow_inf_nan=False)


class MechanicalPowerRequest(BaseModel):
    work_j: float = Field(allow_inf_nan=False)
    time_s: float = Field(gt=0, allow_inf_nan=False)


class ElectricalPowerRequest(BaseModel):
    voltage_v: float = Field(ge=0, allow_inf_nan=False)
    current_a: float = Field(ge=0, allow_inf_nan=False)


# --------------------------------------------------
# GENERIC CALCULATION REQUEST
# --------------------------------------------------


class FormulaCalculationRequest(BaseModel):
    category: str = Field(min_length=1)
    formula: str = Field(min_length=1)
    inputs: dict[str, Any]
    input_units: dict[str, str] = Field(default_factory=dict)
    output_unit: str | None = None


# --------------------------------------------------
# SHARED HELPERS
# --------------------------------------------------


def build_result(formula, inputs, result, unit):
    """Validate, save, and return a calculation result."""
    if (
        isinstance(result, bool)
        or not isinstance(result, (int, float))
        or not math.isfinite(result)
    ):
        raise HTTPException(
            status_code=422,
            detail="Calculation result is too large or not finite.",
        )

    result_data = {
        "formula": formula,
        "inputs": inputs,
        "result": result,
        "unit": unit,
    }

    try:
        save_calculation(formula, inputs, result, unit)
    except (OSError, ValueError, TypeError, OverflowError) as error:
        raise HTTPException(
            status_code=500,
            detail=("The calculation succeeded, but saving its history failed."),
        ) from error

    return result_data


def get_formula_metadata(category, name, details):
    """Return JSON-safe formula information without its Python function."""
    return {
        "category": category,
        "name": name,
        "description": details["description"],
        "equation": details["equation"],
        "unit": details["unit"],
        "inputs": [
            {
                "label": label,
                "unit": unit,
                "key": key,
                "dimension": dimension,
            }
            for (label, unit), key, dimension in zip(
                details["inputs"],
                details["input_keys"],
                details["input_dimensions"],
                strict=True,
            )
        ],
        "input_keys": details["input_keys"],
        "input_dimensions": details["input_dimensions"],
        "output_dimension": details["output_dimension"],
        "keywords": details["keywords"],
        "explanation": details.get(
            "explanation",
            details["description"],
        ),
    }


# --------------------------------------------------
# GENERAL API
# --------------------------------------------------


@app.get("/")
def root():
    return {
        "name": "Industrial Engineering Calculator API",
        "status": "running",
        "version": "1.4.0",
    }


@app.get("/api/health")
def health():
    return {"status": "healthy"}


@app.get("/api/categories")
def get_categories():
    """Return available engineering categories."""
    return {
        "count": len(FORMULA_REGISTRY),
        "categories": [
            {
                "name": category,
                "formula_count": len(formulas),
            }
            for category, formulas in FORMULA_REGISTRY.items()
        ],
    }


@app.get("/api/formulas")
def list_formulas(
    search: str = Query(default="", max_length=200),
    category: str | None = Query(default=None, max_length=100),
):
    """List formulas, optionally filtered by search and category."""
    matches = search_formulas(search)

    if category:
        if category not in FORMULA_REGISTRY:
            raise HTTPException(
                status_code=404,
                detail=f"Unknown category: {category}",
            )

        matches = [item for item in matches if item["category"] == category]

    formulas = [
        get_formula_metadata(
            item["category"],
            item["name"],
            item,
        )
        for item in matches
    ]

    return {
        "count": len(formulas),
        "categories": list(FORMULA_REGISTRY.keys()),
        "formulas": formulas,
    }


@app.get("/api/formulas/{category}/{formula_name}")
def formula_details(category: str, formula_name: str):
    """Return metadata for one formula."""
    try:
        details = get_formula(category, formula_name)
    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        ) from error

    return get_formula_metadata(category, formula_name, details)


@app.get("/api/units")
def list_units():
    grouped = {}
    for unit, (dimension, _scale, _offset) in UNITS.items():
        grouped.setdefault(dimension, []).append(unit)
    return {"count": len(UNITS), "units": list(UNITS), "dimensions": grouped}


class UnitConversionRequest(BaseModel):
    value: float = Field(allow_inf_nan=False)
    from_unit: str = Field(min_length=1)
    to_unit: str = Field(min_length=1)


@app.post("/api/convert")
def convert_unit_endpoint(request: UnitConversionRequest):
    try:
        result = convert_unit(request.value, request.from_unit, request.to_unit)
        return {
            "value": request.value,
            "from_unit": request.from_unit,
            "result": result,
            "to_unit": request.to_unit,
            "dimension": get_unit_dimension(request.from_unit),
        }
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.post("/api/calculate")
def calculate_registered_formula(
    request: FormulaCalculationRequest,
):
    """Calculate any registered formula using its input keys."""
    try:
        details = get_formula(request.category, request.formula)
    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        ) from error

    required_keys = details["input_keys"]
    supplied_keys = set(request.inputs)
    required_key_set = set(required_keys)

    missing_keys = [key for key in required_keys if key not in supplied_keys]
    extra_keys = sorted(supplied_keys - required_key_set)

    if missing_keys:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Required formula inputs are missing.",
                "missing_inputs": missing_keys,
            },
        )

    if extra_keys:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Unexpected formula inputs were supplied.",
                "unexpected_inputs": extra_keys,
            },
        )

    values = [request.inputs[key] for key in required_keys]
    original_values = list(values)
    expected_units = [unit for _, unit in details["inputs"]]
    conversion_steps = []

    # Convert each user-selected input unit into the formula's expected unit.
    for index, key in enumerate(required_keys):
        selected_unit = request.input_units.get(key, expected_units[index])
        if selected_unit not in UNITS or expected_units[index] not in UNITS:
            raise HTTPException(status_code=422, detail=f"Unsupported unit for {key}.")
        try:
            converted = (
                convert_unit(values[index], selected_unit, expected_units[index])
                if isinstance(values[index], (int, float))
                and not isinstance(values[index], bool)
                else values[index]
            )
        except ValueError as error:
            raise HTTPException(
                status_code=422, detail=f"Invalid unit for {key}: {error}"
            ) from error
        if selected_unit != expected_units[index]:
            conversion_steps.append(
                {
                    "title": f"Convert {details['inputs'][index][0]}",
                    "content": (
                        f"{values[index]} {selected_unit} = "
                        f"{converted} {expected_units[index]} "
                        "(converted to the formula's standard unit)."
                    ),
                }
            )
        values[index] = converted

    # Accept finite numbers and lists of finite numbers.
    for key, value in zip(required_keys, values, strict=True):
        if isinstance(value, list):
            if not value:
                raise HTTPException(
                    status_code=422,
                    detail=f"{key} must not be an empty list.",
                )

            for item in value:
                if (
                    isinstance(item, bool)
                    or not isinstance(item, (int, float))
                    or not math.isfinite(item)
                ):
                    raise HTTPException(
                        status_code=422,
                        detail=f"All values in {key} must be finite numbers.",
                    )
        elif (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
        ):
            raise HTTPException(
                status_code=422,
                detail=f"{key} must be a finite number.",
            )

    try:
        result = details["function"](*values)

        if (
            isinstance(result, bool)
            or not isinstance(result, (int, float))
            or not math.isfinite(result)
        ):
            raise ValueError("Calculation result is too large or not finite.")

        steps = build_solution(
            request.formula,
            details,
            values,
            expected_units,
            result,
        )
        steps = conversion_steps + steps
        output_unit = request.output_unit or details["unit"]
        try:
            if output_unit == details["unit"]:
                displayed_result = result
            else:
                if output_unit not in UNITS or details["unit"] not in UNITS:
                    raise ValueError(
                        "Unsupported output unit conversion: "
                        f"{details['unit']} to {output_unit}"
                    )
                displayed_result = convert_unit(result, details["unit"], output_unit)
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error)) from error
        if output_unit != details["unit"]:
            steps.append(
                {
                    "title": "Convert result unit",
                    "content": (
                        f"{result} {details['unit']} = "
                        f"{displayed_result} {output_unit}."
                    ),
                }
            )

        history_inputs = {
            key: {
                "value": original_values[index],
                "unit": request.input_units.get(key, expected_units[index]),
            }
            for index, key in enumerate(required_keys)
        }
        response = build_result(
            request.formula,
            history_inputs,
            displayed_result,
            output_unit,
        )
        response["result"] = displayed_result
        response["unit"] = output_unit

        response.update(
            {
                "category": request.category,
                "name": request.formula,
                "equation": details["equation"],
                "steps": steps,
            }
        )

        return response

    except HTTPException:
        raise
    except (ValueError, TypeError, OverflowError, ZeroDivisionError) as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error


# --------------------------------------------------
# EXISTING CALCULATION ENDPOINTS
# Kept for compatibility with the current React app.
# --------------------------------------------------


@app.post("/api/calculate/speed")
def calculate_speed_endpoint(request: SpeedRequest):
    try:
        result = calculate_speed(request.distance_m, request.time_s)

        response = build_result(
            "v = d / t",
            {
                "distance_m": request.distance_m,
                "time_s": request.time_s,
            },
            result,
            "m/s",
        )

        response["distance_m"] = request.distance_m
        response["time_s"] = request.time_s
        return response

    except HTTPException:
        raise
    except (ValueError, OverflowError, ZeroDivisionError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.post("/api/calculate/force")
def calculate_force_endpoint(request: ForceRequest):
    try:
        result = calculate_force(
            request.mass_kg,
            request.acceleration_m_s2,
        )
        return build_result(
            "F = m × a",
            {
                "mass_kg": request.mass_kg,
                "acceleration_m_s2": request.acceleration_m_s2,
            },
            result,
            "N",
        )
    except HTTPException:
        raise
    except (ValueError, OverflowError, ZeroDivisionError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.post("/api/calculate/density")
def calculate_density_endpoint(request: DensityRequest):
    try:
        result = calculate_density(
            request.mass_kg,
            request.volume_m3,
        )
        return build_result(
            "ρ = m / V",
            {
                "mass_kg": request.mass_kg,
                "volume_m3": request.volume_m3,
            },
            result,
            "kg/m³",
        )
    except HTTPException:
        raise
    except (ValueError, OverflowError, ZeroDivisionError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.post("/api/calculate/pressure")
def calculate_pressure_endpoint(request: PressureRequest):
    try:
        result = calculate_pressure(
            request.force_n,
            request.area_m2,
        )
        return build_result(
            "P = F / A",
            {
                "force_n": request.force_n,
                "area_m2": request.area_m2,
            },
            result,
            "Pa",
        )
    except HTTPException:
        raise
    except (ValueError, OverflowError, ZeroDivisionError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.post("/api/calculate/mechanical-power")
def calculate_mechanical_power_endpoint(
    request: MechanicalPowerRequest,
):
    try:
        result = calculate_mechanical_power(
            request.work_j,
            request.time_s,
        )
        return build_result(
            "P = W / t",
            {
                "work_j": request.work_j,
                "time_s": request.time_s,
            },
            result,
            "W",
        )
    except HTTPException:
        raise
    except (ValueError, OverflowError, ZeroDivisionError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.post("/api/calculate/electrical-power")
def calculate_electrical_power_endpoint(
    request: ElectricalPowerRequest,
):
    try:
        result = calculate_electrical_power(
            request.voltage_v,
            request.current_a,
        )
        return build_result(
            "P = V × I",
            {
                "voltage_v": request.voltage_v,
                "current_a": request.current_a,
            },
            result,
            "W",
        )
    except HTTPException:
        raise
    except (ValueError, OverflowError, ZeroDivisionError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


# --------------------------------------------------
# CALCULATION HISTORY
# --------------------------------------------------


@app.get("/api/history")
def calculation_history(
    limit: int = Query(default=20, ge=1, le=1000),
):
    try:
        records = get_history(limit=limit)
        return {
            "count": len(records),
            "history": records,
        }
    except (OSError, ValueError, TypeError) as error:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve calculation history.",
        ) from error


@app.get("/api/history/export")
def download_history_csv():
    try:
        csv_content = export_history_csv()
    except (OSError, ValueError, TypeError) as error:
        raise HTTPException(
            status_code=500,
            detail="Unable to export calculation history.",
        ) from error

    filename = "industrial_engineering_calculation_history.csv"

    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

@app.get("/api/history/export/excel")
def download_history_excel():
    try:
        excel_content = export_history_excel()
    except (OSError, ValueError, TypeError) as error:
        raise HTTPException(
            status_code=500,
            detail="Unable to export calculation history to Excel.",
        ) from error

    filename = "industrial_engineering_calculation_history.xlsx"

    return Response(
        content=excel_content,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )