export const beerGameScenario = {
  id: "beer-game-default",
  name: "Default Beer Game",
  turnCount: 12,
  demand: {
    type: "step",
    initial: 4,
    changes: [{ turn: 7, value: 8 }],
  },
  nodes: [
    {
      id: "retailer",
      name: "Retailer",
      role: "retailer",
      upstreamNodeId: "wholesaler",
      initialInventory: 12,
      outboundLeadTime: 1,
      costModel: {
        unitRevenue: 8,
        unitProcurementCost: 4,
        unitHoldingCost: 1,
        unitShortagePenalty: 6,
      },
      policyId: "baseStock",
      policyParams: {
        targetBaseStock: 16,
      },
    },
    {
      id: "wholesaler",
      name: "Wholesaler",
      role: "wholesaler",
      upstreamNodeId: "manufacturer",
      downstreamNodeId: "retailer",
      initialInventory: 16,
      outboundLeadTime: 2,
      costModel: {
        unitRevenue: 7,
        unitProcurementCost: 3,
        unitHoldingCost: 1,
        unitShortagePenalty: 7,
      },
      policyId: "baseStock",
      policyParams: {
        targetBaseStock: 20,
      },
    },
    {
      id: "manufacturer",
      name: "Manufacturer",
      role: "manufacturer",
      downstreamNodeId: "wholesaler",
      initialInventory: 20,
      outboundLeadTime: 2,
      productionLeadTime: 2,
      costModel: {
        unitRevenue: 5,
        unitProductionCost: 2,
        unitHoldingCost: 1,
        unitShortagePenalty: 8,
      },
      policyId: "profitAware",
      policyParams: {
        targetCover: 1,
      },
    },
  ],
};
