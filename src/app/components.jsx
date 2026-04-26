import React from "react";

import { formatNumber, sumHistoryMetric, chartPath } from "./utils.js";

function Sparkline({ values, stroke, fill }) {
  const { line, area, width, height } = chartPath(values);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="sparkline" role="img" aria-label="chart">
      <path d={area} fill={fill} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeroMetrics({ result, selectedTurn, turnCount }) {
  return (
    <section className="panel hero">
      <div className="hero-copy">
        <p className="eyebrow">Turn-Based Supply Chain Simulation</p>
        <h1>See delayed orders become delayed chaos.</h1>
        <p className="lede">
          This React shell still runs on the same headless engine. Each node reacts only to local
          information, lead times, inventory, backlog, and cost pressure.
        </p>
      </div>
      <div className="hero-metrics">
        <div className="metric-card">
          <span>Total Profit</span>
          <strong>{formatNumber(result?.aggregateMetrics.totalProfit ?? 0)}</strong>
        </div>
        <div className="metric-card">
          <span>Total Shortage Cost</span>
          <strong>{formatNumber(result?.aggregateMetrics.totalShortageCost ?? 0)}</strong>
        </div>
        <div className="metric-card">
          <span>
            Turn {selectedTurn} / {turnCount}
          </span>
          <strong>{formatNumber(result?.aggregateMetrics.totalHoldingCost ?? 0)}</strong>
        </div>
      </div>
    </section>
  );
}

export function ScenarioEditor({
  scenarioText,
  onScenarioTextChange,
  onReset,
  onRun,
  error,
}) {
  return (
    <div className="panel control-panel">
      <div className="section-heading">
        <h2>Scenario Config</h2>
        <button type="button" onClick={onReset} className="button ghost">
          Reset Default
        </button>
      </div>
      <p className="supporting">
        Edit the JSON to add more nodes, change lead times, swap policies, or update demand
        patterns.
      </p>
      <label className="field">
        <span>Scenario JSON</span>
        <textarea
          spellCheck="false"
          value={scenarioText}
          onChange={(event) => onScenarioTextChange(event.target.value)}
        />
      </label>
      <div className="error-text">{error}</div>
      <div className="button-row">
        <button type="button" onClick={onRun} className="button primary">
          Run Simulation
        </button>
      </div>
    </div>
  );
}

export function PlaybackPanel({
  selectedTurn,
  turnCount,
  autoplaying,
  speedMs,
  onTurnChange,
  onPrevious,
  onNext,
  onToggleAutoplay,
  onSpeedChange,
}) {
  return (
    <div className="panel playback-panel">
      <div className="section-heading">
        <h2>Playback</h2>
        <span className="turn-badge">
          Turn {selectedTurn} / {turnCount}
        </span>
      </div>
      <label className="field compact">
        <span>Selected Turn</span>
        <input
          type="range"
          min="1"
          max={turnCount}
          value={selectedTurn}
          onChange={(event) => onTurnChange(Number(event.target.value))}
        />
      </label>
      <div className="button-row">
        <button type="button" onClick={onPrevious} className="button ghost">
          Previous
        </button>
        <button type="button" onClick={onNext} className="button ghost">
          Next
        </button>
        <button type="button" onClick={onToggleAutoplay} className="button primary">
          {autoplaying ? "Pause" : "Autoplay"}
        </button>
      </div>
      <label className="field compact">
        <span>Autoplay Speed</span>
        <select value={speedMs} onChange={(event) => onSpeedChange(Number(event.target.value))}>
          <option value="1200">Slow</option>
          <option value="900">Normal</option>
          <option value="450">Fast</option>
        </select>
      </label>
      <div className="explanation-box">
        <h3>Simulation Rule Reminder</h3>
        <p>
          Orders move upstream inside the same turn. Shipments and production arrive later based on
          lead times. Backlog rolls over and shortage cost keeps pressure on each local decision.
        </p>
      </div>
    </div>
  );
}

export function ChainView({ orderedNodeIds, scenario, nodeHistory, selectedTurn }) {
  const cards = orderedNodeIds.map((nodeId, index) => {
    const turn = nodeHistory[nodeId][Math.max(0, selectedTurn - 1)];
    const node = scenario.nodes.find((entry) => entry.id === nodeId);

    return (
      <React.Fragment key={nodeId}>
        <article className="node-card">
          <div className="node-card-header">
            <div>
              <p className="node-role">{node.role}</p>
              <h3>{node.name}</h3>
            </div>
            <span className="node-index">{index + 1}</span>
          </div>
          <div className="node-stats">
            <div>
              <span>Order In</span>
              <strong>{formatNumber(turn.orderReceived)}</strong>
            </div>
            <div>
              <span>Shipment Out</span>
              <strong>{formatNumber(turn.shipmentSent)}</strong>
            </div>
            <div>
              <span>Inventory</span>
              <strong>{formatNumber(turn.inventoryEnd)}</strong>
            </div>
            <div>
              <span>Backlog</span>
              <strong>{formatNumber(turn.backlogEnd)}</strong>
            </div>
            <div>
              <span>Pipeline</span>
              <strong>{formatNumber(turn.inboundPipelineTotalEnd)}</strong>
            </div>
            <div>
              <span>Turn Profit</span>
              <strong>{formatNumber(turn.turnProfit)}</strong>
            </div>
          </div>
          <p className="node-rationale">{turn.rationale || "No rationale recorded."}</p>
        </article>
        {index < orderedNodeIds.length - 1 ? <div className="chain-arrow">→</div> : null}
      </React.Fragment>
    );
  });

  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Chain View</h2>
        <span className="supporting">
          Customer-facing node appears first. Each card reflects only local turn state.
        </span>
      </div>
      <div className="chain-row">{cards}</div>
    </section>
  );
}

