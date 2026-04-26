/**
 * @typedef {Object} CostModel
 * @property {number} [unitRevenue]
 * @property {number} [unitProcurementCost]
 * @property {number} [unitProductionCost]
 * @property {number} [unitTransportCost]
 * @property {number} unitHoldingCost
 * @property {number} unitShortagePenalty
 */

/**
 * @typedef {Object} PipelineEntry
 * @property {number} quantity
 * @property {number} arrivesOnTurn
 * @property {string} [sourceId]
 */

/**
 * @typedef {Object} NodeConfig
 * @property {string} id
 * @property {string} name
 * @property {"consumer"|"retailer"|"wholesaler"|"manufacturer"|"custom"} role
 * @property {string | undefined} [upstreamNodeId]
 * @property {string | undefined} [downstreamNodeId]
 * @property {number} initialInventory
 * @property {number} [initialBacklog]
 * @property {number} outboundLeadTime
 * @property {number} [productionLeadTime]
 * @property {CostModel} costModel
 * @property {string} policyId
 * @property {Record<string, unknown>} [policyParams]
 */

/**
 * @typedef {Object} DemandConfig
 * @property {"constant"|"step"|"sequence"|"random"} type
 * @property {number} [value]
 * @property {number} [initial]
 * @property {{ turn: number, value: number }[]} [changes]
 * @property {number[]} [values]
 * @property {number} [seed]
 * @property {number} [min]
 * @property {number} [max]
 */

/**
 * @typedef {Object} ScenarioConfig
 * @property {string} id
 * @property {string} name
 * @property {number} turnCount
 * @property {NodeConfig[]} nodes
 * @property {DemandConfig} demand
 */

export {};
