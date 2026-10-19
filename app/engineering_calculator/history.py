import csv
import io
import json
import sqlite3
from datetime import UTC, datetime
from pathlib import Path

DATABASE_PATH = Path("data/calculation_history.db")


def initialize_database():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(DATABASE_PATH) as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS calculations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                formula TEXT NOT NULL,
                inputs TEXT NOT NULL,
                result REAL NOT NULL,
                unit TEXT NOT NULL
            )
        """)


def save_calculation(formula, inputs, result, unit):
    initialize_database()

    with sqlite3.connect(DATABASE_PATH) as connection:
        connection.execute(
            """
            INSERT INTO calculations
                (created_at, formula, inputs, result, unit)
            VALUES (?, ?, ?, ?, ?)
        """,
            (
                datetime.now(UTC).isoformat(timespec="seconds"),
                formula,
                json.dumps(inputs),
                float(result),
                unit,
            ),
        )


def get_history(limit=100):
    initialize_database()

    with sqlite3.connect(DATABASE_PATH) as connection:
        connection.row_factory = sqlite3.Row

        rows = connection.execute(
            """
            SELECT id, created_at, formula, inputs, result, unit
            FROM calculations
            ORDER BY id DESC
            LIMIT ?
        """,
            (max(1, min(int(limit), 1000)),),
        ).fetchall()

    history = []

    for row in rows:
        item = dict(row)
        item["inputs"] = json.loads(item["inputs"])
        history.append(item)

    return history


def export_history_csv():
    records = get_history(limit=1000)
    output = io.StringIO()

    writer = csv.writer(output)
    writer.writerow(
        [
            "ID",
            "Timestamp (UTC)",
            "Formula",
            "Inputs",
            "Result",
            "Unit",
        ]
    )

    for record in reversed(records):
        writer.writerow(
            [
                record["id"],
                record["created_at"],
                record["formula"],
                json.dumps(record["inputs"]),
                record["result"],
                record["unit"],
            ]
        )

    return output.getvalue()
