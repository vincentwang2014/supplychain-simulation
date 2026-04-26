function assertNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
}

function assertNonNegativeNumber(value, label) {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    throw new Error(`${label} must be a non-negative number.`);
  }
}

export function validateScenario(scenario) {
  if (!scenario || typeof scenario !== "object") {
    throw new Error("Scenario config is required.");
  }

  if (!Array.isArray(scenario.nodes) || scenario.nodes.length < 2) {
    throw new Error("Scenario must define at least two nodes.");
  }

  assertNonNegativeInteger(scenario.turnCount, "turnCount");

  const nodeIds = new Set();
  const upstreamIds = new Set();
  const downstreamIds = new Set();

  for (const node of scenario.nodes) {
    if (!node.id) {
      throw new Error("Each node must have an id.");
    }
    if (nodeIds.has(node.id)) {
      throw new Error(`Duplicate node id "${node.id}".`);
    }
    nodeIds.add(node.id);

    assertNonNegativeInteger(node.initialInventory, `${node.id}.initialInventory`);
    assertNonNegativeInteger(node.initialBacklog ?? 0, `${node.id}.initialBacklog`);
    assertNonNegativeInteger(node.outboundLeadTime, `${node.id}.outboundLeadTime`);

    if (node.productionLeadTime !== undefined) {
      assertNonNegativeInteger(node.productionLeadTime, `${node.id}.productionLeadTime`);
    }

    const costs = node.costModel ?? {};
    assertNonNegativeNumber(costs.unitHoldingCost, `${node.id}.costModel.unitHoldingCost`);
    assertNonNegativeNumber(costs.unitShortagePenalty, `${node.id}.costModel.unitShortagePenalty`);

    for (const key of [
      "unitRevenue",
      "unitProcurementCost",
      "unitProductionCost",
      "unitTransportCost",
    ]) {
      if (costs[key] !== undefined) {
        assertNonNegativeNumber(costs[key], `${node.id}.costModel.${key}`);
      }
    }

    if (!node.policyId) {
      throw new Error(`${node.id} must define a policyId.`);
    }

    if (node.upstreamNodeId) {
      upstreamIds.add(node.upstreamNodeId);
    }

    if (node.downstreamNodeId) {
      downstreamIds.add(node.downstreamNodeId);
    }
  }

  for (const node of scenario.nodes) {
    if (node.upstreamNodeId && !nodeIds.has(node.upstreamNodeId)) {
      throw new Error(`${node.id} references missing upstream node "${node.upstreamNodeId}".`);
    }

    if (node.downstreamNodeId && !nodeIds.has(node.downstreamNodeId)) {
      throw new Error(`${node.id} references missing downstream node "${node.downstreamNodeId}".`);
    }
  }

  const downstreamEndNodes = scenario.nodes.filter((node) => !node.downstreamNodeId);
  const upstreamEndNodes = scenario.nodes.filter((node) => !node.upstreamNodeId);

  if (downstreamEndNodes.length !== 1) {
    throw new Error("Linear topology must have exactly one customer-facing node.");
  }

  if (upstreamEndNodes.length !== 1) {
    throw new Error("Linear topology must have exactly one source node.");
  }

  for (const node of scenario.nodes) {
    if (node.role === "manufacturer" && node.productionLeadTime === undefined) {
      throw new Error(`${node.id} is a manufacturer and must define productionLeadTime.`);
    }
  }
}
