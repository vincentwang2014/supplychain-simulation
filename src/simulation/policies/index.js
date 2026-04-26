function sumPipeline(pipeline) {
  return pipeline.reduce((total, entry) => total + entry.quantity, 0);
}

function average(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function getRecentOrders(context, windowSize) {
  const historyOrders = context.recentHistory
    .map((turn) => turn.orderReceived)
    .filter((value) => Number.isFinite(value));
  const combined = [...historyOrders, context.latestDownstreamOrder];
  return combined.slice(-windowSize);
}

export function fixedOrderPolicy(context, params = {}) {
  const amount = Number(params.amount ?? 0);
  return {
    replenishOrder: Math.max(0, Math.floor(amount)),
    rationale: `Ordering fixed amount ${Math.max(0, Math.floor(amount))}.`,
  };
}

export function baseStockPolicy(context, params = {}) {
  const targetBaseStock = Number(params.targetBaseStock ?? 0);
  const inventoryPosition =
    context.inventoryOnHand + sumPipeline(context.inboundPipeline) - context.backlog;
  const replenishOrder = Math.max(0, Math.ceil(targetBaseStock - inventoryPosition));

  return {
    replenishOrder,
    rationale: `Inventory position is ${inventoryPosition}; ordering ${replenishOrder} to target base stock ${targetBaseStock}.`,
  };
}

export function profitAwareHeuristicPolicy(context, params = {}) {
  const pipelineTotal = sumPipeline(context.inboundPipeline);
  const holdingCost = context.costModel.unitHoldingCost;
  const shortageCost = context.costModel.unitShortagePenalty;
  const serviceBias = shortageCost > 0 ? shortageCost / Math.max(holdingCost, 0.01) : 1;
  const targetCover = Number(params.targetCover ?? 1);
  const safetyStock = Math.ceil(targetCover * context.latestDownstreamOrder * Math.min(serviceBias, 3));
  const targetPosition = context.backlog + context.latestDownstreamOrder + safetyStock;
  const currentPosition = context.inventoryOnHand + pipelineTotal;
  const replenishOrder = Math.max(0, Math.ceil(targetPosition - currentPosition));

  return {
    replenishOrder,
    rationale: `Backlog ${context.backlog}, latest order ${context.latestDownstreamOrder}, and service bias ${serviceBias.toFixed(2)} imply ordering ${replenishmentLabel(replenishOrder)}.`,
  };
}

export function forecastPolicy(context, params = {}) {
  const pipelineTotal = sumPipeline(context.inboundPipeline);
  const forecastWindow = Math.max(1, Math.floor(Number(params.forecastWindow ?? 4)));
  const sentiment = Number(params.sentiment ?? 0);
  const serviceLevel = Number(params.serviceLevel ?? 1.2);
  const smoothing = Number(params.smoothing ?? 0.55);
  const maxGrowthFactor = Number(params.maxGrowthFactor ?? 1.35);
  const visibleLead = Math.max(
    1,
    (context.leadTimes.outbound ?? 0) + (context.leadTimes.production ?? 0) + 1
  );
  const recentOrders = getRecentOrders(context, forecastWindow);
  const baseline = average(recentOrders);
  const trend = recentOrders.length > 1 ? recentOrders.at(-1) - recentOrders[0] : 0;
  const forecast = Math.max(0, baseline + trend * 0.2 + sentiment * baseline * 0.18);
  const shortagePressure =
    context.costModel.unitShortagePenalty / Math.max(context.costModel.unitHoldingCost, 0.25);
  const trendBuffer = Math.max(0, trend) * Math.min(shortagePressure / 10, 1.5);
  const safetyStock = Math.max(
    0,
    Math.ceil(forecast * Math.max(0.4, serviceLevel - 0.35) + trendBuffer)
  );
  const targetPosition = Math.ceil(context.backlog + forecast * Math.max(1, visibleLead - 1) + safetyStock);
  const currentPosition = context.inventoryOnHand + pipelineTotal;
  const rawReplenishOrder = Math.max(0, Math.ceil(targetPosition - currentPosition));
  const previousPlaced = context.recentHistory.at(-1)?.replenishmentOrderPlaced ?? context.latestDownstreamOrder;
  const smoothedOrder = previousPlaced * smoothing + rawReplenishOrder * (1 - smoothing);
  const cappedOrder =
    previousPlaced <= 0
      ? smoothedOrder
      : Math.min(smoothedOrder, Math.ceil(previousPlaced * maxGrowthFactor));
  const replenishOrder = Math.max(0, Math.ceil(cappedOrder));

  const sentimentLabel =
    sentiment > 0.35 ? "aggressive" : sentiment < -0.35 ? "conservative" : "balanced";

  return {
    replenishOrder,
    rationale: `Forecast policy sees avg demand ${baseline.toFixed(1)}, trend ${trend.toFixed(1)}, and a ${sentimentLabel} sentiment (${sentiment.toFixed(2)}). Raw need is ${rawReplenishOrder}, smoothed with factor ${smoothing.toFixed(2)}, growth capped at ${maxGrowthFactor.toFixed(2)}x, so it orders ${replenishmentLabel(replenishOrder)}.`,
  };
}

function replenishmentLabel(value) {
  return `${value}`;
}

export const builtInPolicies = {
  fixedOrder: fixedOrderPolicy,
  baseStock: baseStockPolicy,
  profitAware: profitAwareHeuristicPolicy,
  forecast: forecastPolicy,
};
