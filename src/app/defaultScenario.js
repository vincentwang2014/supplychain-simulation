import { beerGameScenario } from "../simulation/fixtures/beerGame.js?v=20260425p";

export function createDefaultScenario() {
  const base = structuredClone(beerGameScenario);
  const retailer = {
    ...base.nodes[0],
    upstreamNodeId: "distributor",
    initialInventory: 8,
    outboundLeadTime: 2,
    costModel: {
      ...base.nodes[0].costModel,
      unitHoldingCost: 1,
      unitShortagePenalty: 10,
    },
    policyId: "forecast",
    policyParams: { forecastWindow: 4, sentiment: 0.08, serviceLevel: 1.0, smoothing: 0.55, maxGrowthFactor: 1.25 },
  };
  const wholesaler = {
    ...base.nodes[1],
    upstreamNodeId: "manufacturer",
    downstreamNodeId: "distributor",
    initialInventory: 10,
    outboundLeadTime: 3,
    costModel: {
      ...base.nodes[1].costModel,
      unitHoldingCost: 1,
      unitShortagePenalty: 12,
    },
    policyId: "forecast",
    policyParams: { forecastWindow: 5, sentiment: 0.18, serviceLevel: 1.05, smoothing: 0.6, maxGrowthFactor: 1.32 },
  };
  const manufacturer = {
    ...base.nodes[2],
    downstreamNodeId: "wholesaler",
    initialInventory: 10,
    outboundLeadTime: 3,
    productionLeadTime: 4,
    costModel: {
      ...base.nodes[2].costModel,
      unitHoldingCost: 1,
      unitShortagePenalty: 14,
    },
    policyParams: { targetCover: 2 },
  };

  const scenario = {
    ...base,
    turnCount: 16,
    nodes: [
      retailer,
      {
        id: "distributor",
        name: "Distributor",
        role: "custom",
        upstreamNodeId: "wholesaler",
        downstreamNodeId: "retailer",
        initialInventory: 8,
        outboundLeadTime: 3,
        costModel: {
          unitRevenue: 7.5,
          unitProcurementCost: 4,
          unitHoldingCost: 1,
          unitShortagePenalty: 11,
        },
        policyId: "forecast",
        policyParams: { forecastWindow: 5, sentiment: 0.12, serviceLevel: 1.02, smoothing: 0.58, maxGrowthFactor: 1.3 },
      },
      wholesaler,
      manufacturer,
    ],
  };

  return scenario;
}
