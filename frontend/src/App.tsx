
import { useEffect, useState } from "react";
import "./App.css";
import EngineeringGraphs from "./EngineeringGraphs";

type Section =
  | "Dashboard"
  | "Calculator"
  | "Formula Library"
  | "Unit Converter"
  | "History"
  | "AI Assistant"
  | "Engineering Graphs";

type FieldConfig = {
  key: string;
  label: string;
  unit: string;
  min?: number;
  step?: string;
  dimension?: string;
};

type Formula = {
  name: string;
  category: string;
  equation: string;
  description: string;
  unit: string;
  endpoint: string;
  fields: FieldConfig[];
  inputKeys?: string[];
};

type FormulaApiItem = {
  name: string;
  category: string;
  equation: string;
  description: string;
  unit: string;
  output_dimension?: string;
  inputs: { key: string; label: string; unit: string; dimension?: string }[];
  input_keys: string[];
};

type FormulaListResponse = {
  count: number;
  formulas: FormulaApiItem[];
  detail?: string;
};

type SolutionStep = { title: string; content: string };


type ApiResult = {
  result?: number;
  unit?: string;
  formula?: string;
  detail?: string;
  inputs?: Record<string, number>;
  distance_m?: number;
  time_s?: number;
  steps?: SolutionStep[];
  category?: string;
  name?: string;
};

type HistoryRecord = {
  id: number;
  created_at: string;
  formula: string;
  inputs: Record<string, unknown>;
  result: number;
  unit: string;
};

type HistoryResponse = {
  count: number;
  history: HistoryRecord[];
  detail?: string;
};

const API_URL = "http://127.0.0.1:8000";

function formatHistoryInput(value: unknown): string {
  // Older history records may store each input as { value, unit }.
  if (value !== null && typeof value === "object") {
    const input = value as { value?: unknown; unit?: unknown };
    const formattedValue =
      input.value === undefined ? JSON.stringify(value) : String(input.value);
    return input.unit ? `${formattedValue} ${String(input.unit)}` : formattedValue;
  }

  return String(value ?? "—");
}

const fallbackFormulas: Formula[] = [
  {
    name: "Speed",
    category: "Motion",
    equation: "v = d / t",
    description: "Distance travelled per unit time.",
    unit: "m/s",
    endpoint: "/api/calculate/speed",
    fields: [
      { key: "distance_m", label: "Distance (d)", unit: "m", min: 0 },
      { key: "time_s", label: "Time (t)", unit: "s", min: 0, step: "any" },
    ],
  },
  {
    name: "Force",
    category: "Mechanics",
    equation: "F = m × a",
    description: "Mass multiplied by acceleration.",
    unit: "N",
    endpoint: "/api/calculate/force",
    fields: [
      { key: "mass_kg", label: "Mass (m)", unit: "kg", min: 0 },
      {
        key: "acceleration_m_s2",
        label: "Acceleration (a)",
        unit: "m/s²",
        min: 0,
        step: "any",
      },
    ],
  },
  {
    name: "Density",
    category: "Materials",
    equation: "ρ = m / V",
    description: "Mass per unit volume.",
    unit: "kg/m³",
    endpoint: "/api/calculate/density",
    fields: [
      { key: "mass_kg", label: "Mass (m)", unit: "kg", min: 0 },
      {
        key: "volume_m3",
        label: "Volume (V)",
        unit: "m³",
        min: 0,
        step: "any",
      },
    ],
  },
  {
    name: "Pressure",
    category: "Fluid Mechanics",
    equation: "P = F / A",
    description: "Force acting per unit area.",
    unit: "Pa",
    endpoint: "/api/calculate/pressure",
    fields: [
      { key: "force_n", label: "Force (F)", unit: "N", min: 0 },
      {
        key: "area_m2",
        label: "Area (A)",
        unit: "m²",
        min: 0,
        step: "any",
      },
    ],
  },
  {
    name: "Mechanical Power",
    category: "Energy",
    equation: "P = W / t",
    description: "Work done per unit time.",
    unit: "W",
    endpoint: "/api/calculate/mechanical-power",
    fields: [
      { key: "work_j", label: "Work (W)", unit: "J", step: "any" },
      {
        key: "time_s",
        label: "Time (t)",
        unit: "s",
        min: 0,
        step: "any",
      },
    ],
  },
  {
    name: "Electrical Power",
    category: "Electrical",
    equation: "P = V × I",
    description: "Voltage multiplied by current.",
    unit: "W",
    endpoint: "/api/calculate/electrical-power",
    fields: [
      { key: "voltage_v", label: "Voltage (V)", unit: "V", min: 0 },
      { key: "current_a", label: "Current (I)", unit: "A", min: 0 },
    ],
  },
];

