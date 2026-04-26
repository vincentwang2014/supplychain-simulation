export function safeParseScenario(text) {
  try {
    return { value: JSON.parse(text), error: "" };
  } catch (error) {
    return { value: null, error: error.message };
  }
}

export function sumHistoryMetric(turns, key) {
  return turns.map((turn) => turn[key]);
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export function chartPath(values, width = 320, height = 120) {
  if (!values.length) {
    return { line: "", area: "", width, height };
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const step = values.length === 1 ? width : width / (values.length - 1);

  const points = values.map((value, index) => {
    const x = Math.round(index * step);
    const y = Math.round(height - ((value - min) / range) * height);
    return [x, y];
  });

  const line = points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");

  const area = [`M 0 ${height}`, ...points.map(([x, y]) => `L ${x} ${y}`), `L ${width} ${height}`, "Z"].join(" ");

  return { line, area, width, height };
}
