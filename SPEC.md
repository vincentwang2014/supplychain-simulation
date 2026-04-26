# Turn-Based Supply Chain Simulation Spec

## 1. Goal

Build a configurable, visual simulation inspired by the Beer Game where each supply-chain node makes local decisions under delayed information and delayed delivery.

The first target is a linear chain such as:

`Consumer -> Retailer -> Wholesaler -> Manufacturer`

The design must also support adding more intermediate nodes such as `Distributor`, `Regional Warehouse`, or custom roles without changing the simulation engine.

## 2. Product Vision

The app should support three layers:

1. A headless simulation engine that runs deterministic turn-based scenarios.
2. A visual web UI for configuration, playback, and analysis.
3. An online deployment where users can create, save, share, and replay scenarios.

## 3. Core Rules

### 3.1 Network shape

- The MVP uses a directed linear chain.
- Each node has exactly one downstream neighbor and one upstream neighbor, except:
  - `Consumer`, which creates demand and has no downstream supply customer.
  - The top-most source node, such as `Manufacturer`, which can produce and has no upstream supplier.
- The engine should be coded against a generic node graph model so future branching is possible, even if the initial UI only allows linear chains.

### 3.2 Information visibility

Each node may observe only:

- its own inventory
- its own backlog
- its own inbound shipment pipeline
- the order received from its direct downstream node this turn
- its own cost model
- its own policy parameters
- its own past history, if policy logic uses memory

Each node must not directly observe:

- upstream inventory
- upstream backlog
- end-customer demand unless it is the retailer or consumer-facing node
- global chain state

### 3.3 Turn mechanics

Each turn consists of:

1. Receive inbound shipments scheduled to arrive this turn.
2. Add arrivals to on-hand inventory.
3. Receive downstream order for this turn.
4. Combine new order with existing backlog to compute total owed demand.
5. Decide ship quantity, constrained by:
   - available inventory
   - total owed demand
6. Ship to downstream; shipment enters transit and arrives after the configured outbound lead time.
7. Update backlog with any unfilled demand.
8. Decide replenishment or production order to upstream based only on local information.
9. If the node has an upstream supplier:
   - send replenishment order upstream immediately as this turn's order.
10. If the node is a source/producer:
   - create production work that completes after production lead time and enters its own inventory or inbound pipeline.
11. Calculate economic results for the turn.
12. Persist a turn snapshot for charts, replay, and debugging.

### 3.4 Fulfillment constraints

- A node cannot ship more than on-hand inventory.
- A node cannot ship more than total owed demand.
- Unmet demand becomes backlog.
- Backlog rolls forward until fulfilled.
- Shipments and production are delayed by lead times.

## 4. Simulation Concepts

### 4.1 Entity model

Each node in the chain is represented by a generic `Node`.

Suggested TypeScript shape:

```ts
type NodeId = string;

type InventoryPipelineEntry = {
  quantity: number;
  arrivesOnTurn: number;
  sourceId?: NodeId;
};

type CostModel = {
  unitRevenue?: number;
  unitProcurementCost?: number;
  unitProductionCost?: number;
  unitHoldingCost: number;
  unitShortagePenalty: number;
  unitTransportCost?: number;
};

type PolicyContext = {
  turn: number;
  inventoryOnHand: number;
  backlog: number;
  inboundPipeline: InventoryPipelineEntry[];
  latestDownstreamOrder: number;
  recentHistory: NodeTurnState[];
  costModel: CostModel;
  leadTimes: {
    inbound: number;
    outbound: number;
    production?: number;
  };
};

type PolicyDecision = {
  shipTarget?: number;
  replenishOrder?: number;
  productionOrder?: number;
  rationale?: string;
};

type NodePolicy = {
  id: string;
  label: string;
  decide(context: PolicyContext): PolicyDecision;
};

type NodeConfig = {
  id: NodeId;
  name: string;
  role: "consumer" | "retailer" | "wholesaler" | "manufacturer" | "custom";
  upstreamNodeId?: NodeId;
  downstreamNodeId?: NodeId;
  initialInventory: number;
  initialBacklog?: number;
  inboundLeadTime: number;
  outboundLeadTime: number;
  productionLeadTime?: number;
  costModel: CostModel;
  policyId: string;
  policyParams?: Record<string, unknown>;
};

type NodeRuntimeState = {
  inventoryOnHand: number;
  backlog: number;
  inboundPipeline: InventoryPipelineEntry[];
  latestOrderReceived: number;
  latestShipmentSent: number;
  latestReplenishmentOrder: number;
  latestProductionOrder?: number;
  cumulativeProfit: number;
};
```

### 4.2 Scenario model

```ts
type DemandConfig =
  | { type: "constant"; value: number }
  | { type: "step"; initial: number; changes: Array<{ turn: number; value: number }> }
  | { type: "sequence"; values: number[] }
  | { type: "random"; seed: number; min: number; max: number };

type ScenarioConfig = {
  id: string;
  name: string;
  description?: string;
  turnCount: number;
  nodes: NodeConfig[];
  demand: DemandConfig;
  randomSeed?: number;
};
```