const navigation: { name: Section; icon: string }[] = [
  { name: "Dashboard", icon: "▦" },
  { name: "Calculator", icon: "⌗" },
  { name: "Formula Library", icon: "▤" },
  { name: "Unit Converter", icon: "⇄" },
  { name: "History", icon: "◷" },
  { name: "AI Assistant", icon: "✳" },
  { name: "Engineering Graphs", icon: "⌁" },
];

function getStudyExplanation(formula: Formula): { overview: string; interpretation: string; tips: string[] } {
  const explanations: Record<string, { overview: string; interpretation: string; tips: string[] }> = {
    Speed: {
      overview: "Speed describes how much distance is covered in each unit of time. It is calculated by dividing distance by the time taken.",
      interpretation: "A larger speed means more distance is covered in the same amount of time. Keep distance and time in compatible units.",
      tips: ["Distance is the total path length used in this formula.", "Time must be greater than zero; division by zero is undefined.", "The standard SI unit of speed is metres per second (m/s)."],
    },
    Force: {
      overview: "Newton’s second law states that the net force on an object equals its mass multiplied by its acceleration.",
      interpretation: "The result is the force in the direction of the acceleration, assuming the supplied acceleration represents the net acceleration.",
      tips: ["Mass is measured in kilograms (kg).", "Acceleration is measured in metres per second squared (m/s²).", "One newton (N) equals 1 kg·m/s²; 1 kN equals 1,000 N."],
    },
    Density: {
      overview: "Density tells us how much mass is contained in a given volume. Divide the mass by the volume to calculate density.",
      interpretation: "For the same volume, a greater mass means a greater density. For the same mass, a greater volume means a lower density.",
      tips: ["Use mass and volume units that match the output unit you want.", "Volume must be greater than zero.", "The standard SI unit is kg/m³."],
    },
    Pressure: {
      overview: "Pressure is the amount of force acting perpendicular to each unit of area. It is calculated by dividing force by area.",
      interpretation: "For the same force, reducing the contact area increases pressure. Increasing the area reduces pressure.",
      tips: ["Use force in newtons (N) and area in square metres (m²) for pressure in pascals (Pa).", "Area must be greater than zero.", "1 kPa equals 1,000 Pa."],
    },
    "Mechanical Power": {
      overview: "Mechanical power describes how quickly work is done or energy is transferred. Divide work by the time taken.",
      interpretation: "Doing the same amount of work in less time requires greater power.",
      tips: ["Work is measured in joules (J).", "Time is measured in seconds (s) for power in watts (W).", "1 kW equals 1,000 W."],
    },
    "Electrical Power": {
      overview: "For a DC circuit or a suitable resistive load, electrical power is voltage multiplied by current.",
      interpretation: "At a fixed voltage, increasing current increases the electrical power drawn or delivered.",
      tips: ["Voltage is measured in volts (V).", "Current is measured in amperes (A).", "Power in watts is calculated as P = V × I."],
    },
  };
  return explanations[formula.name] ?? {
    overview: `${formula.name} is calculated using the relationship ${formula.equation}. The result depends on the values entered for the variables shown above.`,
    interpretation: `The calculated value is ${formula.name.toLowerCase()} for the supplied inputs. Check that each input uses a unit compatible with the formula and that the result unit is appropriate for the quantity.`,
    tips: ["Check the meaning and unit of every input before calculating.", "Keep units dimensionally consistent.", "Round the displayed answer only after completing the calculation."],
  };
}

