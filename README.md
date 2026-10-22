# Industrial Engineering Calculator

A Python-based engineering calculation application designed to simplify common engineering calculations, unit conversions, and formula-based problem solving through an interactive web interface.

## Project Overview

The Industrial Engineering Calculator brings engineering formulas and calculation tools together in one application. It combines a Python backend with a React frontend to provide an interactive experience for performing engineering calculations and reviewing results.

The project focuses on calculation accuracy, input validation, unit handling, usability, automated testing, and maintainable code.

## Features

- **Engineering Formula Library** — Browse formulas across multiple engineering categories.
- **Formula Search** — Find calculations using formula names, categories, descriptions, and supported keywords.
- **Engineering Calculations** — Perform calculations using registered Python functions.
- **Input Validation** — Validate calculation inputs and handle invalid values with meaningful errors.
- **Results with Units** — Display calculated results with applicable units.
- **Unit Conversion** — Convert compatible engineering units.
- **Educational Support** — View formula descriptions, equations, and calculation-related information.
- **Calculation History** — Store and review calculation records using SQLite.
- **CSV Export** — Export calculation history for further analysis.
- **Automated Testing** — Test calculation functions, formula registry behaviour, and other application functionality.
- **Code Quality Checks** — Use Ruff to identify common Python code-quality issues.

## Technology Stack

| Technology | Purpose |
|---|---|
| Python | Engineering calculations and backend logic |
| FastAPI | Backend API |
| React | Interactive frontend |
| TypeScript | Frontend development |
| SQLite | Local calculation history |
| Pytest | Automated testing |
| Ruff | Python linting |
| Git and GitHub | Version control and project hosting |

## Project Structure

```text
industrial-engineering-calculator/
├── app/
│   ├── engineering_calculator/
│   │   ├── calculations.py
│   │   ├── education.py
│   │   ├── history.py
│   │   ├── registry.py
│   │   └── units.py
│   ├── api.py
│   ├── main.py
│   └── streamlit_app.py
├── frontend/
│   ├── src/
│   └── package.json
├── tests/
├── data/
├── requirements.txt
└── pyproject.toml
```

*Note: This is a simplified overview of the project structure.*

## Getting Started

### Prerequisites

- Python and compatible project dependencies
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/duminduue/industrial-engineering-calculator.git
cd industrial-engineering-calculator
```

### 2. Set up the Python backend

Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install the Python dependencies:

```powershell
python -m pip install -r requirements.txt
```

Start the backend API:

```powershell
python -m uvicorn app.api:app --reload
```

The API normally runs at `http://127.0.0.1:8000`.

The interactive API documentation is normally available at `http://127.0.0.1:8000/docs`.

### 3. Set up the React frontend

Open another terminal and navigate to the frontend directory:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in the terminal.

*Backend and frontend configuration may be required depending on the local environment.*

## Testing

Run the automated Python test suite from the project root:

```powershell
python -m pytest -q
```

Run Ruff checks:

```powershell
python -m ruff check app tests
```

The latest recorded automated test result during development was **104 passed**. Run the test command again against the current checkout to reproduce and confirm the result.

## How to Use

1. Start the backend and frontend.
2. Open the frontend in a web browser.
3. Search for a formula or browse the available engineering categories.
4. Select a calculation and enter the required input values.
5. Review the calculation result and its units.
6. Use the unit conversion tools where applicable.
7. Review saved calculations or export available history records when needed.

Available calculations and supported units depend on the registered formulas and implemented conversion rules.

## Project Status

The core application, formula registry, calculation validation, unit-related functionality, and automated test suite have been implemented.

Further enhancements can be considered in future updates without changing the scope of the current completed work.

## Disclaimer

This application is intended for educational purposes and preliminary engineering calculations. Results depend on the formulas, assumptions, input values, and unit conventions used.

Independently verify calculations before using them in practical engineering work. Do not use this application as the sole basis for safety-critical engineering decisions, certified designs, or regulatory compliance.

## Author

**Dumindu Udakara Ekanayaka**

GitHub: [@duminduue](https://github.com/duminduue)

Repository: [Industrial Engineering Calculator](https://github.com/duminduue/industrial-engineering-calculator)

## License

No license has been selected yet. Public repository visibility does not automatically grant permission to reuse or redistribute the code.
