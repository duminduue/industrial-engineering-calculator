
import { useEffect, useState } from "react";
import "./App.css";

type Section =
  | "Dashboard"
  | "Calculator"
  | "Formula Library"
  | "Unit Converter"
  | "History"
  | "AI Assistant";

type FieldConfig = {
  key: string;
  label: string;
  unit: string;
  min?: number;
  step?: string;
};

type Formula = {
  name: string;
  category: string;
  equation: string;
  description: string;
  unit: string;
  endpoint: string;
  fields: FieldConfig[];
};

type ApiResult = {
  result?: number;
  unit?: string;
  formula?: string;
  detail?: string;
  inputs?: Record<string, number>;
  distance_m?: number;
  time_s?: number;
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

const formulas: Formula[] = [
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
];

function App() {
  const [section, setSection] = useState<Section>("Dashboard");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [search, setSearch] = useState("");
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

  const filteredFormulas = formulas.filter((item) =>
    `${item.name} ${item.category} ${item.equation}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  function resetCalculation() {
    setResult(null);
    setResultUnit("");
    setError("");
    setResultMessage("");
  }

  function selectFormula(name: string) {
    setSelected(name);
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
  }, []);

  async function calculate() {
    resetCalculation();

    const payload: Record<string, number> = {};

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

      if (
        (activeFormula.name === "Speed" && field.key === "time_s") ||
        (activeFormula.name === "Mechanical Power" &&
          field.key === "time_s") ||
        (activeFormula.name === "Density" && field.key === "volume_m3") ||
        (activeFormula.name === "Pressure" && field.key === "area_m2")
      ) {
        if (numberValue <= 0) {
          setError(`${field.label} must be greater than zero.`);
          return;
        }
      }

      payload[field.key] = numberValue;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}${activeFormula.endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
      setResultMessage(`Calculated by the Python backend · ${unit}`);
      setApiStatus("connected");
      // The backend saves each successful calculation automatically.
      if (section === "History") {
        void loadHistory();
      }
    } catch (err) {
      setApiStatus("offline");
      setError(
        err instanceof Error
          ? `${err.message} Check that the FastAPI server is running.`
          : "Could not connect to the calculation API.",
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
            <span className="status-dot" />
            {apiStatus === "connected"
              ? "Python API connected"
              : apiStatus === "offline"
                ? "API connection unavailable"
                : "Checking API connection"}
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
              <span className="status-dot" />
              {apiStatus === "connected"
                ? "API connected"
                : apiStatus === "offline"
                  ? "API offline"
                  : "Checking API"}
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
                  <strong>06</strong>
                  <span className="stat-note">Backend calculation endpoints</span>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Engineering domains</span>
                    <span className="stat-icon violet">⌘</span>
                  </div>
                  <strong>06</strong>
                  <span className="stat-note">Motion, mechanics, materials...</span>
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
                  <span className="stat-note">FastAPI · Python</span>
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
                      <p>Python backend · {activeFormula.name} calculation</p>
                    </div>
                    <span className="pill">
                      {activeFormula.category.toUpperCase()}
                    </span>
                  </div>

                  <label htmlFor="formula-select">Formula</label>
                  <select
                    id="formula-select"
                    value={selected}
                    onChange={(event) => selectFormula(event.target.value)}
                  >
                    {formulas.map((item) => (
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
                          <span>{field.unit}</span>
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
                    Numerical results are calculated by the Python backend.
                    Input validation and calculation errors are reported here.
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

                  <div className="notice">
                    <span>ⓘ</span>
                    <span>
                      {apiStatus === "connected"
                        ? "The API health check is connected. Calculations are sent to FastAPI."
                        : "Check the FastAPI server connection before calculating."}
                    </span>
                  </div>

                  <button
                    className="secondary-button"
                    onClick={() => void checkApiConnection()}
                  >
                    Check API connection
                  </button>
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
              <div className="page-heading">
                <div>
                  <div className="eyebrow">UNIT MANAGEMENT</div>
                  <h1>Unit converter</h1>
                  <p>
                    Unit conversion integration is planned as a separate step.
                  </p>
                </div>
              </div>

              <div className="panel placeholder-panel">
                <div className="placeholder-icon">⇄</div>
                <h2>Engineering unit converter</h2>
                <p>
                  The existing Python unit converter has not been connected to
                  this React interface yet.
                </p>
                <button
                  className="secondary-button"
                  onClick={() => setSection("Dashboard")}
                >
                  Back to dashboard
                </button>
              </div>
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
                </div>
              </div>

              {historyError && (
                <div className="notice" role="alert">
                  <span>⚠</span>
                  <span>{historyError} Check that the FastAPI server is running.</span>
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
                  <strong>CSV</strong>
                  <span className="stat-note">Open with Excel or spreadsheets</span>
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
            <span>React · TypeScript · FastAPI</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