export function TrendDashboard({ orderedNodeIds, scenario, nodeHistory }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Trend Dashboard</h2>
        <span className="supporting">
          These mini-charts come directly from turn snapshots, so UI and engine stay aligned.
        </span>
      </div>
      <div className="chart-grid">
        {orderedNodeIds.map((nodeId) => {
          const history = nodeHistory[nodeId];
          const node = scenario.nodes.find((entry) => entry.id === nodeId);

          return (
            <article className="chart-card" key={nodeId}>
              <div className="section-heading">
                <h3>{node.name}</h3>
                <span>{history.length} turns</span>
              </div>
              <div className="mini-chart">
                <p>Inventory</p>
                <Sparkline
                  values={sumHistoryMetric(history, "inventoryEnd")}
                  stroke="#0f6c5a"
                  fill="rgba(15, 108, 90, 0.16)"
                />
              </div>
              <div className="mini-chart">
                <p>Backlog</p>
                <Sparkline
                  values={sumHistoryMetric(history, "backlogEnd")}
                  stroke="#a63d40"
                  fill="rgba(166, 61, 64, 0.16)"
                />
              </div>
              <div className="mini-chart">
                <p>Cumulative Profit</p>
                <Sparkline
                  values={sumHistoryMetric(history, "cumulativeProfit")}
                  stroke="#2d4ea2"
                  fill="rgba(45, 78, 162, 0.16)"
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function TurnDetailTable({ orderedNodeIds, scenario, nodeHistory, selectedTurn }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Turn Detail</h2>
        <span className="supporting">A compact audit trail for the selected turn.</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Node</th>
              <th>Arrivals</th>
              <th>Order In</th>
              <th>Owed</th>
              <th>Ship Out</th>
              <th>Order Up</th>
              <th>Holding Cost</th>
              <th>Shortage Cost</th>
            </tr>
          </thead>
          <tbody>
            {orderedNodeIds.map((nodeId) => {
              const turn = nodeHistory[nodeId][Math.max(0, selectedTurn - 1)];
              const node = scenario.nodes.find((entry) => entry.id === nodeId);
              return (
                <tr key={nodeId}>
                  <td>{node.name}</td>
                  <td>{formatNumber(turn.arrivalsReceived)}</td>
                  <td>{formatNumber(turn.orderReceived)}</td>
                  <td>{formatNumber(turn.owedDemand)}</td>
                  <td>{formatNumber(turn.shipmentSent)}</td>
                  <td>
                    {formatNumber(turn.replenishmentOrderPlaced || turn.productionOrderPlaced || 0)}
                  </td>
                  <td>{formatNumber(turn.holdingCost)}</td>
                  <td>{formatNumber(turn.shortageCost)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
