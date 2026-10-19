# ⚙️ Industrial Engineering Calculator

A Python-based engineering calculator built with **Streamlit**, designed to simplify engineering calculations, unit conversions, and learning through formula explanations.

## 📌 Project Overview

The Industrial Engineering Calculator is an educational engineering tool that brings commonly used engineering formulas into one application. It provides a searchable formula library, numerical calculations, unit conversion utilities, and calculation history.

The project is being developed with an emphasis on usability, code quality, automated testing, and future AI-assisted learning features.

## ✨ Features

- **Engineering Formula Library** — Browse formulas across multiple engineering categories.
- **Formula Search** — Find calculations by formula name, category, description, or supported keywords.
- **Engineering Calculations** — Calculate results using registered Python functions.
- **Unit Conversion** — Convert compatible engineering units.
- **Educational Mode** — View formula descriptions, equations, input values, and calculation explanations.
- **Calculation History** — Review previously saved calculations using SQLite.
- **CSV Export** — Export calculation history for further analysis.
- **Automated Testing** — Validate calculation functions, formula registry behaviour, and history operations.
- **Code Quality Checks** — Use Ruff to identify common Python issues and maintain consistent code quality.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Python | Calculation logic and application development |
| Streamlit | Interactive web interface |
| SQLite | Local calculation history |
| Pytest | Automated testing |
| Ruff | Linting and code quality |
| Git and GitHub | Version control and project hosting |

## 📂 Project Structure

```text
industrial-engineering-calculator/
├── app/
│   ├── engineering_calculator/
│   │   ├── __init__.py
│   │   ├── calculations.py
│   │   ├── education.py
│   │   ├── history.py
│   │   ├── registry.py
│   │   └── units.py
│   ├── main.py
│   └── streamlit_app.py
├── data/
├── tests/
│   ├── test_calculations.py
│   ├── test_history.py
│   └── test_registry.py
├── .gitignore
├── pyproject.toml
└── requirements.txt
```

## 🚀 Getting Started

### Prerequisites

- Python 3.11 or later, subject to dependency compatibility.
- Git.
- A terminal or code editor such as Visual Studio Code.

### 1. Clone the repository

```bash
git clone https://github.com/duminduue/industrial-engineering-calculator.git
cd industrial-engineering-calculator
```

### 2. Create a virtual environment

**Windows PowerShell**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks environment activation, you can use the environment's Python executable directly instead.

### 3. Install dependencies

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Run the application

```powershell
python -m streamlit run app/streamlit_app.py
```

Streamlit will provide a local URL, normally `http://localhost:8501`, which you can open in your browser.

## 🧪 Testing

Run the automated test suite:

```powershell
python -m pytest tests
```

Run the code quality checks:

```powershell
python -m ruff check app tests
```

Automatically fix supported Ruff issues:

```powershell
python -m ruff check app tests --fix
```

The test suite previously reached **60 passing tests** during development. Run the commands above against the current checkout to confirm its present status.

## 📖 How to Use

1. Start the Streamlit application.
2. Open the **Calculator** page.
3. Search for a formula or select an engineering category.
4. Choose the required calculation.
5. Enter the input values using the supported units.
6. Select a compatible output unit when available.
7. Calculate and review the result and educational explanation.
8. Open **Calculation History** to review saved results or export them as CSV.
9. Use **Unit Converter** to convert compatible units independently.

Available units and formula inputs depend on the registered formula definitions and supported conversions.

## 🗺️ Development Roadmap

- [x] Establish the Python project structure.
- [x] Implement the initial engineering calculation functions.
- [x] Introduce a central formula registry.
- [x] Add calculation history and CSV export.
- [x] Establish automated tests and Ruff checks.
- [x] Build a Streamlit interface.
- [x] Add unit conversion functionality.
- [x] Introduce an initial educational solution module.
- [ ] Expand formula-specific step-by-step solutions.
- [ ] Improve unit coverage and conversion validation across all formulas.
- [ ] Improve input validation, error handling, and documentation.
- [ ] Introduce an AI-assisted engineering learning assistant.
- [ ] Explore deployment and additional engineering tools.

## 🤖 Future AI Integration

A planned enhancement is an AI-assisted learning feature that can help users understand engineering concepts, interpret formulas, explain calculation steps, and learn when particular equations are appropriate.

AI-generated explanations will need validation against engineering principles and the application's registered formulas.

## ⚠️ Disclaimer

This project is intended for educational purposes and preliminary engineering calculations. Results may depend on assumptions, unit conventions, and formula limitations.

Do not rely on this application as the sole basis for safety-critical engineering decisions, certified designs, or professional compliance. Independently verify calculations before applying them in real engineering work.

## 👨‍💻 Author

**Dumindu Udakara Ekanayaka**

GitHub: [@duminduue](https://github.com/duminduue)

## 📄 License

No license has been selected yet. Until a license is added, reuse and redistribution are not automatically granted by this repository's public visibility.