### 4.3 Turn snapshot model

```ts
type NodeTurnState = {
  turn: number;
  nodeId: NodeId;
  orderReceived: number;
  owedDemand: number;
  shipmentSent: number;
  backlogEnd: number;
  inventoryStart: number;
  inventoryEnd: number;
  arrivalsReceived: number;
  replenishmentOrderPlaced: number;
  productionOrderPlaced?: number;
  holdingCost: number;
  shortageCost: number;
  procurementCost: number;
  productionCost: number;
  transportCost: number;
  revenue: number;
  turnProfit: number;
  cumulativeProfit: number;
  rationale?: string;
};

type SimulationResult = {
  scenarioId: string;
  turns: number;
  nodeHistory: Record<NodeId, NodeTurnState[]>;
  aggregateMetrics: {
    totalProfit: number;
    totalShortageCost: number;
    totalHoldingCost: number;
    bullwhipScore?: number;
  };
};
```

## 5. Turn Order in Detail

Use a strict order of operations every turn to avoid ambiguity.

### 5.1 Step A: Generate customer demand

- The consumer demand generator emits a demand value for the consumer-facing seller node.
- In the default chain, this becomes the retailer's `orderReceived` for the turn.

### 5.2 Step B: Process arrivals

For each node:

- find all inbound pipeline entries with `arrivesOnTurn === currentTurn`
- sum the quantities
- add to `inventoryOnHand`
- remove processed entries from the pipeline

### 5.3 Step C: Deliver current orders to nodes

For each node:

- assign this turn's incoming order from its downstream neighbor
- if consumer-facing, use generated demand

### 5.4 Step D: Compute owed demand

For each node:

`owedDemand = backlog + orderReceived`

### 5.5 Step E: Ship downstream

For each node:

`shipmentSent = min(inventoryOnHand, owedDemand, shipTargetOrInfinity)`

Where:

- `shipTargetOrInfinity` is optional if a policy wants to intentionally ship less than available supply
- by default, the system may set ship target to `owedDemand`

Then:

- `inventoryOnHand -= shipmentSent`
- `backlog = owedDemand - shipmentSent`
- if downstream exists, append a transit record to downstream inbound pipeline:
  - `quantity = shipmentSent`
  - `arrivesOnTurn = currentTurn + outboundLeadTime`

### 5.6 Step F: Decide replenishment or production

After shipping, each node evaluates its policy using only local information.

If node has upstream supplier:

- place `replenishmentOrder`
- this becomes the upstream node's incoming order for this turn

If node is a producer:

- place `productionOrder`
- append an internal pipeline record arriving on:
  - `currentTurn + productionLeadTime`

### 5.7 Step G: Economic calculation

For each node:

- `revenue = shipmentSent * unitRevenue`
- `holdingCost = inventoryOnHand * unitHoldingCost`
- `shortageCost = backlog * unitShortagePenalty`
- `procurementCost = replenishmentOrderReceivedAsShipmentCostBasis` if modeled
- `productionCost = productionOrder * unitProductionCost`
- `transportCost = shipmentSent * unitTransportCost`
- `turnProfit = revenue - holdingCost - shortageCost - procurementCost - productionCost - transportCost`

Notes:

- For the MVP, revenue can be modeled only for nodes that sell downstream, or omitted if focusing on cost minimization.
- If simplifying, the app can first optimize for minimizing total cost rather than computing full accounting profit.

## 6. Decision Policy System

Policies should be pluggable and deterministic given the same state and seed.

### 6.1 Initial built-in policies

#### Fixed order policy

Always order a constant amount.

Useful for baseline tests.

#### Base-stock policy

Order enough to reach a target inventory position:

`inventoryPosition = inventoryOnHand + inboundPipelineTotal - backlog`

`replenishmentOrder = max(0, targetBaseStock - inventoryPosition)`

#### Demand-chasing policy

Order based on recent downstream order signal:

`replenishmentOrder = latestDownstreamOrder + backlogAdjustment + safetyStockAdjustment`

#### Profit-aware heuristic policy

Heuristic example:

- if shortage penalty is much higher than holding cost, bias toward larger replenishment
- if inbound pipeline is already high, reduce new orders
- if inventory is high and backlog is low, throttle replenishment

This is not true global optimization; it is local expected-value decision making using only visible state.

### 6.2 Policy interface rules

- Policy must not read global simulation state.
- Policy receives a local `PolicyContext`.
- Policy returns quantities and optional rationale text.
- Rationale should be safe to display in the UI.

## 7. Cost and Objective Model

### 7.1 Required costs

- holding cost per unit carried at end of turn
- shortage penalty per unit backlogged at end of turn

### 7.2 Optional costs

- unit production cost
- unit procurement cost
- unit transport cost
- node-specific selling price

### 7.3 Optimization framing

For the first version, each node's objective should be local expected profit or local cost minimization under uncertainty.

That means the node decides based on:

- current inventory risk
- backlog penalty risk
- visible pipeline
- downstream order signal
- its own lead times

The app should make clear that nodes are not solving a centralized global optimum unless a future special policy is added.

## 8. Configuration Requirements