function App() {
  const [section, setSection] = useState<Section>("Dashboard");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [search, setSearch] = useState("");
  const [libraryCategory, setLibraryCategory] = useState("All categories");
  const [calculatorCategory, setCalculatorCategory] = useState("All categories");
  const [unitDimensions, setUnitDimensions] = useState<Record<string, string[]>>({});
  const [unitCount, setUnitCount] = useState(0);
  const [convertValue, setConvertValue] = useState("1");
  const [convertDimension, setConvertDimension] = useState("length");
  const [convertFrom, setConvertFrom] = useState("m");
  const [convertTo, setConvertTo] = useState("cm");
  const [inputUnits, setInputUnits] = useState<Record<string, string>>({});
  const [outputUnit, setOutputUnit] = useState("");
  const [convertResult, setConvertResult] = useState<number | null>(null);
  const [convertError, setConvertError] = useState("");
  const [convertLoading, setConvertLoading] = useState(false);
  const [formulas, setFormulas] = useState<Formula[]>(fallbackFormulas);
  const [formulaLoadError, setFormulaLoadError] = useState("");
  const [solutionSteps, setSolutionSteps] = useState<SolutionStep[]>([]);
  const [expandedSolutionStep, setExpandedSolutionStep] = useState<number | null>(null);
  const [selected, setSelected] = useState("Speed");
  const [values, setValues] = useState<Record<string, string>>({
    distance_m: "100",
    time_s: "20",
    mass_kg: "10",
    acceleration_m_s2: "5",
    volume_m3: "2",
    force_n: "100",
    area_m2: "2",
    work_j: "500",
    voltage_v: "12",
    current_a: "2",
  });
  const [result, setResult] = useState<number | null>(null);
  const [resultUnit, setResultUnit] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [apiStatus, setApiStatus] = useState<
    "checking" | "connected" | "offline"
  >("checking");
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const activeFormula =
    formulas.find((item) => item.name === selected) ?? formulas[0];

  const categories = Array.from(new Set(formulas.map((item) => item.category)));
  const filteredFormulas = formulas.filter((item) =>
    (libraryCategory === "All categories" || item.category === libraryCategory) &&
    `${item.name} ${item.category} ${item.equation} ${item.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  const calculatorFormulas = formulas.filter((item) =>
    calculatorCategory === "All categories" || item.category === calculatorCategory,
  );

  function resetCalculation() {
    setResult(null);
    setResultUnit("");
    setError("");
    setResultMessage("");
    setSolutionSteps([]);
  }

  function selectFormula(name: string) {
    setSelected(name);
    const nextFormula = formulas.find((item) => item.name === name);
    if (nextFormula) setOutputUnit(nextFormula.unit);
    resetCalculation();
  }

  async function checkApiConnection() {
    try {
      const response = await fetch(`${API_URL}/api/health`);

      if (!response.ok) {
        throw new Error("API health check failed.");
      }

      const data = (await response.json()) as { status?: string };
      setApiStatus(data.status === "healthy" ? "connected" : "offline");
    } catch {
      setApiStatus("offline");
    }
  }

  useEffect(() => {
    void checkApiConnection();
    void loadFormulas();
    void loadUnits();
  }, []);

  async function loadUnits() {
    try {
      const response = await fetch(`${API_URL}/api/units`);
      const data = await response.json();
      if (!response.ok) throw new Error("Could not load supported units.");
      setUnitDimensions(data.dimensions ?? {});
      setUnitCount(data.count ?? 0);
      if (data.dimensions?.length?.includes("m")) setConvertFrom("m");
      if (data.dimensions?.length?.includes("cm")) setConvertTo("cm");
    } catch (err) {
      setConvertError(err instanceof Error ? err.message : "Could not load units.");
    }
  }

  async function runConversion() {
    setConvertError("");
    setConvertResult(null);
    const value = Number(convertValue);
    if (!convertValue.trim() || !Number.isFinite(value)) {
      setConvertError("Enter a valid number.");
      return;
    }
    setConvertLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value, from_unit: convertFrom, to_unit: convertTo }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Conversion failed.");
      setConvertResult(data.result);
      setApiStatus("connected");
    } catch (err) {
      setConvertError(err instanceof Error ? err.message : "Conversion failed.");
    } finally {
      setConvertLoading(false);
    }
  }

  async function loadFormulas() {
    try {
      const response = await fetch(`${API_URL}/api/formulas`);
      const data = (await response.json()) as FormulaListResponse;
      if (!response.ok || !Array.isArray(data.formulas)) {
        throw new Error("Could not load the engineering formula library.");
      }

      const loaded: Formula[] = data.formulas.map((item) => ({
        name: item.name,
        category: item.category,
        equation: item.equation,
        description: item.description,
        unit: item.unit,
        endpoint: "/api/calculate",
        inputKeys: item.input_keys,
        fields: item.inputs.map((input) => ({
          key: input.key,
          label: input.label,
          unit: input.unit,
          dimension: input.dimension,
          step: "any",
        })),
      }));

      if (loaded.length > 0) {
        setFormulas(loaded);
        setInputUnits((current) => {
          const next = { ...current };
          loaded.forEach((formula) => formula.fields.forEach((field) => { if (!next[field.key]) next[field.key] = field.unit; }));
          return next;
        });
        setOutputUnit((current) => current || loaded[0].unit);
        setSelected((current) =>
          loaded.some((item) => item.name === current) ? current : loaded[0].name,
        );
      }
      setFormulaLoadError("");
      setApiStatus("connected");
    } catch (err) {
      setFormulaLoadError(
        err instanceof Error ? err.message : "Could not load formulas.",
      );
    }
  }

  async function calculate() {
    resetCalculation();

    const payload: Record<string, number> = {};

    if (!activeFormula) {
      setError("No formula is available. Check the API connection.");
      return;
    }

    for (const field of activeFormula.fields) {
      const rawValue = values[field.key] ?? "";
      const numberValue = Number(rawValue);

      if (
        rawValue.trim() === "" ||
        !Number.isFinite(numberValue) ||
        (field.min !== undefined && numberValue < field.min)
      ) {
        setError(
          `Enter a valid value for ${field.label}.` +
            (field.min !== undefined
              ? ` The minimum allowed value is ${field.min}.`
              : ""),
        );
        return;
      }

      if (numberValue <= 0 && ["time_s", "volume_m3", "area_m2"].includes(field.key)) {
        setError(`${field.label} must be greater than zero.`);
        return;
      }

      payload[field.key] = numberValue;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: activeFormula.category,
          formula: activeFormula.name,
          inputs: payload,
          input_units: Object.fromEntries(activeFormula.fields.map((field) => [field.key, inputUnits[field.key] ?? field.unit])),
          output_unit: outputUnit || activeFormula.unit,
        }),
      });

      const data = (await response.json()) as ApiResult;

      if (!response.ok) {
        const detail =
          typeof data.detail === "string"
            ? data.detail
            : "The calculation request failed.";

        throw new Error(detail);
      }

      if (
        typeof data.result !== "number" ||
        !Number.isFinite(data.result)
      ) {
        throw new Error("The backend returned an invalid result.");
      }

      const unit = data.unit ?? activeFormula.unit;

      setResult(data.result);
      setResultUnit(unit);
      setResultMessage("Calculation completed successfully.");
      setSolutionSteps(Array.isArray(data.steps) ? data.steps : []);
      setApiStatus("connected");
      // The backend saves each successful calculation automatically.
      if (section === "History") {
        void loadHistory();
      }
    } catch (err) {
      setApiStatus("offline");
      setError(
        err instanceof Error
          ? `${err.message} Please check your connection and try again.`
          : "Could not complete the calculation. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await fetch(`${API_URL}/api/history?limit=100`);
      const data = (await response.json()) as HistoryResponse;

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Could not load calculation history.",
        );
      }

      setHistory(Array.isArray(data.history) ? data.history : []);
      setApiStatus("connected");
    } catch (err) {
      setHistoryError(
        err instanceof Error
          ? err.message
          : "Could not connect to the history API.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    if (section === "History") {
      void loadHistory();
    }
  }, [section]);

  function exportHistoryCsv() {
    window.open(`${API_URL}/api/history/export`, "_blank", "noopener,noreferrer");
  }

  function exportHistoryExcel() {
    window.open(
      `${API_URL}/api/history/export/excel`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function openCalculator(name?: string) {
    if (name) selectFormula(name);
    setSection("Calculator");
  }

  return (
    <div className={`app-shell ${theme}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">⚙</div>
          <div>
            <strong>INDUSTRIAL</strong>
            <span>ENGINEERING SUITE</span>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="nav-list">
          {navigation.map((item) => (
            <button
              className={`nav-item ${section === item.name ? "active" : ""}`}
              key={item.name}
              onClick={() => setSection(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
              {item.name === "AI Assistant" && (
                <span className="nav-tag">BETA</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-status">
            <span className={`status-dot ${apiStatus}`} />
            {apiStatus === "connected"
              ? "Ready to calculate"
              : apiStatus === "offline"
                ? "Calculation service unavailable"
                : "Checking availability"}
          </div>

          <button
            className="theme-toggle"
            onClick={() =>
              setTheme((current) => (current === "dark" ? "light" : "dark"))
            }
          >
            <span>{theme === "dark" ? "☼" : "☾"}</span>
            Switch to {theme === "dark" ? "light" : "dark"} mode
          </button>

          <div className="profile">
            <div className="avatar">IE</div>
            <div>
              <strong>Engineering workspace</strong>
              <span>Local development</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="breadcrumbs">
            Workspace <span>/</span> {section}
          </div>

          <div className="topbar-actions">
            <span className="connection">
              <span className={`status-dot ${apiStatus}`} />
              {apiStatus === "connected"
                ? "Ready"
                : apiStatus === "offline"
                  ? "Service unavailable"
                  : "Connecting"}
            </span>

            <button
              className="icon-button"
              title="Toggle theme"
              onClick={() =>
                setTheme((current) => (current === "dark" ? "light" : "dark"))
              }
            >
              {theme === "dark" ? "☼" : "☾"}
            </button>

            <div className="avatar small">IE</div>
          </div>
        </header>

        <div className="content">
  {section === "Engineering Graphs" && <EngineeringGraphs />}

  {section === "Dashboard" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">ENGINEERING WORKSPACE</div>
                  <h1>Good engineering starts here.</h1>
                  <p>
                    Your workspace for calculations, formulas and technical
                    exploration.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => openCalculator()}
                >
                  ＋ New calculation
                </button>
              </div>

              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-top">
                    <span>Connected formulas</span>
                    <span className="stat-icon cyan">∑</span>
                  </div>
                  <strong>{formulas.length}</strong>
                  <span className="stat-note">Available registered formulas</span>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Engineering domains</span>
                    <span className="stat-icon violet">⌘</span>
                  </div>
                  <strong>{new Set(formulas.map((item) => item.category)).size}</strong>
                  <span className="stat-note">Engineering categories</span>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Calculation engine</span>
                    <span className="stat-icon green">↗</span>
                  </div>
                  <strong>
                    {apiStatus === "connected"
                      ? "Connected"
                      : apiStatus === "offline"
                        ? "Offline"
                        : "Checking"}
                  </strong>
                  <span className="stat-note">Ready for calculations</span>
                </div>
              </div>

              <div className="section-heading">
                <div>
                  <h2>Engineering tools</h2>
                  <p>Choose a workspace to continue.</p>
                </div>
              </div>

              <div className="tool-grid">
                {navigation.slice(1).map((item, index) => (
                  <button
                    className="tool-card"
                    key={item.name}
                    onClick={() => setSection(item.name)}
                  >
                    <span className={`tool-icon icon-${index}`}>
                      {item.icon}
                    </span>
                    <strong>{item.name}</strong>
                    <span>
                      {
                        [
                          "Run an engineering calculation",
                          "Explore equations and units",
                          "Convert common measurements",
                          "Review saved calculation records",
                          "AI workspace concept",
                        ][index]
                      }
                    </span>
                    <span className="tool-arrow">↗</span>
                  </button>
                ))}
              </div>

              <div className="section-heading">
                <div>
                  <h2>Formula spotlight</h2>
                  <p>Choose a formula to calculate.</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => setSection("Formula Library")}
                >
                  Browse library →
                </button>
              </div>

              <div className="formula-grid">
                {formulas.slice(0, 3).map((item) => (
                  <button
                    className="formula-card"
                    key={item.name}
                    onClick={() => openCalculator(item.name)}
                  >
                    <span className="formula-category">{item.category}</span>
                    <strong>{item.name}</strong>
                    <div className="equation">{item.equation}</div>
                    <span className="formula-unit">
                      Result unit · {item.unit}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {section === "Calculator" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">CALCULATION WORKSPACE</div>
                  <h1>Engineering calculator</h1>
                  <p>
                    Enter values, choose a formula and inspect the result.
                  </p>
                </div>
              </div>

              <div className="calculator-layout">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Calculation inputs</h2>
                      <p>{activeFormula.name} · Enter values to calculate</p>
                    </div>
                    <span className="pill">
                      {calculatorCategory === "All categories"
                        ? "ALL CATEGORIES"
                        : calculatorCategory.toUpperCase()}
                    </span>
                  </div>

                  <label htmlFor="calculator-category">Engineering category</label>
                  <select id="calculator-category" value={calculatorCategory} onChange={(event) => {
                    const next = event.target.value;
                    setCalculatorCategory(next);
                    const first = formulas.find((item) => next === "All categories" || item.category === next);
                    if (first) selectFormula(first.name);
                  }}>
                    <option value="All categories">All categories</option>
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                  <label htmlFor="formula-select">Formula</label>
                  <select
                    id="formula-select"
                    value={selected}
                    onChange={(event) => selectFormula(event.target.value)}
                  >
                    {calculatorFormulas.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  <div className="formula-preview">
                    <span>FORMULA</span>
                    <strong>{activeFormula.equation}</strong>
                    <small>{activeFormula.description}</small>
                  </div>

                  <label htmlFor="calculator-output-unit">Result unit</label>
                  <select id="calculator-output-unit" value={outputUnit || activeFormula.unit} onChange={(event) => { setOutputUnit(event.target.value); resetCalculation(); }}>
                    {(unitDimensions["force"] ?? []).includes(activeFormula.unit) ? (unitDimensions["force"] ?? []).map((unit) => <option key={unit} value={unit}>{unit}</option>) : (unitDimensions[Object.entries(unitDimensions).find(([, units]) => units.includes(activeFormula.unit))?.[0] ?? ""] ?? [activeFormula.unit]).map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                  <div className="field-grid">
                    {activeFormula.fields.map((field) => (
                      <div key={field.key}>
                        <label htmlFor={`input-${field.key}`}>
                          {field.label}
                        </label>
                        <div className="input-unit">
                          <input
                            id={`input-${field.key}`}
                            type="number"
                            min={field.min}
                            step={field.step ?? "any"}
                            value={values[field.key] ?? ""}
                            onChange={(event) => {
                              setValues((current) => ({
                                ...current,
                                [field.key]: event.target.value,
                              }));
                              resetCalculation();
                            }}
                          />
                          <select aria-label={`${field.label} unit`} value={inputUnits[field.key] ?? field.unit} onChange={(event) => { setInputUnits((current) => ({ ...current, [field.key]: event.target.value })); resetCalculation(); }}>
                            {(unitDimensions[field.dimension ?? ""] ?? [field.unit]).includes(field.unit) ? (unitDimensions[field.dimension ?? ""] ?? [field.unit]).map((unit) => <option key={unit} value={unit}>{unit}</option>) : <option value={field.unit}>{field.unit}</option>}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    className="primary-button full-width"
                    onClick={calculate}
                    disabled={loading}
                  >
                    {loading ? "Calculating..." : "Calculate result"}
                    <span>→</span>
                  </button>

                  {error && (
                    <div className="notice" role="alert">
                      <span>⚠</span>
                      <span>{error}</span>
                    </div>
                  )}

                  <p className="form-note">
                    Check each value and its unit before calculating. Results are shown with the selected output unit.
                  </p>
                </section>

                <section className="panel result-panel">
                  <div className="eyebrow">RESULT OVERVIEW</div>
                  <h2>Calculation result</h2>

                  <div className="result-value">
                    {result === null
                      ? "—"
                      : `${result.toLocaleString(undefined, {
                          maximumFractionDigits: 6,
                        })} ${resultUnit}`}
                  </div>

                  <p>
                    {result === null
                      ? `Enter valid values for ${activeFormula.name}, then calculate.`
                      : resultMessage}
                  </p>

                  <div className="result-divider" />

                  <span className="result-label">SELECTED EQUATION</span>
                  <div className="equation large">
                    {activeFormula.equation}
                  </div>

                  {solutionSteps.length > 0 && (
                    <div className="solution-steps">
                      <h3>Step-by-step solution</h3>
                      <p className="solution-instruction">
                        Select a step to view its explanation.
                      </p>
                      <div className="solution-step-list">
                        {solutionSteps.map((step, index) => {
                          const isExpanded = expandedSolutionStep === index;
                          return (
                            <div
                              className={`solution-step ${isExpanded ? "is-expanded" : ""}`}
                              key={`${step.title}-${index}`}
                            >
                              <button
                                type="button"
                                className="solution-step-trigger"
                                onClick={() =>
                                  setExpandedSolutionStep(isExpanded ? null : index)
                                }
                                aria-expanded={isExpanded}
                              >
                                <span className="solution-step-number">{index + 1}</span>
                                <strong>{step.title}</strong>
                                <span className="solution-step-chevron" aria-hidden="true">
                                  {isExpanded ? "−" : "+"}
                                </span>
                              </button>
                              {isExpanded && (
                                <div className="solution-step-description">
                                  <p>{step.content}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {result !== null && (() => {
                    const study = getStudyExplanation(activeFormula);
                    return (
                      <section className="calculation-study" aria-labelledby="calculation-study-title">
                        <div className="eyebrow">LEARN THE CONCEPT</div>
                        <h3 id="calculation-study-title">Understand this calculation</h3>
                        <p className="study-overview">{study.overview}</p>
                        <div className="study-equation">
                          <span>Formula used</span>
                          <strong>{activeFormula.equation}</strong>
                        </div>
                        <h4>What your answer means</h4>
                        <p>{study.interpretation} The result for these inputs is <strong>{result.toLocaleString(undefined, { maximumFractionDigits: 6 })} {resultUnit}</strong>.</p>
                        <h4>Remember</h4>
                        <ul>
                          {study.tips.map((tip) => <li key={tip}>{tip}</li>)}
                        </ul>
                        <p className="study-note">Study note: this explanation is a learning aid. For real engineering work, confirm assumptions, sign conventions and applicable standards.</p>
                      </section>
                    );
                  })()}

                  {apiStatus === "offline" && result === null && !error && (
                    <div className="notice" role="status">
                      The calculator is temporarily unavailable. Please try again in a moment.
                    </div>
                  )}
                </section>
              </div>
            </>
          )}

          {section === "Formula Library" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">REFERENCE CENTRE</div>
                  <h1>Formula library</h1>
                  <p>
                    Search engineering equations by name, domain or expression.
                  </p>
                </div>
              </div>

              <div className="search-box">
                <span>⌕</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search formulas, e.g. force, density..."
                />
              </div>

              <div className="library-filters">
                <label htmlFor="library-category">Filter by category</label>
                <select id="library-category" value={libraryCategory} onChange={(event) => setLibraryCategory(event.target.value)}>
                  <option value="All categories">All categories</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                <span>{filteredFormulas.length} formulas</span>
              </div>

              {formulaLoadError && <div className="notice" role="alert">{formulaLoadError} Showing locally available formulas.</div>}
              <div className="formula-grid library-grid">
                {filteredFormulas.map((item) => (
                  <button
                    className="formula-card"
                    key={item.name}
                    onClick={() => openCalculator(item.name)}
                  >
                    <span className="formula-category">{item.category}</span>
                    <strong>{item.name}</strong>
                    <div className="equation">{item.equation}</div>
                    <p>{item.description}</p>
                    <span className="formula-unit">Output · {item.unit}</span>
                  </button>
                ))}
              </div>

              {filteredFormulas.length === 0 && (
                <div className="empty-state">
                  No formulas match that search.
                </div>
              )}
            </>
          )}

          {section === "Unit Converter" && (
            <>
              <div className="page-heading"><div><div className="eyebrow">UNIT MANAGEMENT</div><h1>Unit converter</h1><p>Convert compatible engineering units with the Python conversion engine.</p></div></div>
              <section className="panel placeholder-panel">
                <div className="placeholder-icon">⇄</div>
                <h2>Convert a measurement</h2>
                <p>{unitCount} supported units loaded from the backend.</p>
                <label htmlFor="convert-value">Value</label>
                <input id="convert-value" type="number" step="any" value={convertValue} onChange={(event) => { setConvertValue(event.target.value); setConvertResult(null); }} />
                <label htmlFor="convert-dimension">Quantity type</label>
                <select id="convert-dimension" value={convertDimension} onChange={(event) => { const dimension = event.target.value; const units = unitDimensions[dimension] ?? []; setConvertDimension(dimension); setConvertFrom(units[0] ?? ""); setConvertTo(units[1] ?? units[0] ?? ""); setConvertResult(null); setConvertError(""); }}>
                  {Object.keys(unitDimensions).sort().map((dimension) => <option key={dimension} value={dimension}>{dimension.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase())}</option>)}
                </select>
                <div className="field-grid">
                  <div><label htmlFor="convert-from">From unit</label><select id="convert-from" value={convertFrom} onChange={(event) => { setConvertFrom(event.target.value); setConvertResult(null); }}>
                    {(unitDimensions[convertDimension] ?? []).map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                  </select></div>
                  <div><label htmlFor="convert-to">To unit</label><select id="convert-to" value={convertTo} onChange={(event) => { setConvertTo(event.target.value); setConvertResult(null); }}>
                    {(unitDimensions[convertDimension] ?? []).map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                  </select></div>
                </div>
                <button className="secondary-button full-width" type="button" onClick={() => { setConvertFrom(convertTo); setConvertTo(convertFrom); setConvertResult(null); setConvertError(""); }}>⇄ Swap units</button>
                <button className="primary-button full-width" onClick={() => void runConversion()} disabled={convertLoading}>{convertLoading ? "Converting..." : "Convert units →"}</button>
                {convertError && <div className="notice" role="alert">⚠ {convertError}</div>}
                {convertResult !== null && <div className="formula-preview"><span>CONVERSION RESULT</span><strong>{convertResult.toLocaleString(undefined, { maximumFractionDigits: 10 })} {convertTo}</strong><small>{convertValue} {convertFrom} = {convertResult.toLocaleString(undefined, { maximumFractionDigits: 10 })} {convertTo}</small></div>}
              </section>
            </>
          )}

          {section === "History" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">ACTIVITY LOG</div>
                  <h1>Calculation history</h1>
                  <p>Review calculations saved in your local SQLite database.</p>
                </div>
                <div className="history-actions">
                  <button
                    className="secondary-button"
                    onClick={() => void loadHistory()}
                    disabled={historyLoading}
                  >
                    {historyLoading ? "Refreshing..." : "↻ Refresh"}
                  </button>
                  <button
                    className="primary-button"
                    onClick={exportHistoryCsv}
                    disabled={history.length === 0}
                  >
                    ↓ Export CSV
                  </button>

                  <button
                    className="secondary-button"
                    onClick={exportHistoryExcel}
                    disabled={history.length === 0}
                  >
                    ↓ Export Excel
                  </button>          
                </div>
              </div>

              {historyError && (
                <div className="notice" role="alert">
                  <span>⚠</span>
                  <span>{historyError} Please check your connection and try again.</span>
                </div>
              )}

              <div className="stat-grid history-stats">
                <div className="stat-card">
                  <div className="stat-top">
                    <span>Saved calculations</span>
                    <span className="stat-icon cyan">◷</span>
                  </div>
                  <strong>{history.length}</strong>
                  <span className="stat-note">Most recent 100 records</span>
                </div>
                <div className="stat-card">
                  <div className="stat-top">
                    <span>Storage</span>
                    <span className="stat-icon green">▣</span>
                  </div>
                  <strong>SQLite</strong>
                  <span className="stat-note">Local calculation database</span>
                </div>
                <div className="stat-card">
                  <div className="stat-top">
                    <span>Export format</span>
                    <span className="stat-icon violet">↓</span>
                  </div>
                  <strong>CSV + Excel</strong>
                  <span className="stat-note">Download spreadsheet reports</span>
                </div>
              </div>

              <section className="panel history-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Recent calculations</h2>
                    <p>Newest calculations appear first.</p>
                  </div>
                  <span className="pill">{history.length} RECORDS</span>
                </div>

                {historyLoading && history.length === 0 ? (
                  <div className="empty-state">Loading calculation history...</div>
                ) : history.length === 0 ? (
                  <div className="empty-state">
                    <div className="placeholder-icon">◷</div>
                    <h2>No calculations saved yet</h2>
                    <p>Run a calculation first. Successful results are saved automatically.</p>
                    <button
                      className="primary-button"
                      onClick={() => openCalculator()}
                    >
                      Start a calculation →
                    </button>
                  </div>
                ) : (
                  <div className="history-table-wrap">
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Date &amp; time (UTC)</th>
                          <th>Formula</th>
                          <th>Inputs</th>
                          <th>Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((record) => (
                          <tr key={record.id}>
                            <td>#{record.id}</td>
                            <td>{new Date(record.created_at).toLocaleString()}</td>
                            <td>
                              <strong>{record.formula}</strong>
                            </td>
                            <td>
                              <div className="history-inputs">
                                {Object.entries(record.inputs).map(([key, value]) => (
                                  <span key={key}>
                                    {key.replaceAll("_", " ")}: {formatHistoryInput(value)}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td>
                              <strong>
                                {Number(record.result).toLocaleString(undefined, {
                                  maximumFractionDigits: 6,
                                })} {record.unit}
                              </strong>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {section === "AI Assistant" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">INTELLIGENCE LAYER · PREVIEW</div>
                  <h1>AI engineering assistant</h1>
                  <p>
                    A future assistant designed to explain formulas and support
                    verified engineering calculations.
                  </p>
                </div>
                <span className="pill violet-pill">CONCEPT</span>
              </div>

              <div className="ai-layout">
                <div className="panel">
                  <div className="ai-orb">✳</div>
                  <h2>Engineering intelligence</h2>
                  <p>Planned capabilities</p>

                  <div className="capability">
                    <span>01</span>
                    <div>
                      <strong>Formula explanations</strong>
                      <p>Understand equations, variables and assumptions.</p>
                    </div>
                  </div>

                  <div className="capability">
                    <span>02</span>
                    <div>
                      <strong>Verified calculations</strong>
                      <p>
                        Use approved Python calculation functions for numerical
                        answers.
                      </p>
                    </div>
                  </div>

                  <div className="capability">
                    <span>03</span>
                    <div>
                      <strong>Engineering knowledge</strong>
                      <p>
                        Explain concepts with appropriate references and
                        limitations.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="panel ai-message">
                  <div className="eyebrow">ASSISTANT STATUS</div>
                  <h2>Not connected yet</h2>
                  <p>
                    This is a UI preview, not a live AI chatbot. Secure AI
                    integration will follow the core backend work.
                  </p>
                </div>
              </div>
            </>
          )}

          <footer className="footer">
            <span>INDUSTRIAL ENGINEERING SUITE</span>
            <span>Engineering calculation workspace</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
