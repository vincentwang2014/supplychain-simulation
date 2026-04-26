import { builtInPolicies } from "../policies/index.js";

function sumPipeline(pipeline) {
  return pipeline.reduce((total, entry) => total + entry.quantity, 0);
}

function popArrivals(pipeline, turn) {
  const arrivals = [];
  const remaining = [];

  for (const entry of pipeline) {
    if (entry.arrivesOnTurn === turn) {
      arrivals.push(entry);
    } else {
      remaining.push(entry);
    }
  }

  return { arrivals, remaining };
}

function defaultPolicyResolver(node, customPolicies) {
  if (customPolicies[node.policyId]) {
    return customPolicies[node.policyId];
  }

  const builtIn = builtInPolicies[node.policyId];
  if (!builtIn) {
    throw new Error(`Unknown policy "${node.policyId}" for node "${node.id}".`);
  }

  return builtIn;
}

export function processTurn({
  turn,
  orderedNodeIds,
  nodeConfigs,
  nodeStates,
  orderInputs,
  nodeHistory,
  policyRegistry = {},
}) {
  const activeOrders = { ...orderInputs };
  const turnStates = {};

  for (const nodeId of orderedNodeIds) {
    const node = nodeConfigs[nodeId];
    const state = nodeStates[nodeId];
    const history = nodeHistory[nodeId] ?? [];
    const inventoryStart = state.inventoryOnHand;

    const { arrivals, remaining } = popArrivals(state.inboundPipeline, turn);
    const arrivalsReceived = arrivals.reduce((total, entry) => total + entry.quantity, 0);
    state.inboundPipeline = remaining;
    state.inventoryOnHand += arrivalsReceived;

    const orderReceived = activeOrders[nodeId] ?? 0;
    const owedDemand = state.backlog + orderReceived;

    const policy = defaultPolicyResolver(node, policyRegistry);
    const policyContext = {
      turn,
      inventoryOnHand: state.inventoryOnHand,
      backlog: state.backlog,
      inboundPipeline: state.inboundPipeline.map((entry) => ({ ...entry })),
      latestDownstreamOrder: orderReceived,
      recentHistory: history.slice(-5),
      costModel: node.costModel,
      leadTimes: {
        outbound: node.outboundLeadTime,
        production: node.productionLeadTime,
      },
    };
    const decision = policy(policyContext, node.policyParams ?? {});
    const desiredShipment =
      decision.shipTarget === undefined
        ? owedDemand
        : Math.max(0, Math.floor(decision.shipTarget));
    const shipmentSent = Math.min(state.inventoryOnHand, owedDemand, desiredShipment);

    state.inventoryOnHand -= shipmentSent;
    state.backlog = owedDemand - shipmentSent;
    state.latestOrderReceived = orderReceived;
    state.latestShipmentSent = shipmentSent;

    if (node.downstreamNodeId) {
      nodeStates[node.downstreamNodeId].inboundPipeline.push({
        quantity: shipmentSent,
        arrivesOnTurn: turn + node.outboundLeadTime,
        sourceId: node.id,
      });
    }

    let replenishmentOrderPlaced = 0;
    let productionOrderPlaced = 0;

    if (node.upstreamNodeId) {
      replenishmentOrderPlaced = Math.max(0, Math.floor(decision.replenishOrder ?? 0));
      activeOrders[node.upstreamNodeId] = replenishmentOrderPlaced;
      state.latestReplenishmentOrder = replenishmentOrderPlaced;
    } else {
      productionOrderPlaced = Math.max(0, Math.floor(decision.productionOrder ?? decision.replenishOrder ?? 0));
      state.latestProductionOrder = productionOrderPlaced;
      state.inboundPipeline.push({
        quantity: productionOrderPlaced,
        arrivesOnTurn: turn + (node.productionLeadTime ?? 0),
        sourceId: node.id,
      });
    }

    const revenue = shipmentSent * (node.costModel.unitRevenue ?? 0);
    const holdingCost = state.inventoryOnHand * node.costModel.unitHoldingCost;
    const shortageCost = state.backlog * node.costModel.unitShortagePenalty;
    const procurementCost = replenishmentOrderPlaced * (node.costModel.unitProcurementCost ?? 0);
    const productionCost = productionOrderPlaced * (node.costModel.unitProductionCost ?? 0);
    const transportCost = shipmentSent * (node.costModel.unitTransportCost ?? 0);
    const turnProfit =
      revenue - holdingCost - shortageCost - procurementCost - productionCost - transportCost;

    state.cumulativeProfit += turnProfit;

    const turnState = {
      turn,
      nodeId,
      orderReceived,
      owedDemand,
      shipmentSent,
      backlogEnd: state.backlog,
      inventoryStart,
      inventoryEnd: state.inventoryOnHand,
      arrivalsReceived,
      inboundPipelineTotalEnd: sumPipeline(state.inboundPipeline),
      replenishmentOrderPlaced,
      productionOrderPlaced,
      holdingCost,
      shortageCost,
      procurementCost,
      productionCost,
      transportCost,
      revenue,
      turnProfit,
      cumulativeProfit: state.cumulativeProfit,
      rationale: decision.rationale ?? "",
    };

    turnStates[nodeId] = turnState;
    history.push(turnState);
    nodeHistory[nodeId] = history;
  }

  return {
    nextOrders: activeOrders,
    turnStates,
  };
}
