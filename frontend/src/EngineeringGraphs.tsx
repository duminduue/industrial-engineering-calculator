import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type Category =
  | "Motion"
  | "Mechanical"
  | "Electrical"
  | "Thermal & Fluid"
  | "Industrial"
  | "Stress–Strain"
  | "Data Comparison";

type Point = { x: number; y: number };
type Series = { name: string; points: Point[] };

type ChartData = {
  title: string;
  xLabel: string;
  yLabel: string;
  xUnit: string;
  yUnit: string;
  series: Series[];
};

const categories: Category[] = [
  "Motion",
  "Mechanical",
  "Electrical",
  "Thermal & Fluid",
  "Industrial",
  "Stress–Strain",
  "Data Comparison",
];

const parsePairs = (input: string): Point[] | null => {
  if (!input.trim()) return null;

  const lines = input.trim().split(/\r?\n/).filter(Boolean);
  const result: Point[] = [];

  for (const line of lines) {
    const parts = line.trim().split(/[,\t; ]+/);

    if (parts.length !== 2) return null;

    const x = Number(parts[0]);
    const y = Number(parts[1]);

    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

    result.push({ x, y });
  }

  return result.length >= 2 ? result : null;
};

function Graph({
  title,
  xLabel,
  yLabel,
  xUnit,
  yUnit,
  series,
}: ChartData) {
  const W = 720;
  const H = 320;
  const L = 76;
  const R = 28;
  const T = 28;
  const B = 58;

  const allPoints = series.flatMap((item) => item.points);

  const rawXMin = Math.min(0, ...allPoints.map((p) => p.x));
  const rawXMax = Math.max(1, ...allPoints.map((p) => p.x));
  const rawYMin = Math.min(0, ...allPoints.map((p) => p.y));
  const rawYMax = Math.max(1, ...allPoints.map((p) => p.y));

  const xPad = (rawXMax - rawXMin) * 0.04 || 1;
  const yPad = (rawYMax - rawYMin) * 0.08 || 1;

  const xmin = rawXMin - xPad;
  const xmax = rawXMax + xPad;
  const ymin = rawYMin - yPad;
  const ymax = rawYMax + yPad;

  const xp = (x: number) =>
    L + ((x - xmin) / (xmax - xmin)) * (W - L - R);

  const yp = (y: number) =>
    T + ((ymax - y) / (ymax - ymin)) * (H - T - B);

  const fmt = (n: number) => Number(n.toPrecision(4)).toLocaleString();

  const ticks = (min: number, max: number) =>
    Array.from({ length: 5 }, (_, i) => min + ((max - min) * i) / 4);

  return (
    <section className="panel motion-chart-card">
      <div className="motion-chart-heading">
        <div>
          <h2>{title}</h2>
          <p>
            {yLabel} against {xLabel}
          </p>
        </div>

        <span className="motion-chart-unit">{yUnit}</span>
      </div>

      <div className="motion-chart-scroll">
        <svg
          className="motion-chart-svg"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={title}
        >
          {ticks(ymin, ymax).map((v, i) => (
            <g key={`y-${i}`}>
              <line
                x1={L}
                y1={yp(v)}
                x2={W - R}
                y2={yp(v)}
                className="motion-grid-line"
              />

              <text
                x={L - 9}
                y={yp(v) + 4}
                textAnchor="end"
                className="motion-axis-text"
              >
                {fmt(v)}
              </text>
            </g>
          ))}

          {ticks(xmin, xmax).map((v, i) => (
            <g key={`x-${i}`}>
              <line
                x1={xp(v)}
                y1={T}
                x2={xp(v)}
                y2={H - B}
                className="motion-grid-line"
              />

              <text
                x={xp(v)}
                y={H - B + 21}
                textAnchor="middle"
                className="motion-axis-text"
              >
                {fmt(v)}
              </text>
            </g>
          ))}

          <line
            x1={L}
            y1={T}
            x2={L}
            y2={H - B}
            className="motion-axis-line"
          />

          <line
            x1={L}
            y1={H - B}
            x2={W - R}
            y2={H - B}
            className="motion-axis-line"
          />

          {series.map((item, seriesIndex) => {
            const line = item.points
              .map((p) => `${xp(p.x)},${yp(p.y)}`)
              .join(" ");

            const seriesColor =
              seriesIndex === 0 ? "var(--accent)" : "#a78bfa";

            return (
              <g key={item.name}>
                <polyline
                  points={line}
                  fill="none"
                  stroke={seriesColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {item.points.map((p, i) => (
                  <circle
                    key={i}
                    cx={xp(p.x)}
                    cy={yp(p.y)}
                    r="2.5"
                    fill={seriesColor}
                  >
                    <title>
                      {item.name}: {xLabel} {fmt(p.x)} {xUnit},{" "}
                      {yLabel} {fmt(p.y)} {yUnit}
                    </title>
                  </circle>
                ))}
              </g>
            );
          })}

          <text
            x={(L + W - R) / 2}
            y={H - 8}
            textAnchor="middle"
            className="motion-axis-label"
          >
            {xLabel} ({xUnit})
          </text>

          <text
            x="17"
            y={(T + H - B) / 2}
            transform={`rotate(-90 17 ${(T + H - B) / 2})`}
            textAnchor="middle"
            className="motion-axis-label"
          >
            {yLabel} ({yUnit})
          </text>
        </svg>
      </div>

      {series.length > 1 && (
        <div className="graph-legend">
          {series.map((item, i) => (
            <span key={item.name}>
              <i
                style={{
                  background: i === 0 ? "var(--accent)" : "#a78bfa",
                }}
              />
              {item.name}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

export default function EngineeringGraphs() {
  const [category, setCategory] = useState<Category>("Motion");

  const [s0, setS0] = useState("0");
  const [v0, setV0] = useState("2");
  const [acc, setAcc] = useState("1");
  const [duration, setDuration] = useState("10");

  const [mass, setMass] = useState("10");
  const [spring, setSpring] = useState("200");

  const [voltage, setVoltage] = useState("12");
  const [resistance, setResistance] = useState("6");

  const [temperature, setTemperature] = useState("25");
  const [tempRate, setTempRate] = useState("2");

  const [target, setTarget] = useState("100");
  const [cycle, setCycle] = useState("0.5");

  const [youngsModulus, setYoungsModulus] = useState("200");
  const [maxStrain, setMaxStrain] = useState("0.002");
  const [stressData, setStressData] = useState("");

  const [datasetOne, setDatasetOne] = useState(
    "0,0\n1,10\n2,20\n3,30\n4,40",
  );

  const [datasetTwo, setDatasetTwo] = useState(
    "0,0\n1,8\n2,18\n3,25\n4,35",
  );

  const [datasetOneName, setDatasetOneName] = useState("Dataset A");
  const [datasetTwoName, setDatasetTwoName] = useState("Dataset B");
  const [error, setError] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);

  const n = {
    s0: Number(s0),
    v0: Number(v0),
    a: Number(acc),
    t: Number(duration),
    m: Number(mass),
    k: Number(spring),
    v: Number(voltage),
    r: Number(resistance),
    temp: Number(temperature),
    rate: Number(tempRate),
    target: Number(target),
    cycle: Number(cycle),
    E: Number(youngsModulus),
    strain: Number(maxStrain),
  };

  const valid =
    Object.values(n).every(Number.isFinite) &&
    n.t > 0 &&
    n.m >= 0 &&
    n.k >= 0 &&
    n.r > 0 &&
    n.target >= 0 &&
    n.cycle > 0 &&
    n.E > 0 &&
    n.strain > 0;

  const charts = useMemo<ChartData[]>(() => {
    if (!valid) return [];

    const points = (
      fn: (x: number) => number,
      end: number,
    ): Point[] =>
      Array.from({ length: 31 }, (_, i) => {
        const x = (Math.max(end, 0.1) * i) / 30;
        return { x, y: fn(x) };
      });

    const chart = (
      title: string,
      xLabel: string,
      yLabel: string,
      xUnit: string,
      yUnit: string,
      data: Point[],
    ): ChartData => ({
      title,
      xLabel,
      yLabel,
      xUnit,
      yUnit,
      series: [{ name: title, points: data }],
    });

    switch (category) {
      case "Motion":
        return [
          chart(
            "Displacement vs Time",
            "Time",
            "Displacement",
            "s",
            "m",
            points((t) => n.s0 + n.v0 * t + 0.5 * n.a * t * t, n.t),
          ),
          chart(
            "Velocity vs Time",
            "Time",
            "Velocity",
            "s",
            "m/s",
            points((t) => n.v0 + n.a * t, n.t),
          ),
          chart(
            "Acceleration vs Time",
            "Time",
            "Acceleration",
            "s",
            "m/s²",
            points(() => n.a, n.t),
          ),
        ];

      case "Mechanical":
        return [
          chart(
            "Spring Force vs Displacement",
            "Displacement",
            "Force",
            "m",
            "N",
            points((x) => n.k * x, 2),
          ),
          chart(
            "Kinetic Energy vs Velocity",
            "Velocity",
            "Kinetic energy",
            "m/s",
            "J",
            points((v) => 0.5 * n.m * v * v, 10),
          ),
        ];

      case "Electrical":
        return [
          chart(
            "Current vs Voltage (Ohm's Law)",
            "Voltage",
            "Current",
            "V",
            "A",
            points((v) => v / n.r, Math.max(n.v, 1)),
          ),
          chart(
            "Power vs Current",
            "Current",
            "Power",
            "A",
            "W",
            points((i) => i * i * n.r, Math.max(n.v / n.r, 1)),
          ),
        ];

      case "Thermal & Fluid":
        return [
          chart(
            "Temperature vs Time",
            "Time",
            "Temperature",
            "min",
            "°C",
            points((t) => n.temp + n.rate * t, n.t),
          ),
          chart(
            "Relative Pressure vs Volume",
            "Volume",
            "Relative pressure",
            "L",
            "relative",
            points((v) => 100 / Math.max(v, 0.1), 10),
          ),
        ];

      case "Industrial":
        return [
          chart(
            "Cumulative Production vs Time",
            "Time",
            "Units produced",
            "min",
            "units",
            points(
              (t) => Math.min(n.target, t / n.cycle),
              Math.max(n.target * n.cycle, 1),
            ),
          ),
          chart(
            "Production Rate vs Cycle Time",
            "Cycle time",
            "Production rate",
            "min/unit",
            "units/min",
            points(
              (ct) => 1 / Math.max(ct, 0.05),
              Math.max(n.cycle * 3, 1),
            ),
          ),
        ];

      case "Stress–Strain": {
        const measured = parsePairs(stressData);

        if (stressData.trim() && !measured) return [];

        const data =
          measured ??
          points((strain) => n.E * 1000 * strain, n.strain);

        return [
          chart(
            measured
              ? "Supplied Stress–Strain Data"
              : "Linear Elastic Stress–Strain",
            "Strain",
            "Stress",
            "ratio",
            "MPa",
            data,
          ),
        ];
      }

      case "Data Comparison": {
        const first = parsePairs(datasetOne);
        const second = parsePairs(datasetTwo);

        if (!first || !second) return [];

        return [
          {
            title: "Dataset Comparison",
            xLabel: "X",
            yLabel: "Y",
            xUnit: "x",
            yUnit: "y",
            series: [
              {
                name: datasetOneName || "Dataset A",
                points: first,
              },
              {
                name: datasetTwoName || "Dataset B",
                points: second,
              },
            ],
          },
        ];
      }
    }
  }, [
    category,
    valid,
    s0,
    v0,
    acc,
    duration,
    mass,
    spring,
    voltage,
    resistance,
    temperature,
    tempRate,
    target,
    cycle,
    youngsModulus,
    maxStrain,
    stressData,
    datasetOne,
    datasetTwo,
    datasetOneName,
    datasetTwoName,
  ]);

  // CSV export: kept as a separate feature.
  function exportCsv() {
    if (!charts.length) return;

    const rows: string[][] = [
      ["Graph", "Series", "X", "Y", "X Unit", "Y Unit"],
    ];

    charts.forEach((item) =>
      item.series.forEach((series) =>
        series.points.forEach((p) =>
          rows.push([
            item.title,
            series.name,
            String(p.x),
            String(p.y),
            item.xUnit,
            item.yUnit,
          ]),
        ),
      ),
    );

    const csv = rows
      .map((row) =>
        row.map((v) => `"${v.replaceAll('"', '""')}"`).join(","),
      )
      .join("\r\n");

    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8;",
      }),
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "engineering-graphs.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  // PDF export: captures the actual rendered graph cards and adds data tables.
  async function exportPdf() {
    if (!charts.length) {
      setError("There are no graphs available to export.");
      return;
    }

    setError("");
    setExportingPdf(true);

    try {
      const graphCards = Array.from(
        document.querySelectorAll<HTMLElement>(".motion-chart-card"),
      );

      if (!graphCards.length) {
        throw new Error("Graph elements could not be found.");
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Report heading
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text("Industrial Engineering Calculator", margin, y + 5);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.text("Engineering Graphs Report", margin, y + 12);

      pdf.setFontSize(9);
      pdf.text(`Category: ${category}`, margin, y + 18);
      pdf.text(
        `Generated: ${new Date().toLocaleString()}`,
        margin,
        y + 23,
      );

      y += 30;

      // Add graph images to PDF
      for (const graphCard of graphCards) {
        const canvas = await html2canvas(graphCard, {
          scale: 2,
          backgroundColor: "#ffffff",
          logging: false,
          useCORS: true,
        });

        const imageData = canvas.toDataURL("image/png");
        const imageWidth = contentWidth;
        const imageHeight = (canvas.height / canvas.width) * imageWidth;

        if (y + imageHeight > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }

        pdf.addImage(
          imageData,
          "PNG",
          margin,
          y,
          imageWidth,
          imageHeight,
          undefined,
          "FAST",
        );

        y += imageHeight + 8;
      }

      // Start data on a separate page
      pdf.addPage();
      y = margin;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.text("Graph Data", margin, y + 5);
      y += 14;

      for (const item of charts) {
        if (y > pageHeight - 25) {
          pdf.addPage();
          y = margin;
        }

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.text(item.title, margin, y + 4);
        y += 8;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.text(
          `X: ${item.xLabel} (${item.xUnit}) | Y: ${item.yLabel} (${item.yUnit})`,
          margin,
          y + 3,
        );
        y += 7;

        for (const series of item.series) {
          if (y > pageHeight - 20) {
            pdf.addPage();
            y = margin;
          }

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(9);
          pdf.text(`Series: ${series.name}`, margin, y + 3);
          y += 6;

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8);
          pdf.text(
            `${item.xLabel} (${item.xUnit})`,
            margin + 2,
            y + 3,
          );
          pdf.text(
            `${item.yLabel} (${item.yUnit})`,
            margin + 65,
            y + 3,
          );

          y += 5;

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);

          for (const point of series.points) {
            if (y > pageHeight - margin) {
              pdf.addPage();
              y = margin;
            }

            pdf.text(
              String(Number(point.x.toPrecision(6))),
              margin + 2,
              y + 3,
            );

            pdf.text(
              String(Number(point.y.toPrecision(6))),
              margin + 65,
              y + 3,
            );

            y += 4;
          }

          y += 5;
        }

        y += 3;
      }

      pdf.save("engineering-graphs-report.pdf");
    } catch (err) {
      console.error("PDF export failed:", err);
      setError(
        "PDF export failed. Please try again and check the browser console if it continues.",
      );
    } finally {
      setExportingPdf(false);
    }
  }

  const field = (
    id: string,
    label: string,
    value: string,
    set: (v: string) => void,
  ) => (
    <div key={id}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        step="any"
        value={value}
        onChange={(e) => {
          set(e.target.value);
          setError("");
        }}
      />
    </div>
  );

  const dataField = (
    id: string,
    label: string,
    value: string,
    set: (v: string) => void,
    help: string,
  ) => (
    <div key={id} className="graph-data-field">
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        rows={5}
        value={value}
        onChange={(e) => {
          set(e.target.value);
          setError("");
        }}
        spellCheck={false}
      />
      <p className="form-note">{help}</p>
    </div>
  );

  const stressPairs = parsePairs(stressData);
  const comparisonValid = Boolean(
    parsePairs(datasetOne) && parsePairs(datasetTwo),
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">VISUALIZATION</div>
          <h1>Engineering Graphs</h1>
          <p>
            Explore engineering relationships using interactive,
            equation-based graphs.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <button
            className="secondary-button"
            type="button"
            onClick={exportCsv}
            disabled={!charts.length}
          >
            ↓ Export CSV
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={exportPdf}
            disabled={!charts.length || exportingPdf}
          >
            {exportingPdf ? "Preparing PDF..." : "↓ Download PDF"}
          </button>
        </div>
      </div>

      <section className="panel motion-input-panel">
        <div className="panel-heading">
          <div>
            <h2>Graph workspace</h2>
            <p>Choose a domain and adjust its parameters.</p>
          </div>

          <span className="motion-chart-unit">LIVE PREVIEW</span>
        </div>

        <label htmlFor="graph-category">Engineering domain</label>

        <select
          id="graph-category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as Category);
            setError("");
          }}
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <div className="motion-input-grid">
          {category === "Motion" && (
            <>
              {field("graph-s0", "Initial displacement (m)", s0, setS0)}
              {field("graph-v0", "Initial velocity (m/s)", v0, setV0)}
              {field("graph-acc", "Acceleration (m/s²)", acc, setAcc)}
              {field("graph-duration", "Duration (s)", duration, setDuration)}
            </>
          )}

          {category === "Mechanical" && (
            <>
              {field("graph-mass", "Mass (kg)", mass, setMass)}
              {field("graph-spring", "Spring constant (N/m)", spring, setSpring)}
            </>
          )}

          {category === "Electrical" && (
            <>
              {field("graph-voltage", "Voltage (V)", voltage, setVoltage)}
              {field("graph-resistance", "Resistance (Ω)", resistance, setResistance)}
            </>
          )}

          {category === "Thermal & Fluid" && (
            <>
              {field(
                "graph-temp",
                "Starting temperature (°C)",
                temperature,
                setTemperature,
              )}
              {field(
                "graph-temp-rate",
                "Temperature change (°C/min)",
                tempRate,
                setTempRate,
              )}
              {field(
                "graph-temp-duration",
                "Duration (min)",
                duration,
                setDuration,
              )}
            </>
          )}

          {category === "Industrial" && (
            <>
              {field("graph-target", "Production target (units)", target, setTarget)}
              {field("graph-cycle", "Cycle time (min/unit)", cycle, setCycle)}
            </>
          )}

          {category === "Stress–Strain" && (
            <>
              {field(
                "graph-youngs-modulus",
                "Young's modulus (GPa)",
                youngsModulus,
                setYoungsModulus,
              )}
              {field(
                "graph-max-strain",
                "Maximum strain (ratio)",
                maxStrain,
                setMaxStrain,
              )}
            </>
          )}
        </div>

        {category === "Stress–Strain" && (
          <div className="graph-data-section">
            <h3>Measured data (optional)</h3>

            {dataField(
              "graph-stress-data",
              "Strain, Stress (MPa)",
              stressData,
              setStressData,
              "Enter one strain,stress pair per line. Example: 0.001,200. Leave blank to use the theoretical linear-elastic model.",
            )}

            <p className="form-note">
              {stressPairs
                ? `${stressPairs.length} valid data points detected. Supplied data is used instead of the theoretical curve.`
                : stressData.trim()
                  ? "Data format is invalid. Enter at least two valid strain,stress pairs or clear the field to use the theoretical model."
                  : "The theoretical curve uses σ = Eε within the linear-elastic range."}
            </p>
          </div>
        )}

        {category === "Data Comparison" && (
          <div className="graph-data-section">
            <h3>Compare two datasets</h3>

            <div className="motion-input-grid">
              {field(
                "graph-series-a-name",
                "Dataset A name",
                datasetOneName,
                setDatasetOneName,
              )}
              {field(
                "graph-series-b-name",
                "Dataset B name",
                datasetTwoName,
                setDatasetTwoName,
              )}
            </div>

            <div className="graph-data-grid">
              {dataField(
                "graph-dataset-a",
                "Dataset A (x,y)",
                datasetOne,
                setDatasetOne,
                "Enter at least two x,y pairs, one per line.",
              )}

              {dataField(
                "graph-dataset-b",
                "Dataset B (x,y)",
                datasetTwo,
                setDatasetTwo,
                "Use the same x/y units for both datasets.",
              )}
            </div>

            {!comparisonValid && (
              <div className="notice" role="alert">
                Each dataset must contain at least two valid x,y pairs.
                Use one pair per line, for example 1,10.
              </div>
            )}
          </div>
        )}

        {!valid && (
          <div className="notice" role="alert">
            Check your inputs. Duration, resistance, Young's modulus and
            cycle time must be greater than zero.
          </div>
        )}

        {error && (
          <div className="notice" role="alert">
            {error}
          </div>
        )}

        <p className="form-note">
          Graphs are based on simplified mathematical models or supplied data.
          Confirm units, assumptions and applicable engineering standards
          before real-world use.
        </p>
      </section>

      {charts.length > 0 ? (
        <div className="motion-graphs-grid">
          {charts.map((item) => (
            <Graph key={item.title} {...item} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          Enter valid values or correct the dataset format to generate graphs.
        </div>
      )}

      <section className="panel motion-equations-panel">
        <h2>Equations and assumptions</h2>

        <p className="motion-equation">
          Motion: s = s₀ + v₀t + ½at²
        </p>

        <p className="motion-equation">
          Spring force: F = kx · Kinetic energy: E = ½mv²
        </p>

        <p className="motion-equation">
          Electrical: I = V/R · Power: P = I²R
        </p>

        <p className="motion-equation">
          Stress–strain: σ = Eε (linear-elastic assumption)
        </p>

        <p className="motion-equation">
          Production rate = 1 / cycle time
        </p>

        <p className="form-note">
          Stress–strain supplied data is plotted as entered. The theoretical
          model does not predict yielding, plastic deformation or fracture.
          Thermal/fluid curves are illustrative, not validated simulation
          results.
        </p>
      </section>
    </>
  );
}