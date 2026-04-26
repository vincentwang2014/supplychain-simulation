import test from "node:test";
import assert from "node:assert/strict";

import { runSimulation } from "../../src/simulation/engine/runSimulation.js";
import { beerGameScenario } from "../../src/simulation/fixtures/beerGame.js";

test("shipments are capped by available inventory", () => {
  const scenario = {
    id: "inventory-cap",
    name: "Inventory cap",
    turnCount: 1,
    demand: { type: "constant", value: 10 },
    nodes: [
      {
        id: "retailer",
        name: "Retailer",
        role: "retailer",
        upstreamNodeId: "manufacturer",
        initialInventory: 3,
        outboundLeadTime: 1,
        costModel: {
          unitHoldingCost: 1,
          unitShortagePenalty: 10,
        },
        policyId: "fixedOrder",
        policyParams: { amount: 10 },
      },
      {
        id: "manufacturer",
        name: "Manufacturer",
        role: "manufacturer",
        downstreamNodeId: "retailer",
        initialInventory: 0,
        outboundLeadTime: 1,
        productionLeadTime: 1,
        costModel: {
          unitHoldingCost: 1,
          unitShortagePenalty: 10,
          unitProductionCost: 1,
        },
        policyId: "fixedOrder",
        policyParams: { amount: 10 },
      },
    ],
  };

  const result = runSimulation(scenario);
  const retailerTurn = result.nodeHistory.retailer[0];

  assert.equal(retailerTurn.shipmentSent, 3);
  assert.equal(retailerTurn.backlogEnd, 7);
});

test("deliveries arrive after outbound lead time", () => {
  const scenario = {
    id: "lead-time",
    name: "Lead time",
    turnCount: 3,
    demand: { type: "sequence", values: [0, 0, 0] },
    nodes: [
      {
        id: "retailer",
        name: "Retailer",
        role: "retailer",
        upstreamNodeId: "manufacturer",
        initialInventory: 0,
        outboundLeadTime: 1,
        costModel: {
          unitHoldingCost: 1,
          unitShortagePenalty: 10,
        },
        policyId: "fixedOrder",
        policyParams: { amount: 0 },
      },
      {
        id: "manufacturer",
        name: "Manufacturer",
        role: "manufacturer",
        downstreamNodeId: "retailer",
        initialInventory: 5,
        outboundLeadTime: 2,
        productionLeadTime: 1,
        costModel: {
          unitHoldingCost: 1,
          unitShortagePenalty: 10,
          unitProductionCost: 1,
        },
        policyId: "fixedOrder",
        policyParams: { amount: 0 },
      },
    ],
  };

  const customPolicy = () => ({
    shipTarget: 2,
    replenishOrder: 0,
    rationale: "Manual shipment test",
  });

  const result = runSimulation(scenario, {
    policyRegistry: {
      fixedOrder: customPolicy,
    },
  });

  assert.equal(result.nodeHistory.retailer[0].arrivalsReceived, 0);
  assert.equal(result.nodeHistory.retailer[1].arrivalsReceived, 0);
  assert.equal(result.nodeHistory.retailer[2].arrivalsReceived, 2);
});

test("manufacturer production arrives after production lead time", () => {
  const scenario = {
    id: "production-delay",
    name: "Production delay",
    turnCount: 3,
    demand: { type: "constant", value: 0 },
    nodes: [
      {
        id: "retailer",
        name: "Retailer",
        role: "retailer",
        upstreamNodeId: "manufacturer",
        initialInventory: 0,
        outboundLeadTime: 1,
        costModel: {
          unitHoldingCost: 1,
          unitShortagePenalty: 10,
        },
        policyId: "fixedOrder",
        policyParams: { amount: 0 },
      },
      {
        id: "manufacturer",
        name: "Manufacturer",
        role: "manufacturer",
        downstreamNodeId: "retailer",
        initialInventory: 0,
        outboundLeadTime: 1,
        productionLeadTime: 2,
        costModel: {
          unitHoldingCost: 1,
          unitShortagePenalty: 10,
          unitProductionCost: 1,
        },
        policyId: "fixedOrder",
        policyParams: { amount: 3 },
      },
    ],
  };

  const result = runSimulation(scenario);

  assert.equal(result.nodeHistory.manufacturer[0].inventoryEnd, 0);
  assert.equal(result.nodeHistory.manufacturer[1].inventoryEnd, 0);
  assert.equal(result.nodeHistory.manufacturer[2].arrivalsReceived, 3);
});

test("same random seed produces deterministic demand", () => {
  const scenario = {
    ...beerGameScenario,
    demand: {
      type: "random",
      seed: 42,
      min: 1,
      max: 4,
    },
  };

  const first = runSimulation(scenario);
  const second = runSimulation(scenario);

  assert.deepEqual(
    first.nodeHistory.retailer.map((turn) => turn.orderReceived),
    second.nodeHistory.retailer.map((turn) => turn.orderReceived)
  );
});

test("extra chain node can be inserted without engine changes", () => {
  const scenario = {
    id: "extended-chain",
    name: "Extended chain",
    turnCount: 2,
    demand: { type: "constant", value: 5 },
    nodes: [
      {
        id: "retailer",
        name: "Retailer",
        role: "retailer",
        upstreamNodeId: "distributor",
        initialInventory: 10,
        outboundLeadTime: 1,
        costModel: {
          unitHoldingCost: 1,
          unitShortagePenalty: 10,
        },
        policyId: "fixedOrder",
        policyParams: { amount: 5 },
      },
      {
        id: "distributor",
        name: "Distributor",
        role: "custom",
        upstreamNodeId: "manufacturer",
        downstreamNodeId: "retailer",
        initialInventory: 10,
        outboundLeadTime: 1,
        costModel: {
          unitHoldingCost: 1,
          unitShortagePenalty: 10,
        },
        policyId: "fixedOrder",
        policyParams: { amount: 5 },
      },
      {
        id: "manufacturer",
        name: "Manufacturer",
        role: "manufacturer",
        downstreamNodeId: "distributor",
        initialInventory: 10,
        outboundLeadTime: 1,
        productionLeadTime: 1,
        costModel: {
          unitHoldingCost: 1,
          unitShortagePenalty: 10,
          unitProductionCost: 1,
        },
        policyId: "fixedOrder",
        policyParams: { amount: 5 },
      },
    ],
  };

  const result = runSimulation(scenario);

  assert.deepEqual(result.orderedNodeIds, ["retailer", "distributor", "manufacturer"]);
  assert.equal(result.nodeHistory.distributor.length, 2);
});
