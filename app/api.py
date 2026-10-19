
"""FastAPI endpoints for the Industrial Engineering Calculator."""

import math
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
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
from app.engineering_calculator.history import (
    export_history_csv,
    get_history,
    save_calculation,
)

app = FastAPI(
    title="Industrial Engineering Calculator API",
    description="API for engineering calculations and calculation history.",
    version="1.2.0",
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


def build_result(formula, inputs, result, unit):
    """Validate, save, and return a calculation result."""
    if not math.isfinite(result):
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
            detail="The calculation succeeded, but saving its history failed.",
        ) from error

    return result_data


@app.get("/")
def root():
    return {
        "name": "Industrial Engineering Calculator API",
        "status": "running",
        "version": "1.2.0",
    }


@app.get("/api/health")
def health():
    return {"status": "healthy"}


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

        # Preserve the original response fields for existing frontend code.
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
def calculate_mechanical_power_endpoint(request: MechanicalPowerRequest):
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
def calculate_electrical_power_endpoint(request: ElectricalPowerRequest):
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
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )
