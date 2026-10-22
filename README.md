# Industrial Engineering Calculator

A full-stack engineering calculation platform built to simplify engineering formulas, unit conversions, and calculation workflows through an interactive web interface.

## Project Overview

The Industrial Engineering Calculator combines a **React and TypeScript frontend** with a **Python FastAPI backend**. It provides a central place to explore engineering formulas, perform calculations, convert units, and review calculation history.

The project emphasizes input validation, maintainable code, automated testing, and a user-friendly engineering interface.

## Key Features

- **Engineering Formula Library** — Browse registered formulas across engineering categories.
- **Engineering Calculations** — Perform formula-based calculations using the Python calculation engine.
- **Unit Converter** — Convert supported engineering units.
- **Formula Search** — Find formulas by name, category, description, and supported keywords.
- **Calculation History** — Save and review calculation records using SQLite.
- **CSV Export** — Export calculation history for further analysis.
- **Educational Information** — Explore equations, descriptions, and relevant calculation details.
- **Input Validation** — Handle invalid inputs with meaningful errors.
- **Automated Testing** — Validate calculation logic and application functionality.

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Python, FastAPI |
| Data Storage | SQLite |
| Testing | Pytest |
| Code Quality | Ruff |
| Version Control | Git, GitHub |

## Project Structure

```text
industrial-engineering-calculator/
├── app/
│   ├── engineering_calculator/
│   ├── api.py
│   ├── main.py
│   └── streamlit_app.py
├── frontend/
│   ├── src/
│   └── package.json
├── tests/
├── docs/
│   └── Industrial_Engineering_Calculator_Project_Report.docx
├── requirements.txt
└── pyproject.toml
```

## Getting Started

### Prerequisites

- Python
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/duminduue/industrial-engineering-calculator.git
cd industrial-engineering-calculator
```

### 2. Set up the backend

Create and activate a Python virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Start the FastAPI backend:

```bash
python -m uvicorn app.api:app --reload
```

API documentation:

- Swagger UI: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/health`

### 3. Set up the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown in the terminal by Vite.

If the frontend cannot connect to the backend, check the API base URL and CORS configuration.

## Testing

Run the Python test suite from the project root:

```bash
python -m pytest -q
```

**Latest verified test result during development: 104 passed.**

Build the frontend for production:

```bash
cd frontend
npm run build
```

The frontend production build completed successfully during development. The build reported a bundle-size warning for a JavaScript chunk larger than 500 kB; this did not prevent the build from completing.

## Project Report

Read the detailed project report in [`docs/Industrial_Engineering_Calculator_Project_Report.docx`](docs/Industrial_Engineering_Calculator_Project_Report.docx).

## Project Status

The core calculation engine, formula registry, unit-related functionality, calculation history, React frontend, FastAPI API, and automated tests have been developed.

A public live demo is not currently listed. Run the application locally using the setup instructions above.

## Disclaimer

This application is intended for educational purposes and preliminary engineering calculations. Independently verify results before applying them to real engineering work. Do not rely on this application alone for safety-critical decisions, certified designs, or regulatory compliance.

## Author

**Dumindu Udakara Ekanayaka**

- GitHub: [@duminduue](https://github.com/duminduue)
- Repository: [Industrial Engineering Calculator](https://github.com/duminduue/industrial-engineering-calculator)
