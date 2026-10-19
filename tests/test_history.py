import csv
import io
import json
import sqlite3

import pytest

from app.engineering_calculator import history


@pytest.fixture
def temporary_database(tmp_path, monkeypatch):
    """Give each test its own isolated SQLite database."""
    database_path = tmp_path / "test_calculation_history.db"

    monkeypatch.setattr(
        history,
        "DATABASE_PATH",
        database_path,
    )

    history.initialize_database()

    return database_path


def test_initialize_database_creates_table(temporary_database):
    with sqlite3.connect(temporary_database) as connection:
        tables = connection.execute(
            """
            SELECT name
            FROM sqlite_master
            WHERE type = 'table' AND name = 'calculations'
            """
        ).fetchall()

    assert tables == [("calculations",)]


def test_save_calculation_and_read_it_back(temporary_database):
    history.save_calculation(
        "Force",
        {"mass_kg": 10, "acceleration_m_s2": 9.81},
        98.1,
        "N",
    )

    records = history.get_history()

    assert len(records) == 1
    assert records[0]["formula"] == "Force"
    assert records[0]["inputs"]["mass_kg"] == 10
    assert records[0]["result"] == pytest.approx(98.1)
    assert records[0]["unit"] == "N"
    assert records[0]["created_at"]


def test_history_returns_newest_record_first(temporary_database):
    history.save_calculation("First", {"value": 1}, 1, "unit")
    history.save_calculation("Second", {"value": 2}, 2, "unit")

    records = history.get_history()

    assert [item["formula"] for item in records] == [
        "Second",
        "First",
    ]


def test_history_respects_limit(temporary_database):
    for number in range(5):
        history.save_calculation(
            "Test",
            {"value": number},
            number,
            "unit",
        )

    records = history.get_history(limit=2)

    assert len(records) == 2
    assert records[0]["inputs"]["value"] == 4
    assert records[1]["inputs"]["value"] == 3


def test_history_clamps_limit_to_at_least_one(temporary_database):
    history.save_calculation("Test", {"value": 1}, 1, "unit")
    history.save_calculation("Test", {"value": 2}, 2, "unit")

    records = history.get_history(limit=0)

    assert len(records) == 1
    assert records[0]["inputs"]["value"] == 2


def test_csv_export_has_expected_headers(temporary_database):
    history.save_calculation(
        "Speed",
        {"distance_m": 100, "time_s": 20},
        5,
        "m/s",
    )

    csv_text = history.export_history_csv()
    rows = list(csv.reader(io.StringIO(csv_text)))

    assert rows[0] == [
        "ID",
        "Timestamp (UTC)",
        "Formula",
        "Inputs",
        "Result",
        "Unit",
    ]
    assert len(rows) == 2


def test_csv_export_preserves_calculation_data(temporary_database):
    history.save_calculation(
        "Force",
        {"mass_kg": 10, "acceleration_m_s2": 9.81},
        98.1,
        "N",
    )

    rows = list(csv.DictReader(io.StringIO(history.export_history_csv())))

    assert len(rows) == 1
    assert rows[0]["Formula"] == "Force"
    assert float(rows[0]["Result"]) == pytest.approx(98.1)
    assert rows[0]["Unit"] == "N"

    exported_inputs = json.loads(rows[0]["Inputs"])
    assert exported_inputs["mass_kg"] == 10
    assert exported_inputs["acceleration_m_s2"] == 9.81


def test_csv_export_orders_records_oldest_first(temporary_database):
    history.save_calculation("First", {"value": 1}, 1, "unit")
    history.save_calculation("Second", {"value": 2}, 2, "unit")

    rows = list(csv.DictReader(io.StringIO(history.export_history_csv())))

    assert [row["Formula"] for row in rows] == [
        "First",
        "Second",
    ]