The scenario editor and config format should allow:

- arbitrary node count in a linear chain
- custom node names and roles
- initial inventory and backlog
- lead times by node
- cost models by node
- policy assignment by node
- demand generator settings
- turn count
- random seed

Validation rules:

- node IDs must be unique
- linear topology must have exactly one consumer-facing start and one source end
- lead times must be non-negative integers
- costs must be non-negative
- inventories and backlogs must be non-negative
- producer nodes must define production lead time if they use production

## 9. Frontend App Structure

Recommended stack:

- React
- TypeScript
- Vite
- Zustand or Redux Toolkit for app state
- React Flow for chain visualization
- Recharts or ECharts for metrics charts
- Tailwind CSS or CSS modules for styling

Suggested app sections:

1. Scenario Builder
2. Simulation Controls
3. Chain View
4. Turn Detail Panel
5. Metrics Dashboard
6. Explanation Panel

### 9.1 Scenario Builder

User can:

- add/remove/reorder nodes
- edit costs and lead times
- choose policies
- set initial stock
- choose demand pattern

### 9.2 Simulation Controls

- run
- pause
- next turn
- previous turn
- reset
- speed control for autoplay

### 9.3 Chain View

For each node display:

- inventory
- backlog
- inbound pipeline summary
- latest order received
- latest shipment sent
- cumulative profit

### 9.4 Charts

Minimum charts:

- inventory by turn
- backlog by turn
- orders placed by turn
- shipments received by turn
- cumulative profit by turn

Useful advanced chart:

- bullwhip amplification by tier

### 9.5 Explanation panel

Show per-node reasoning:

- observed demand/order
- stock and backlog state
- pipeline state
- policy output
- short rationale text

## 10. Backend and Persistence

The first version can be frontend-only if scenarios are local and simulation runs in-browser.

For online publishing, add:

- scenario persistence
- saved run history
- optional auth
- shared links for public scenarios

Suggested backend options:

- Supabase for storage/auth
- or a lightweight Node API if custom server logic is needed

Persist at least:

- scenarios
- run metadata
- simulation outputs or seeds needed to reproduce outputs

## 11. Testing Strategy

### 11.1 Unit tests for engine

Test:

- arrivals are applied on the correct turn
- shipments are capped by inventory
- shipments are capped by owed demand
- backlog rolls forward correctly
- production arrives after production lead time
- same seed produces same random demand
- policy interface receives only local state

### 11.2 Scenario tests

Test scenario A: Stable demand

- constant demand
- adequate base-stock settings
- backlog should stabilize near zero

Test scenario B: Demand shock

- demand jumps mid-run
- downstream nodes react first
- upstream amplification should appear

Test scenario C: Severe lead-time delay

- shortages should increase
- policy behavior should differ from low-delay case

Test scenario D: Extra node inserted

- `Consumer -> Retailer -> Distributor -> Wholesaler -> Manufacturer`
- engine should run with no code changes

### 11.3 UI tests

Test:

- scenario edits update simulation inputs
- step playback changes visible node state
- charts match simulation snapshots
- explanation panel matches selected node and turn

## 12. Delivery Roadmap

### Milestone 1: Headless engine

Deliverables:

- config schema
- node model
- turn engine
- built-in policies
- unit tests

Done when:

- a CLI or test harness can run a 20-turn scenario and print state snapshots

### Milestone 2: Basic web UI

Deliverables:

- scenario loader
- run/reset controls
- chain visualization
- turn playback
- summary charts

Done when:

- a user can run the default Beer Game scenario in the browser and inspect each turn

### Milestone 3: Configurable scenarios

Deliverables:

- scenario builder
- custom node insertion/removal
- editable costs and lead times
- demand pattern editor

Done when:

- a user can create a five-node scenario without editing code

### Milestone 4: Online publishable app

Deliverables:

- persistence
- shareable links
- deployment pipeline

Done when:

- a public URL can load saved scenarios and replay runs

## 13. Recommended Repository Layout

```text
src/
  app/
    routes/
    store/
  simulation/
    engine/
      runSimulation.ts
      processTurn.ts
      policies/
      economics/
      validation/
    models/
      types.ts
      schema.ts
    fixtures/
      beerGame.ts
      demandScenarios.ts
  components/
    scenario-builder/
    chain-view/
    charts/
    controls/
    explanation-panel/
  lib/
    utils/
tests/
  simulation/
  components/
```

## 14. MVP Recommendation

To keep the first implementation focused, ship this MVP:

- linear chain only
- configurable node count
- deterministic engine
- constant, step, and seeded-random demand
- fixed, base-stock, and profit-aware heuristic policies
- turn playback UI
- inventory/backlog/order/profit charts

Defer until later:

- branching supply networks
- multiplayer live game sessions
- machine-learned policies
- advanced enterprise accounting

## 15. Immediate Next Build Step

The best next implementation step is:

1. Create the TypeScript domain types.
2. Implement the pure simulation engine with no UI.
3. Add fixture scenarios and engine tests.
4. Only then build the React visualization around the snapshots.

This keeps the product testable and prevents UI work from obscuring simulation bugs.
