import { beerGameScenario } from "./beerGame.js";
import { runSimulation } from "../engine/runSimulation.js";

const result = runSimulation(beerGameScenario);

for (const nodeId of result.orderedNodeIds) {
  const finalTurn = result.nodeHistory[nodeId].at(-1);
  console.log(
    `${nodeId}: inventory=${finalTurn.inventoryEnd}, backlog=${finalTurn.backlogEnd}, cumulativeProfit=${finalTurn.cumulativeProfit}`
  );
}

console.log(JSON.stringify(result.aggregateMetrics, null, 2));
