import React, { useEffect, useMemo, useRef, useState } from "react";

import { runSimulation } from "../simulation/engine/runSimulation.js";
import { createDefaultScenario } from "./defaultScenario.js";
import { safeParseScenario } from "./utils.js";
import {
  ChainView,
  HeroMetrics,
  PlaybackPanel,
  ScenarioEditor,
  TrendDashboard,
  TurnDetailTable,
} from "./components.jsx";

const defaultScenario = createDefaultScenario();

function createInitialState() {
  const scenario = createDefaultScenario();
  return {
    scenario,
    scenarioText: JSON.stringify(scenario, null, 2),
    result: runSimulation(scenario),
    selectedTurn: 1,
    speedMs: 900,
    error: "",
  };
}

export default function App() {
  const initial = useMemo(() => createInitialState(), []);
  const [scenario, setScenario] = useState(initial.scenario);
  const [scenarioText, setScenarioText] = useState(initial.scenarioText);
  const [result, setResult] = useState(initial.result);
  const [selectedTurn, setSelectedTurn] = useState(initial.selectedTurn);
  const [speedMs, setSpeedMs] = useState(initial.speedMs);
  const [error, setError] = useState(initial.error);
  const [autoplaying, setAutoplaying] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!autoplaying) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return undefined;
    }

    intervalRef.current = window.setInterval(() => {
      setSelectedTurn((current) => {
        if (current >= result.turns) {
          setAutoplaying(false);
          return current;
        }
        return current + 1;
      });
    }, speedMs);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoplaying, result.turns, speedMs]);

  const handleRun = () => {
    const parsed = safeParseScenario(scenarioText);
    if (parsed.error) {
      setError(parsed.error);
      return;
    }

    const nextScenario = parsed.value;
    const nextResult = runSimulation(nextScenario);
    setAutoplaying(false);
    setError("");
    setScenario(nextScenario);
    setResult(nextResult);
    setSelectedTurn((current) => Math.min(current, nextResult.turns));
  };

  const handleReset = () => {
    const fresh = structuredClone(defaultScenario);
    setAutoplaying(false);
    setScenario(fresh);
    setScenarioText(JSON.stringify(fresh, null, 2));
    setResult(runSimulation(fresh));
    setSelectedTurn(1);
    setError("");
  };

  return (
    <main className="page-shell">
      <HeroMetrics result={result} selectedTurn={selectedTurn} turnCount={result.turns} />

      <section className="workspace-grid">
        <ScenarioEditor
          scenarioText={scenarioText}
          onScenarioTextChange={setScenarioText}
          onReset={handleReset}
          onRun={handleRun}
          error={error}
        />
        <PlaybackPanel
          selectedTurn={selectedTurn}
          turnCount={result.turns}
          autoplaying={autoplaying}
          speedMs={speedMs}
          onTurnChange={(turn) => {
            setAutoplaying(false);
            setSelectedTurn(turn);
          }}
          onPrevious={() => {
            setAutoplaying(false);
            setSelectedTurn((current) => Math.max(1, current - 1));
          }}
          onNext={() => {
            setAutoplaying(false);
            setSelectedTurn((current) => Math.min(result.turns, current + 1));
          }}
          onToggleAutoplay={() => setAutoplaying((current) => !current)}
          onSpeedChange={setSpeedMs}
        />
      </section>

      <ChainView
        orderedNodeIds={result.orderedNodeIds}
        scenario={scenario}
        nodeHistory={result.nodeHistory}
        selectedTurn={selectedTurn}
      />

      <TrendDashboard
        orderedNodeIds={result.orderedNodeIds}
        scenario={scenario}
        nodeHistory={result.nodeHistory}
      />

      <TurnDetailTable
        orderedNodeIds={result.orderedNodeIds}
        scenario={scenario}
        nodeHistory={result.nodeHistory}
        selectedTurn={selectedTurn}
      />
    </main>
  );
}
