
import { useMemo, useState } from "react";

type MotionPoint = {
  time: number;
  displacement: number;
  velocity: number;
  acceleration: number;
};

type ChartProps = {
  title: string;
  subtitle: string;
  yLabel: string;
  unit: string;
  values: number[];
  times: number[];
};

function MotionChart({
  title,
  subtitle,
  yLabel,
  unit,
  values,
  times,
}: ChartProps) {
  const width = 720;
  const height = 300;
  const left = 66;
  const right = 24;
  const top = 24;
  const bottom = 52;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const spread = maxValue - minValue;
  const padding = spread === 0 ? 1 : spread * 0.12;
  const yMin = minValue - padding;
  const yMax = maxValue + padding;
  const tMax = Math.max(...times, 1);

  const x = (time: number) => left + (time / tMax) * plotWidth;
  const y = (value: number) =>
    top + ((yMax - value) / (yMax - yMin)) * plotHeight;

  const points = values
    .map((value, index) => `${x(times[index]).toFixed(2)},${y(value).toFixed(2)}`)
    .join(" ");

  const yTicks = Array.from({ length: 5 }, (_, index) => {
    return yMin + ((yMax - yMin) * index) / 4;
  });

  const formatNumber = (value: number) =>
    Number(value.toFixed(2)).toLocaleString();

  return (
    <section className="panel motion-chart-card">
      <div className="motion-chart-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <span className="motion-chart-unit">{unit}</span>
      </div>

      <div className="motion-chart-scroll">
        <svg
          className="motion-chart-svg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${title} graph. Horizontal axis is time in seconds and vertical axis is ${yLabel}.`}
        >
          {yTicks.map((tick, index) => (
            <g key={index}>
              <line
                x1={left}
                y1={y(tick)}
                x2={width - right}
                y2={y(tick)}
                className="motion-grid-line"
              />
              <text
                x={left - 10}
                y={y(tick) + 4}
                textAnchor="end"
                className="motion-axis-text"
              >
                {formatNumber(tick)}
              </text>
            </g>
          ))}

          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const tickTime = tMax * fraction;
            return (
              <g key={fraction}>
                <line
                  x1={x(tickTime)}
                  y1={top}
                  x2={x(tickTime)}
                  y2={height - bottom}
                  className="motion-grid-line"
                />
                <text
                  x={x(tickTime)}
                  y={height - bottom + 22}
                  textAnchor="middle"
                  className="motion-axis-text"
                >
                  {formatNumber(tickTime)}
                </text>
              </g>
            );
          })}

          <line
            x1={left}
            y1={top}
            x2={left}
            y2={height - bottom}
            className="motion-axis-line"
          />
          <line
            x1={left}
            y1={height - bottom}
            x2={width - right}
            y2={height - bottom}
            className="motion-axis-line"
          />

          <polyline
            points={points}
            fill="none"
            className="motion-data-line"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {values.map((value, index) => (
            <circle
              key={index}
              cx={x(times[index])}
              cy={y(value)}
              r="2.5"
              className="motion-data-point"
            >
              <title>
                Time: {formatNumber(times[index])} s; {yLabel}:{" "}
                {formatNumber(value)} {unit}
              </title>
            </circle>
          ))}

          <text
            x={left + plotWidth / 2}
            y={height - 9}
            textAnchor="middle"
            className="motion-axis-label"
          >
            Time (s)
          </text>

          <text
            x="17"
            y={top + plotHeight / 2}
            transform={`rotate(-90 17 ${top + plotHeight / 2})`}
            textAnchor="middle"
            className="motion-axis-label"
          >
            {yLabel} ({unit})
          </text>
        </svg>
      </div>
    </section>
  );
}

