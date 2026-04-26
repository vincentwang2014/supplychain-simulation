import { processTurn } from "./processTurn.js";
import { validateScenario } from "../validation/validateScenario.js";

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let value = Math.imul(t ^ (t >>> 15), 1 | t);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createDemandSampler(demand) {
  if (demand.type === "constant") {
    return () => demand.value ?? 0;
  }

  if (demand.type === "sequence") {
    return (turn) => demand.values?.[turn - 1] ?? 0;
  }

  if (demand.type === "step") {
    return (turn) => {
      let value = demand.initial ?? 0;
      for (const change of demand.changes ?? []) {
        if (turn >= change.turn) {
          value = change.value;
        }
      }
      return value;
    };
  }

  if (demand.type === "random") {
    const random = mulberry32(demand.seed ?? 1);
    const min = demand.min ?? 0;
    const max = demand.max ?? min;
    return () => min + Math.floor(random() * (max - min + 1));
  }

  throw new Error(`Unsupported demand type "${demand.type}".`);
}

function buildNodeMaps(nodes) {
  const nodeConfigs = {};
  for (const node of nodes) {
    nodeConfigs[node.id] = node;
  }
  return nodeConfigs;
}

function orderNodesDownstreamToUpstream(nodes) {
  const customerFacing = nodes.find((node) => !node.downstreamNodeId);
  if (!customerFacing) {
    throw new Error("Could not identify the customer-facing node.");
  }

  const ordered = [];
  let current = customerFacing;

  while (current) {
    ordered.push(current.id);
    current = current.upstreamNodeId
      ? nodes.find((node) => node.id === current.upstreamNodeId)
      : undefined;
  }

  if (ordered.length !== nodes.length) {
    throw new Error("Topology must be a single linear chain.");
  }

  return ordered;
}

function initializeNodeStates(nodes) {
  const nodeStates = {};

  for (const node of nodes) {
    nodeStates[node.id] = {
      inventoryOnHand: node.initialInventory,
      backlog: node.initialBacklog ?? 0,
      inboundPipeline: [],
      latestOrderReceived: 0,
      latestShipmentSent: 0,
      latestReplenishmentOrder: 0,
      latestProductionOrder: 0,
      cumulativeProfit: 0,
    };
  }

  return nodeStates;
}

function createEmptyHistory(nodes) {
  return Object.fromEntries(nodes.map((node) => [node.id, []]));
}

export function runSimulation(scenario, options = {}) {
  validateScenario(scenario);

  const orderedNodeIds = orderNodesDownstreamToUpstream(scenario.nodes);
  const nodeConfigs = buildNodeMaps(scenario.nodes);
  const nodeStates = initializeNodeStates(scenario.nodes);
  const nodeHistory = createEmptyHistory(scenario.nodes);
  const customerFacingNodeId = orderedNodeIds[0];
  const demandSampler = createDemandSampler(scenario.demand);

  for (let turn = 1; turn <= scenario.turnCount; turn += 1) {
    const orderInputs = {
      [customerFacingNodeId]: demandSampler(turn),
    };

    processTurn({
      turn,
      orderedNodeIds,
      nodeConfigs,
      nodeStates,
      orderInputs,
      nodeHistory,
      policyRegistry: options.policyRegistry,
    });
  }

  const aggregateMetrics = {
    totalProfit: 0,
    totalShortageCost: 0,
    totalHoldingCost: 0,
  };

  for (const history of Object.values(nodeHistory)) {
    for (const snapshot of history) {
      aggregateMetrics.totalProfit += snapshot.turnProfit;
      aggregateMetrics.totalShortageCost += snapshot.shortageCost;
      aggregateMetrics.totalHoldingCost += snapshot.holdingCost;
    }
  }

  return {
    scenarioId: scenario.id,
    turns: scenario.turnCount,
    orderedNodeIds,
    finalState: nodeStates,
    nodeHistory,
    aggregateMetrics,
  };
}