export default function EngineeringGraphs() {
  const [initialDisplacement, setInitialDisplacement] = useState("0");
  const [initialVelocity, setInitialVelocity] = useState("2");
  const [acceleration, setAcceleration] = useState("1");
  const [duration, setDuration] = useState("10");
  const [sampleCount, setSampleCount] = useState("51");
  const [error, setError] = useState("");

  const motion = useMemo<MotionPoint[]>(() => {
    const s0 = Number(initialDisplacement);
    const v0 = Number(initialVelocity);
    const a = Number(acceleration);
    const totalTime = Number(duration);
    const count = Number(sampleCount);

    if (
      [s0, v0, a, totalTime, count].some((value) => !Number.isFinite(value)) ||
      initialDisplacement.trim() === "" ||
      initialVelocity.trim() === "" ||
      acceleration.trim() === "" ||
      duration.trim() === "" ||
      sampleCount.trim() === "" ||
      totalTime <= 0 ||
      count < 2 ||
      count > 201 ||
      !Number.isInteger(count)
    ) {
      return [];
    }

    return Array.from({ length: count }, (_, index) => {
      const time = (totalTime * index) / (count - 1);
      return {
        time,
        displacement: s0 + v0 * time + 0.5 * a * time * time,
        velocity: v0 + a * time,
        acceleration: a,
      };
    });
  }, [
    initialDisplacement,
    initialVelocity,
    acceleration,
    duration,
    sampleCount,
  ]);

  function validateAndClearError() {
    setError("");
  }

  function resetInputs() {
    setInitialDisplacement("0");
    setInitialVelocity("2");
    setAcceleration("1");
    setDuration("10");
    setSampleCount("51");
    setError("");
  }

  function handleGenerate() {
    const numericValues = [
      initialDisplacement,
      initialVelocity,
      acceleration,
      duration,
      sampleCount,
    ];

    if (
      numericValues.some(
        (value) => value.trim() === "" || !Number.isFinite(Number(value)),
      )
    ) {
      setError("Please enter valid numbers in all fields.");
      return;
    }

    if (Number(duration) <= 0) {
      setError("Total time must be greater than zero.");
      return;
    }

    if (
      !Number.isInteger(Number(sampleCount)) ||
      Number(sampleCount) < 2 ||
      Number(sampleCount) > 201
    ) {
      setError("Data points must be a whole number between 2 and 201.");
      return;
    }

    setError("");
  }

  const times = motion.map((point) => point.time);
  const finalPoint = motion[motion.length - 1];

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">PHASE 7 · VISUALIZATION</div>
          <h1>Engineering Graphs</h1>
          <p>
            Explore how displacement, velocity and acceleration change with
            time for constant acceleration motion.
          </p>
        </div>
        <span className="pill">MOTION ANALYSIS</span>
      </div>

      <section className="panel motion-input-panel">
        <div className="panel-heading">
          <div>
            <h2>Motion parameters</h2>
            <p>Change the values to update all three graphs.</p>
          </div>
          <span className="motion-chart-unit">SI units</span>
        </div>

        <div className="motion-input-grid">
          <div>
            <label htmlFor="motion-s0">Initial displacement (m)</label>
            <input
              id="motion-s0"
              type="number"
              step="any"
              value={initialDisplacement}
              onChange={(event) => {
                setInitialDisplacement(event.target.value);
                validateAndClearError();
              }}
            />
          </div>

          <div>
            <label htmlFor="motion-v0">Initial velocity (m/s)</label>
            <input
              id="motion-v0"
              type="number"
              step="any"
              value={initialVelocity}
              onChange={(event) => {
                setInitialVelocity(event.target.value);
                validateAndClearError();
              }}
            />
          </div>

          <div>
            <label htmlFor="motion-a">Acceleration (m/s²)</label>
            <input
              id="motion-a"
              type="number"
              step="any"
              value={acceleration}
              onChange={(event) => {
                setAcceleration(event.target.value);
                validateAndClearError();
              }}
            />
          </div>

          <div>
            <label htmlFor="motion-duration">Total time (s)</label>
            <input
              id="motion-duration"
              type="number"
              min="0.01"
              step="any"
              value={duration}
              onChange={(event) => {
                setDuration(event.target.value);
                validateAndClearError();
              }}
            />
          </div>

          <div>
            <label htmlFor="motion-samples">Data points (2–201)</label>
            <input
              id="motion-samples"
              type="number"
              min="2"
              max="201"
              step="1"
              value={sampleCount}
              onChange={(event) => {
                setSampleCount(event.target.value);
                validateAndClearError();
              }}
            />
          </div>
        </div>

        <div className="motion-actions">
          <button
            className="primary-button"
            type="button"
            onClick={handleGenerate}
          >
            Update graphs
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={resetInputs}
          >
            Reset values
          </button>
        </div>

        {error && (
          <div className="notice" role="alert">
            {error}
          </div>
        )}

        <p className="form-note">
          Model assumptions: one-dimensional motion, constant acceleration,
          and time measured from 0 seconds. Positive and negative values are
          supported.
        </p>
      </section>

      {motion.length > 0 && (
        <>
          <div className="motion-summary-grid">
            <div className="stat-card">
              <div className="stat-top">
                <span>Final displacement</span>
                <span className="stat-icon cyan">↗</span>
              </div>
              <strong>
                {finalPoint.displacement.toLocaleString(undefined, {
                  maximumFractionDigits: 3,
                })}{" "}
                m
              </strong>
              <span className="stat-note">At t = {duration} s</span>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Final velocity</span>
                <span className="stat-icon violet">→</span>
              </div>
              <strong>
                {finalPoint.velocity.toLocaleString(undefined, {
                  maximumFractionDigits: 3,
                })}{" "}
                m/s
              </strong>
              <span className="stat-note">v = v₀ + at</span>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Acceleration</span>
                <span className="stat-icon green">a</span>
              </div>
              <strong>
                {finalPoint.acceleration.toLocaleString(undefined, {
                  maximumFractionDigits: 3,
                })}{" "}
                m/s²
              </strong>
              <span className="stat-note">Constant throughout the motion</span>
            </div>
          </div>

          <div className="motion-graphs-grid">
            <MotionChart
              title="Displacement vs Time"
              subtitle="Position over time"
              yLabel="Displacement"
              unit="m"
              values={motion.map((point) => point.displacement)}
              times={times}
            />

            <MotionChart
              title="Velocity vs Time"
              subtitle="Rate of change of displacement"
              yLabel="Velocity"
              unit="m/s"
              values={motion.map((point) => point.velocity)}
              times={times}
            />

            <MotionChart
              title="Acceleration vs Time"
              subtitle="Rate of change of velocity"
              yLabel="Acceleration"
              unit="m/s²"
              values={motion.map((point) => point.acceleration)}
              times={times}
            />
          </div>

          <section className="panel motion-equations-panel">
            <h2>Equations used</h2>
            <p className="motion-equation">s = s₀ + v₀t + ½at²</p>
            <p className="motion-equation">v = v₀ + at</p>
            <p className="motion-equation">a = constant</p>
            <p className="form-note">
              These graphs are calculated in the browser from the equations
              above; they do not require a backend request.
            </p>
          </section>
        </>
      )}

      {motion.length === 0 && (
        <div className="notice" role="alert">
          Enter valid motion parameters to display the graphs.
        </div>
      )}
    </>
  );
}
