import { runSimulation } from "../simulation/engine/runSimulation.js?v=20260425s";
import { createDefaultScenario } from "./defaultScenario.js?v=20260425s";
import { formatNumber, sumHistoryMetric } from "./utils.js?v=20260425s";

const app = document.querySelector("#app");
const VERSION = "20260425s";
const SAVED_RUNS_KEY = "supply-chain-saved-simulations-v1";
const defaultScenario = createDefaultScenario();

function loadSavedSimulations() {
  try {
    const raw = window.localStorage.getItem(SAVED_RUNS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function createDefaultDemandBuilder(turnCount = 16) {
  return {
    mode: "step",
    turnCount,
    baseDemand: 4,
    shockDemand: 8,
    shockStartTurn: Math.min(7, turnCount),
    recoveryDemand: 6,
    recoveryStartTurn: Math.min(11, turnCount),
  };
}

const state = {
  scenarioText: JSON.stringify(defaultScenario, null, 2),
  scenario: structuredClone(defaultScenario),
  result: null,
  selectedTurn: 1,
  autoplayTimer: null,
  speedMs: 900,
  turnCount: defaultScenario.turnCount,
  demandSequenceText: inferDemandSequenceText(defaultScenario),
  demandBuilder: createDefaultDemandBuilder(defaultScenario.turnCount),
  compareScenarioText: JSON.stringify(defaultScenario, null, 2),
  compareDemandSequenceText: inferDemandSequenceText(defaultScenario),
  compareTurnCount: defaultScenario.turnCount,
  compareDemandBuilder: createDefaultDemandBuilder(defaultScenario.turnCount),
  compareResult: null,
  savedSimulations: loadSavedSimulations(),
  libraryMessage: "",
  dragNodeId: "",
  builderMoveNodeId: "",
  shareMessage: "",
  activePage: "home",
  language: "en",
};

const translations = {
  en: {
    brand: "Supply Chain Simulation",
    navHome: "Home",
    navModel: "Model",
    navRun: "Run",
    navShare: "Share",
    landingEyebrow: "Supply Chain Studio",
    landingTitle: "Watch demand ripple upstream.",
    landingLead:
      "Build a chain, inject demand shocks, tune replenishment logic, and watch the bullwhip effect unfold through orders, inventory, backlog, and profit.",
    bullet1: "Configurable demand and delays",
    bullet2: "Forecast, base-stock, and profit-aware policies",
    bullet3: "Playback, comparison, save, and share tools",
    ctaModel: "Start Modeling",
    ctaRun: "Open Analysis",
    ctaShare: "Share Scenarios",
    customerPeak: "Customer Peak",
    largestAmp: "Largest Amplification",
    mostAmpTier: "Most Amplified Tier",
    currentRun: "Current Run",
    currentRunText: "Use the tabs above to move between modeling, analysis, and sharing instead of scrolling through one long page.",
    latestRunPreview: "Latest Run Preview",
    turns: "turns",
    latestPreviewText: "This preview uses the most recent run so the landing page shows a real customer-demand versus upstream-order snapshot.",
    aboutTitle: "How It Works",
    aboutLead: "A configurable Beer Game style simulator for teaching, workshops, and what-if experiments.",
    about1Title: "Local Information Only",
    about1Body: "Each tier sees only its downstream order, local inventory, backlog, and delayed inbound supply. No one gets full-system visibility while deciding what to ship or order.",
    about2Title: "Delay Creates Distortion",
    about2Body: "Shipment and production delays create lag. That lag is what turns a modest customer shock into amplified waves of orders, backlog, and inventory upstream.",
    about3Title: "Strategy Shapes the Outcome",
    about3Body: "You can tune each node's policy, sentiment, service bias, and delays, then compare how conservative versus aggressive decisions change profit and the bullwhip effect.",
    howToTitle: "How To Use It",
    howToLead: "A short path for first-time users.",
    step1Title: "Shape Demand",
    step1Body: "Start in Model. Create a customer demand sequence or use a preset like Classic Bullwhip.",
    step2Title: "Tune The Chain",
    step2Body: "Add layers, change delays, and edit each node's strategy so you can test conservative versus aggressive behavior.",
    step3Title: "Run And Compare",
    step3Body: "Open Run to inspect playback, bullwhip charts, inventory oscillation, backlog, and turn-by-turn detail.",
    pageModelTitle: "Model Builder",
    pageModelLead: "Shape demand, build the chain, and tune each node before you run the simulation.",
    pageRunTitle: "Run And Analyze",
    pageRunLead: "Replay the scenario, inspect each tier, and compare bullwhip behavior across the chain.",
    pageShareTitle: "Share And Save",
    pageShareLead: "Store runs locally, export JSON, and hand off scenarios to others without exposing the full project.",
    footerText: "Configurable Beer Game style simulator for exploring delays, policies, profit, and the bullwhip effect.",
    whyUseful: "Why This Is Useful",
    whyUsefulText: "Use it for teaching, workshops, and strategy experiments where you want to explain how local decisions and delayed information create amplification upstream.",
  },
  zh: {
    brand: "供应链模拟器",
    navHome: "首页",
    navModel: "建模",
    navRun: "运行",
    navShare: "分享",
    landingEyebrow: "供应链工作室",
    landingTitle: "看需求波动如何层层放大。",
    landingLead: "构建供应链层级，注入需求冲击，调整补货策略，并观察牛鞭效应如何在订单、库存、缺货与利润中展开。",
    bullet1: "可配置的需求与延迟",
    bullet2: "预测、基准库存与利润导向策略",
    bullet3: "回放、对比、保存与分享",
    ctaModel: "开始建模",
    ctaRun: "打开分析",
    ctaShare: "分享场景",
    customerPeak: "客户需求峰值",
    largestAmp: "最大放大倍数",
    mostAmpTier: "放大最明显层级",
    currentRun: "当前运行",
    currentRunText: "使用上方标签在建模、分析和分享之间切换，而不必滚动浏览整个页面。",
    latestRunPreview: "最近运行预览",
    turns: "轮",
    latestPreviewText: "这个预览直接使用最近一次运行的数据，因此首页展示的是实时的需求与上游订货快照。",
    aboutTitle: "工作原理",
    aboutLead: "这是一个适用于教学、研讨和情景推演的可配置啤酒游戏模拟器。",
    about1Title: "只用本地信息决策",
    about1Body: "每一层只能看到下游订单、本地库存、缺货以及延迟到达的在途供应，无法看到全局信息。",
    about2Title: "延迟会放大波动",
    about2Body: "运输和生产延迟会造成反应滞后，而这种滞后会把轻微的需求变化放大成上游更强的订单、缺货和库存波动。",
    about3Title: "策略决定结果",
    about3Body: "你可以调整每个节点的策略、情绪系数、服务偏好和延迟，并比较保守与激进决策对利润和牛鞭效应的影响。",
    howToTitle: "使用方法",
    howToLead: "给第一次使用者的一条简明路径。",
    step1Title: "设定需求",
    step1Body: "先进入“建模”，创建客户需求序列，或者直接使用经典牛鞭预设。",
    step2Title: "调整链条",
    step2Body: "增加层级、修改延迟、编辑各节点策略，以测试保守与激进行为的差异。",
    step3Title: "运行并比较",
    step3Body: "进入“运行”查看回放、牛鞭图表、库存振荡、缺货变化以及逐轮明细。",
    pageModelTitle: "模型构建",
    pageModelLead: "在运行模拟前，先定义需求、搭建链条并调整每个节点的决策逻辑。",
    pageRunTitle: "运行与分析",
    pageRunLead: "回放场景、查看各层级状态，并比较牛鞭效应在整条链上的表现。",
    pageShareTitle: "保存与分享",
    pageShareLead: "把结果保存在本地，导出 JSON，并把场景交给其他人继续使用。",
    footerText: "一个用于探索延迟、策略、利润与牛鞭效应的可配置啤酒游戏模拟器。",
    whyUseful: "它适合做什么",
    whyUsefulText: "适合教学、工作坊和策略试验，用来解释局部决策与延迟信息如何在供应链中放大波动。",
  },
  fr: {
    brand: "Simulation de chaîne logistique",
    navHome: "Accueil",
    navModel: "Modèle",
    navRun: "Analyse",
    navShare: "Partager",
    landingEyebrow: "Studio Supply Chain",
    landingTitle: "Regardez la demande se propager vers l’amont.",
    landingLead: "Construisez une chaîne, injectez des chocs de demande, ajustez la logique de réapprovisionnement et observez l’effet coup de fouet dans les commandes, les stocks, les retards et le profit.",
    bullet1: "Demande et délais configurables",
    bullet2: "Politiques prévisionnelles, base-stock et orientées profit",
    bullet3: "Lecture, comparaison, sauvegarde et partage",
    ctaModel: "Commencer",
    ctaRun: "Ouvrir l’analyse",
    ctaShare: "Partager un scénario",
    customerPeak: "Pic de demande",
    largestAmp: "Amplification maximale",
    mostAmpTier: "Niveau le plus amplifié",
    currentRun: "Simulation actuelle",
    currentRunText: "Utilisez les onglets ci-dessus pour passer entre modélisation, analyse et partage sans faire défiler toute la page.",
    latestRunPreview: "Aperçu de la dernière simulation",
    turns: "tours",
    latestPreviewText: "Cet aperçu utilise la simulation la plus récente pour montrer un vrai instantané de la demande client et des commandes amont.",
    aboutTitle: "Comment cela fonctionne",
    aboutLead: "Un simulateur Beer Game configurable pour l’enseignement, les ateliers et les expériences de type what-if.",
    about1Title: "Information locale uniquement",
    about1Body: "Chaque niveau ne voit que la commande aval, son stock local, son backlog et les arrivées différées. Personne n’a une vue complète du système.",
    about2Title: "Le délai amplifie la variation",
    about2Body: "Les délais de transport et de production créent un décalage, et ce décalage transforme un petit choc de demande en oscillations amplifiées en amont.",
    about3Title: "La stratégie change le résultat",
    about3Body: "Vous pouvez ajuster la politique, le biais, le niveau de service et les délais de chaque nœud pour comparer des comportements prudents et agressifs.",
    howToTitle: "Comment l’utiliser",
    howToLead: "Un parcours court pour les nouveaux utilisateurs.",
    step1Title: "Définir la demande",
    step1Body: "Commencez dans Modèle. Créez une séquence de demande client ou utilisez un preset comme Classic Bullwhip.",
    step2Title: "Régler la chaîne",
    step2Body: "Ajoutez des niveaux, changez les délais et modifiez les stratégies de chaque nœud.",
    step3Title: "Lancer et comparer",
    step3Body: "Ouvrez Analyse pour voir la lecture, les graphiques, les oscillations de stock et le détail tour par tour.",
    pageModelTitle: "Constructeur de modèle",
    pageModelLead: "Définissez la demande, construisez la chaîne et réglez chaque nœud avant d’exécuter la simulation.",
    pageRunTitle: "Exécuter et analyser",
    pageRunLead: "Relisez le scénario, inspectez chaque niveau et comparez l’effet coup de fouet sur toute la chaîne.",
    pageShareTitle: "Partager et sauvegarder",
    pageShareLead: "Enregistrez localement, exportez en JSON et transmettez les scénarios à d’autres personnes.",
    footerText: "Un simulateur Beer Game configurable pour explorer les délais, les politiques, le profit et l’effet coup de fouet.",
    whyUseful: "Pourquoi c’est utile",
    whyUsefulText: "Idéal pour l’enseignement, les ateliers et les expériences stratégiques où l’on veut expliquer l’amplification des signaux.",
  },
  ja: {
    brand: "サプライチェーン・シミュレーター",
    navHome: "ホーム",
    navModel: "モデル",
    navRun: "分析",
    navShare: "共有",
    landingEyebrow: "サプライチェーン・スタジオ",
    landingTitle: "需要の波が上流へどう広がるかを見てみましょう。",
    landingLead: "チェーンを構築し、需要ショックを与え、補充ロジックを調整しながら、注文・在庫・欠品・利益に現れるブルウィップ効果を観察できます。",
    bullet1: "需要と遅延を柔軟に設定",
    bullet2: "予測型・ベースストック型・利益重視型の戦略",
    bullet3: "再生、比較、保存、共有に対応",
    ctaModel: "モデルを作る",
    ctaRun: "分析を見る",
    ctaShare: "シナリオを共有",
    customerPeak: "需要ピーク",
    largestAmp: "最大増幅",
    mostAmpTier: "最も増幅した層",
    currentRun: "現在の実行",
    currentRunText: "上のタブでモデリング、分析、共有を切り替えれば、長い1ページをスクロールする必要はありません。",
    latestRunPreview: "最新実行プレビュー",
    turns: "ターン",
    latestPreviewText: "このプレビューは最新の実行結果を使い、顧客需要と上流注文の実際のスナップショットを表示します。",
    aboutTitle: "使い方の考え方",
    aboutLead: "教育、ワークショップ、仮説検証に使える設定可能なビアゲーム型シミュレーターです。",
    about1Title: "見える情報はローカルのみ",
    about1Body: "各層が見えるのは下流注文、自分の在庫、バックログ、そして遅れて届く供給だけです。全体最適の視点はありません。",
    about2Title: "遅延がゆがみを生む",
    about2Body: "輸送や生産の遅延が反応のラグを生み、そのラグが小さな需要変化を上流の大きな振れへ変えていきます。",
    about3Title: "戦略で結果が変わる",
    about3Body: "各ノードの戦略、バイアス、サービスレベル、遅延を調整し、保守的な意思決定と攻撃的な意思決定を比較できます。",
    howToTitle: "使い方",
    howToLead: "初めて使う人向けの短い流れです。",
    step1Title: "需要を作る",
    step1Body: "まずモデル画面で需要系列を作るか、Classic Bullwhip のようなプリセットを使います。",
    step2Title: "チェーンを調整する",
    step2Body: "層を追加し、遅延を変え、各ノードの戦略を編集して行動の違いを試します。",
    step3Title: "実行して比較する",
    step3Body: "分析画面で再生、ブルウィップ・チャート、在庫振動、バックログ、ターン詳細を確認します。",
    pageModelTitle: "モデル構築",
    pageModelLead: "需要、チェーン構造、各ノードのロジックを調整してからシミュレーションを実行します。",
    pageRunTitle: "実行と分析",
    pageRunLead: "シナリオを再生し、各層の状態を見ながらブルウィップの広がりを比較します。",
    pageShareTitle: "保存と共有",
    pageShareLead: "結果をローカル保存し、JSON を書き出し、他の人へシナリオを渡せます。",
    footerText: "遅延、戦略、利益、ブルウィップ効果を探るための設定可能なビアゲーム型シミュレーターです。",
    whyUseful: "何に役立つか",
    whyUsefulText: "局所的な意思決定と遅れた情報がどのように増幅を生むかを説明したい教育や戦略ワークに向いています。",
  },
};

function t(key) {
  return translations[state.language]?.[key] ?? translations.en[key] ?? key;
}

function safeParseScenario(text) {
  try {
    return { value: JSON.parse(text), error: "" };
  } catch (error) {
    return { value: null, error: error.message };
  }
}

function inferDemandSequenceText(scenario) {
  const demand = scenario.demand ?? {};

  if (demand.type === "sequence" && Array.isArray(demand.values)) {
    return demand.values.join(", ");
  }

  if (demand.type === "constant") {
    return Array.from({ length: scenario.turnCount ?? 12 }, () => demand.value ?? 0).join(", ");
  }

  if (demand.type === "step") {
    const values = [];
    for (let turn = 1; turn <= (scenario.turnCount ?? 12); turn += 1) {
      let value = demand.initial ?? 0;
      for (const change of demand.changes ?? []) {
        if (turn >= change.turn) {
          value = change.value;
        }
      }
      values.push(value);
    }
    return values.join(", ");
  }

  return "4, 4, 4, 4, 8, 8, 8, 8, 6, 6, 6, 6";
}

function parseDemandSequence(text) {
  const parts = text
    .split(/[\s,]+/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (!parts.length) {
    return { values: null, error: "Enter at least one demand value." };
  }

  const values = parts.map((value) => Number(value));
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    return { values: null, error: "Demand values must be non-negative numbers." };
  }

  return { values: values.map((value) => Math.round(value)), error: "" };
}

function normalizeDemandValues(values, turnCount) {
  const normalizedTurnCount = Math.max(1, Math.round(Number(turnCount) || values.length || 1));
  if (!values.length) {
    return Array.from({ length: normalizedTurnCount }, () => 0);
  }

  if (values.length === normalizedTurnCount) {
    return values;
  }

  if (values.length > normalizedTurnCount) {
    return values.slice(0, normalizedTurnCount);
  }

  const last = values.at(-1);
  return [...values, ...Array.from({ length: normalizedTurnCount - values.length }, () => last)];
}

function generateDemandSequenceFromBuilder(builder) {
  const turnCount = Math.max(1, Math.round(Number(builder.turnCount) || 1));
  const baseDemand = Math.max(0, Math.round(Number(builder.baseDemand) || 0));
  const shockDemand = Math.max(0, Math.round(Number(builder.shockDemand) || 0));
  const shockStartTurn = Math.min(turnCount, Math.max(1, Math.round(Number(builder.shockStartTurn) || 1)));
  const recoveryDemand = Math.max(0, Math.round(Number(builder.recoveryDemand) || 0));
  const recoveryStartTurn = Math.min(
    turnCount + 1,
    Math.max(shockStartTurn + 1, Math.round(Number(builder.recoveryStartTurn) || turnCount + 1))
  );

  if (builder.mode === "constant") {
    return Array.from({ length: turnCount }, () => baseDemand);
  }

  if (builder.mode === "step") {
    return Array.from({ length: turnCount }, (_, index) => {
      const turn = index + 1;
      if (turn >= recoveryStartTurn) {
        return recoveryDemand;
      }
      if (turn >= shockStartTurn) {
        return shockDemand;
      }
      return baseDemand;
    });
  }

  if (builder.mode === "pulse") {
    return Array.from({ length: turnCount }, (_, index) => {
      const turn = index + 1;
      if (turn === shockStartTurn) {
        return shockDemand;
      }
      if (turn > shockStartTurn && turn >= recoveryStartTurn) {
        return recoveryDemand;
      }
      return baseDemand;
    });
  }

  return Array.from({ length: turnCount }, () => baseDemand);
}

function buildScenarioFromTextInputs(scenarioText, demandSequenceText, turnCount) {
  const parsedScenario = safeParseScenario(scenarioText);
  if (parsedScenario.error) {
    return { scenario: null, scenarioError: parsedScenario.error, demandError: "" };
  }

  const parsedDemand = parseDemandSequence(demandSequenceText);
  if (parsedDemand.error) {
    return { scenario: null, scenarioError: "", demandError: parsedDemand.error };
  }

  const scenario = structuredClone(parsedScenario.value);
  const normalizedValues = normalizeDemandValues(parsedDemand.values, turnCount);
  scenario.turnCount = normalizedValues.length;
  scenario.demand = {
    type: "sequence",
    values: normalizedValues,
  };

  return { scenario, scenarioError: "", demandError: "" };
}

function demandPreview(values, limit = 10) {
  if (values.length <= limit) {
    return values.join(", ");
  }
  return `${values.slice(0, limit).join(", ")} ...`;
}

function chartSvg({ values, stroke, fill, width = 360, height = 120 }) {
  if (!values.length) {
    return "";
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const step = values.length === 1 ? width : width / (values.length - 1);

  const points = values
    .map((value, index) => {
      const x = Math.round(index * step);
      const y = Math.round(height - ((value - min) / range) * height);
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return `
    <svg viewBox="0 0 ${width} ${height}" class="sparkline" role="img" aria-label="chart">
      <polyline points="${areaPoints}" fill="${fill}" stroke="none"></polyline>
      <polyline points="${points}" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
    </svg>
  `;
}

function multiSeriesChartSvg({ series, width = 720, height = 260 }) {
  const allValues = series.flatMap((entry) => entry.values);
  if (!allValues.length) {
    return "";
  }

  const padding = { top: 16, right: 18, bottom: 34, left: 44 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const range = Math.max(max - min, 1);
  const maxPoints = Math.max(...series.map((entry) => entry.values.length), 1);
  const step = maxPoints === 1 ? innerWidth : innerWidth / (maxPoints - 1);
  const tickValues = Array.from({ length: 5 }, (_, index) =>
    Math.round(max - (range / 4) * index)
  );
  const xTickIndexes = Array.from(
    new Set(
      [0, Math.floor((maxPoints - 1) / 3), Math.floor(((maxPoints - 1) * 2) / 3), maxPoints - 1].filter(
        (value) => value >= 0
      )
    )
  );

  const lines = series
    .map((entry) => {
      const points = entry.values
        .map((value, index) => {
          const x = Math.round(padding.left + index * step);
          const y = Math.round(
            padding.top + innerHeight - ((value - min) / range) * innerHeight
          );
          return `${x},${y}`;
        })
        .join(" ");

      const lastIndex = entry.values.length - 1;
      const lastX = Math.round(padding.left + lastIndex * step);
      const lastY = Math.round(
        padding.top + innerHeight - ((entry.values[lastIndex] - min) / range) * innerHeight
      );

      return `
        <polyline points="${points}" fill="none" stroke="${entry.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
        <circle cx="${lastX}" cy="${lastY}" r="4" fill="${entry.color}"></circle>
      `;
    })
    .join("");

  const grid = tickValues
    .map((tick) => {
      const y = Math.round(padding.top + innerHeight - ((tick - min) / range) * innerHeight);
      return `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(70,53,38,0.10)" stroke-width="1"></line>
        <text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" class="chart-axis-text">${tick}</text>
      `;
    })
    .join("");

  const xTicks = xTickIndexes
    .map((index) => {
      const x = Math.round(padding.left + index * step);
      return `
        <line x1="${x}" y1="${padding.top + innerHeight}" x2="${x}" y2="${padding.top + innerHeight + 6}" stroke="rgba(70,53,38,0.18)" stroke-width="1"></line>
        <text x="${x}" y="${height - 10}" text-anchor="middle" class="chart-axis-text">T${index + 1}</text>
      `;
    })
    .join("");

  const labels = `
    <text x="${padding.left}" y="${padding.top - 4}" class="chart-title-text">Orders received by turn</text>
    <text x="${width / 2}" y="${height - 2}" text-anchor="middle" class="chart-axis-text">Turn</text>
    <text transform="translate(14 ${height / 2}) rotate(-90)" text-anchor="middle" class="chart-axis-text">Units ordered</text>
  `;

  const plotBorder = `
    <rect
      x="${padding.left}"
      y="${padding.top}"
      width="${innerWidth}"
      height="${innerHeight}"
      rx="14"
      fill="rgba(255,255,255,0.35)"
      stroke="rgba(70,53,38,0.12)"
      stroke-width="1"
    ></rect>
  `;

    const seriesLabels = series
      .map((entry, index) => {
        const y = padding.top + 18 + index * 18;
        return `
          <line x1="${width - 146}" y1="${y}" x2="${width - 126}" y2="${y}" stroke="${entry.color}" stroke-width="3" stroke-linecap="round"></line>
          <text x="${width - 118}" y="${y + 4}" class="chart-series-text">${entry.label}</text>
        `;
      })
      .join("");

  return `
    <svg viewBox="0 0 ${width} ${height}" class="comparison-chart" role="img" aria-label="chart">
      ${plotBorder}
      ${grid}
      ${xTicks}
      ${lines}
      ${labels}
      ${seriesLabels}
    </svg>
  `;
}

function variance(values) {
  if (!values.length) {
    return 0;
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
}

function getTurnState(nodeId, turn) {
  return state.result.nodeHistory[nodeId][Math.max(0, turn - 1)];
}

function getCurrentScenarioFromEditor() {
  const parsed = safeParseScenario(state.scenarioText);
  return parsed.error ? state.scenario : parsed.value;
}

function getCurrentComparisonScenarioFromEditor() {
  const parsed = safeParseScenario(state.compareScenarioText);
  return parsed.error ? getCurrentScenarioFromEditor() : parsed.value;
}

function updateScenarioText(mutator) {
  const scenario = structuredClone(getCurrentScenarioFromEditor());
  mutator(scenario);
  state.scenarioText = JSON.stringify(scenario, null, 2);
  render();
}

function updateComparisonScenarioText(mutator) {
  const scenario = structuredClone(getCurrentComparisonScenarioFromEditor());
  mutator(scenario);
  state.compareScenarioText = JSON.stringify(scenario, null, 2);
  render();
}

function persistSavedSimulations() {
  try {
    window.localStorage.setItem(SAVED_RUNS_KEY, JSON.stringify(state.savedSimulations));
  } catch {
    state.libraryMessage = "This browser blocked local save. Download still works.";
  }
}

function slugify(value) {
  return String(value || "simulation")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function copyTextToClipboard(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    state.shareMessage = successMessage;
  } catch {
    state.shareMessage = "Clipboard access was blocked. Use the download buttons instead.";
  }
  render();
}

function createNodeId(name, existingIds) {
  const base = slugify(name || "layer") || "layer";
  let candidate = base;
  let suffix = 2;

  while (existingIds.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function defaultNodeTemplate(index, existingIds) {
  const name = `Layer ${index + 1}`;
  return {
    id: createNodeId(name, existingIds),
    name,
    role: "custom",
    initialInventory: 8,
    outboundLeadTime: 2,
    costModel: {
      unitRevenue: 7,
      unitProcurementCost: 4,
      unitHoldingCost: 1,
      unitShortagePenalty: 10,
      unitTransportCost: 0,
    },
    policyId: "forecast",
    policyParams: {
      forecastWindow: 4,
      sentiment: 0.12,
      serviceLevel: 1.02,
      smoothing: 0.5,
      maxGrowthFactor: 1.35,
    },
  };
}

function normalizeScenarioChain(scenario) {
  const nodes = (scenario.nodes ?? []).map((node, index, list) => {
    const total = list.length;
    const isCustomerFacing = index === 0;
    const isSource = index === total - 1;
    const role =
      isSource ? "manufacturer" : node.role === "manufacturer" ? "custom" : node.role ?? (isCustomerFacing ? "retailer" : "custom");

    const normalized = {
      ...node,
      role,
      initialInventory: Math.max(0, Math.round(node.initialInventory ?? 0)),
      initialBacklog: Math.max(0, Math.round(node.initialBacklog ?? 0)),
      outboundLeadTime: Math.max(0, Math.round(node.outboundLeadTime ?? 0)),
      costModel: {
        unitRevenue: 0,
        unitProcurementCost: 0,
        unitProductionCost: 0,
        unitHoldingCost: 1,
        unitShortagePenalty: 8,
        unitTransportCost: 0,
        ...(node.costModel ?? {}),
      },
    };

    if (isSource) {
      normalized.productionLeadTime = Math.max(0, Math.round(node.productionLeadTime ?? 2));
    } else {
      delete normalized.productionLeadTime;
    }

    return normalized;
  });

  scenario.nodes = nodes.map((node, index) => ({
    ...node,
    downstreamNodeId: index === 0 ? undefined : nodes[index - 1].id,
    upstreamNodeId: index === nodes.length - 1 ? undefined : nodes[index + 1].id,
  }));

  return scenario;
}

function mutateStructuredScenario(mutator) {
  updateScenarioText((scenario) => {
    mutator(scenario);
    normalizeScenarioChain(scenario);
  });
}

function mutateStructuredComparisonScenario(mutator) {
  updateComparisonScenarioText((scenario) => {
    mutator(scenario);
    normalizeScenarioChain(scenario);
  });
}

function insertNodeAt(index) {
  mutateStructuredScenario((scenario) => {
    const existingIds = new Set(scenario.nodes.map((node) => node.id));
    scenario.nodes.splice(index, 0, defaultNodeTemplate(index, existingIds));
  });
}

function removeNode(nodeId) {
  mutateStructuredScenario((scenario) => {
    if (scenario.nodes.length <= 2) {
      return;
    }
    scenario.nodes = scenario.nodes.filter((node) => node.id !== nodeId);
  });
}

function moveNode(nodeId, offset) {
  mutateStructuredScenario((scenario) => {
    const currentIndex = scenario.nodes.findIndex((node) => node.id === nodeId);
    if (currentIndex === -1) {
      return;
    }
    const targetIndex = Math.max(0, Math.min(scenario.nodes.length - 1, currentIndex + offset));
    if (targetIndex === currentIndex) {
      return;
    }
    const [node] = scenario.nodes.splice(currentIndex, 1);
    scenario.nodes.splice(targetIndex, 0, node);
  });
}

function reorderNode(nodeId, dropIndex) {
  mutateStructuredScenario((scenario) => {
    const currentIndex = scenario.nodes.findIndex((node) => node.id === nodeId);
    if (currentIndex === -1) {
      return;
    }

    const [node] = scenario.nodes.splice(currentIndex, 1);
    const targetIndex = currentIndex < dropIndex ? dropIndex - 1 : dropIndex;
    const normalizedIndex = Math.max(0, Math.min(scenario.nodes.length, targetIndex));
    scenario.nodes.splice(normalizedIndex, 0, node);
  });
  state.builderMoveNodeId = "";
  state.dragNodeId = "";
}

function buildRunExportPayload(resultOverride = null) {
  return {
    kind: "simulation-run",
    version: VERSION,
    exportedAt: new Date().toISOString(),
    scenario: structuredClone(state.scenario),
    result: structuredClone(resultOverride ?? state.result),
    demandSequence: state.demandSequenceText,
    turnCount: state.turnCount,
  };
}

function saveCurrentSimulation() {
  const built = buildScenarioFromEditors();
  if (built.scenarioError || built.demandError) {
    state.libraryMessage = built.scenarioError || built.demandError;
    render();
    return;
  }

  const result = runSimulation(built.scenario);
  state.scenario = built.scenario;
  state.scenarioText = JSON.stringify(built.scenario, null, 2);
  state.result = result;
  state.turnCount = built.scenario.turnCount;
  state.selectedTurn = Math.min(state.selectedTurn, result.turns);

  const entry = {
    id: `saved-${Date.now()}`,
    label: `${built.scenario.name || "Simulation"} · ${new Date().toLocaleString()}`,
    savedAt: new Date().toISOString(),
    turnCount: built.scenario.turnCount,
    nodeCount: built.scenario.nodes.length,
    scenario: structuredClone(built.scenario),
    result: structuredClone(result),
    demandSequence: state.demandSequenceText,
  };

  state.savedSimulations = [entry, ...state.savedSimulations].slice(0, 20);
  persistSavedSimulations();
  state.libraryMessage = `Saved "${entry.label}" locally in this browser.`;
  render();
}

function downloadCurrentScenario() {
  const built = buildScenarioFromEditors();
  if (built.scenarioError || built.demandError) {
    state.libraryMessage = built.scenarioError || built.demandError;
    render();
    return;
  }

  downloadJson(
    `${slugify(built.scenario.name)}-scenario.json`,
    {
      kind: "scenario-config",
      version: VERSION,
      exportedAt: new Date().toISOString(),
      scenario: built.scenario,
      demandSequence: state.demandSequenceText,
      turnCount: built.scenario.turnCount,
    }
  );
  state.libraryMessage = "Downloaded the current scenario JSON.";
  render();
}

function downloadCurrentSimulation() {
  const built = buildScenarioFromEditors();
  if (built.scenarioError || built.demandError) {
    state.libraryMessage = built.scenarioError || built.demandError;
    render();
    return;
  }

  const result = runSimulation(built.scenario);
  state.scenario = built.scenario;
  state.scenarioText = JSON.stringify(built.scenario, null, 2);
  state.result = result;
  downloadJson(`${slugify(built.scenario.name)}-run.json`, buildRunExportPayload(result));
  state.libraryMessage = "Downloaded the simulation run JSON.";
  render();
}

function loadSavedSimulation(runId) {
  const entry = state.savedSimulations.find((saved) => saved.id === runId);
  if (!entry) {
    return;
  }

  state.scenario = structuredClone(entry.scenario);
  state.scenarioText = JSON.stringify(entry.scenario, null, 2);
  state.turnCount = entry.turnCount ?? entry.scenario.turnCount;
  state.demandSequenceText = entry.demandSequence || inferDemandSequenceText(entry.scenario);
  state.demandBuilder = createDefaultDemandBuilder(state.turnCount);
  state.result = structuredClone(entry.result ?? runSimulation(entry.scenario));
  state.selectedTurn = 1;
  state.libraryMessage = `Loaded "${entry.label}".`;
  render();
}

function deleteSavedSimulation(runId) {
  state.savedSimulations = state.savedSimulations.filter((saved) => saved.id !== runId);
  persistSavedSimulations();
  state.libraryMessage = "Removed the saved simulation.";
  render();
}

function downloadSavedSimulation(runId) {
  const entry = state.savedSimulations.find((saved) => saved.id === runId);
  if (!entry) {
    return;
  }

  downloadJson(
    `${slugify(entry.label)}.json`,
    {
      kind: "simulation-run",
      version: VERSION,
      exportedAt: new Date().toISOString(),
      scenario: entry.scenario,
      result: entry.result,
      demandSequence: entry.demandSequence,
      turnCount: entry.turnCount,
    }
  );
  state.libraryMessage = `Downloaded "${entry.label}".`;
  render();
}

async function importSimulationFile(file) {
  if (!file) {
    return;
  }

  try {
    const raw = await file.text();
    const parsed = JSON.parse(raw);
    const scenario = parsed.scenario ?? parsed;
    const demandSequence = parsed.demandSequence ?? inferDemandSequenceText(scenario);

    state.scenario = structuredClone(scenario);
    state.scenarioText = JSON.stringify(scenario, null, 2);
    state.turnCount = parsed.turnCount ?? scenario.turnCount;
    state.demandSequenceText = demandSequence;
    state.demandBuilder = createDefaultDemandBuilder(state.turnCount);
    state.result = parsed.result ? structuredClone(parsed.result) : runSimulation(scenario);
    state.selectedTurn = 1;
    state.libraryMessage = `Imported "${file.name}".`;
  } catch (error) {
    state.libraryMessage = `Could not import JSON: ${error.message}`;
  }

  render();
}

function createTopNavMarkupLegacy() {
  const pages = [
    { id: "home", label: t("navHome") },
    { id: "model", label: t("navModel") },
    { id: "run", label: t("navRun") },
    { id: "share", label: t("navShare") },
  ];

  return `
    <section class="top-nav-shell">
      <div class="top-nav">
        <button class="brand-mark brand-button" data-page-id="home">${t("brand")}</button>
        <nav class="top-nav-links" aria-label="Primary">
          ${pages
            .map(
              (page) => `
            <button class="top-nav-tab ${state.activePage === page.id ? "is-active" : ""}" data-page-id="${page.id}">
              ${page.label}
            </button>
          `
            )
            .join("")}
        </nav>
        <label class="language-switch">
          <span>Lang</span>
          <select id="language-select">
            <option value="en" ${state.language === "en" ? "selected" : ""}>English</option>
            <option value="zh" ${state.language === "zh" ? "selected" : ""}>中文</option>
            <option value="fr" ${state.language === "fr" ? "selected" : ""}>Français</option>
            <option value="ja" ${state.language === "ja" ? "selected" : ""}>日本語</option>
          </select>
        </label>
      </div>
    </section>
  `;
}

function createAboutMarkupLegacy() {
  return `
    <section id="about-sim" class="panel about-panel">
      <div class="section-heading">
        <h2>How It Works</h2>
        <span class="supporting">A configurable Beer Game style simulator for teaching, workshops, and what-if experiments.</span>
      </div>
      <div class="about-grid">
        <article class="about-card">
          <h3>Local Information Only</h3>
          <p class="supporting">Each tier sees only its downstream order, local inventory, backlog, and delayed inbound supply. No one gets full-system visibility while deciding what to ship or order.</p>
        </article>
        <article class="about-card">
          <h3>Delay Creates Distortion</h3>
          <p class="supporting">Shipment and production delays create lag. That lag is what turns a modest customer shock into amplified waves of orders, backlog, and inventory upstream.</p>
        </article>
        <article class="about-card">
          <h3>Strategy Shapes the Outcome</h3>
          <p class="supporting">You can tune each node’s policy, sentiment, service bias, and delays, then compare how conservative vs aggressive decisions change profit and the bullwhip effect.</p>
        </article>
      </div>
    </section>
  `;
}

function createGettingStartedMarkupLegacy() {
  return `
    <section class="panel getting-started-panel">
      <div class="section-heading">
        <h2>How To Use It</h2>
        <span class="supporting">A short path for first-time users.</span>
      </div>
      <div class="about-grid">
        <article class="about-card step-card">
          <span class="step-index">1</span>
          <h3>Shape Demand</h3>
          <p class="supporting">Start in <strong>Model</strong>. Create a customer demand sequence or use a preset like Classic Bullwhip.</p>
        </article>
        <article class="about-card step-card">
          <span class="step-index">2</span>
          <h3>Tune The Chain</h3>
          <p class="supporting">Add layers, change delays, and edit each node’s strategy so you can test conservative versus aggressive behavior.</p>
        </article>
        <article class="about-card step-card">
          <span class="step-index">3</span>
          <h3>Run And Compare</h3>
          <p class="supporting">Open <strong>Run</strong> to inspect playback, bullwhip charts, inventory oscillation, backlog, and turn-by-turn detail.</p>
        </article>
      </div>
      <div class="button-row landing-actions">
        <button class="button primary" data-page-id="model">Start Modeling</button>
        <button class="button ghost" data-page-id="run">Jump To Analysis</button>
        <button class="button ghost" data-page-id="share">Open Share Tools</button>
      </div>
    </section>
  `;
}

function applyDemandSequenceFromInput() {
  const parsed = parseDemandSequence(state.demandSequenceText);
  const errorEl = document.querySelector("#demand-error");

  if (parsed.error) {
    if (errorEl) {
      errorEl.textContent = parsed.error;
    }
    return;
  }

  updateScenarioText((scenario) => {
    const values = normalizeDemandValues(parsed.values, state.turnCount);
    scenario.turnCount = values.length;
    scenario.demand = {
      type: "sequence",
      values,
    };
  });

  if (errorEl) {
    errorEl.textContent = "";
  }
}

function applyGeneratedDemand(compare = false) {
  const builder = compare ? state.compareDemandBuilder : state.demandBuilder;
  const values = generateDemandSequenceFromBuilder(builder);
  const sequenceText = values.join(", ");

  if (compare) {
    state.compareTurnCount = builder.turnCount;
    state.compareDemandSequenceText = sequenceText;
  } else {
    state.turnCount = builder.turnCount;
    state.demandSequenceText = sequenceText;
  }

  render();
}

function updateDemandBuilderField(compare, field, rawValue) {
  const target = compare ? state.compareDemandBuilder : state.demandBuilder;
  if (field === "mode") {
    target.mode = rawValue;
  } else {
    target[field] = Math.max(0, Math.round(Number(rawValue) || 0));
  }

  if (compare) {
    state.compareTurnCount = Math.max(1, target.turnCount);
  } else {
    state.turnCount = Math.max(1, target.turnCount);
  }
}

function buildScenarioFromEditors() {
  return buildScenarioFromTextInputs(state.scenarioText, state.demandSequenceText, state.turnCount);
}

function applyDemandShockPreset() {
  state.demandSequenceText = "4, 4, 4, 4, 4, 8, 8, 8, 8, 8, 6, 6, 6, 6, 6, 6";
  state.turnCount = 16;
  state.demandBuilder = {
    ...state.demandBuilder,
    mode: "step",
    turnCount: 16,
    baseDemand: 4,
    shockDemand: 8,
    shockStartTurn: 6,
    recoveryDemand: 6,
    recoveryStartTurn: 11,
  };
  applyDemandSequenceFromInput();
}

function applyDemandWhipsawPreset() {
  state.demandSequenceText = "4, 5, 4, 6, 4, 8, 3, 9, 4, 7, 5, 8, 4, 6, 4, 5";
  state.turnCount = 16;
  applyDemandSequenceFromInput();
}

function applyClassicBullwhipPreset() {
  const turns = 30;
  state.turnCount = turns;
  state.demandBuilder = {
    mode: "step",
    turnCount: turns,
    baseDemand: 4,
    shockDemand: 10,
    shockStartTurn: 8,
    recoveryDemand: 4,
    recoveryStartTurn: 18,
  };
  applyGeneratedDemand(false);

  updateScenarioText((scenario) => {
    for (const node of scenario.nodes) {
      if (node.policyId === "forecast") {
        node.policyParams = {
          ...(node.policyParams ?? {}),
          sentiment:
            node.id === "retailer"
              ? 0.12
              : node.id === "distributor"
              ? 0.18
              : node.id === "wholesaler"
              ? 0.25
              : 0.32,
          serviceLevel:
            node.id === "retailer"
              ? 1.0
              : node.id === "distributor"
              ? 1.05
              : node.id === "wholesaler"
              ? 1.1
              : 1.15,
          smoothing:
            node.id === "retailer"
              ? 0.45
              : node.id === "distributor"
              ? 0.4
              : node.id === "wholesaler"
              ? 0.35
              : 0.3,
          maxGrowthFactor:
            node.id === "retailer"
              ? 1.35
              : node.id === "distributor"
              ? 1.45
              : node.id === "wholesaler"
              ? 1.55
              : 1.7,
        };
      }
    }
  });
}

function resetScenarioAndDemand() {
  stopAutoplay();
  state.scenario = structuredClone(defaultScenario);
  state.scenarioText = JSON.stringify(defaultScenario, null, 2);
  state.turnCount = defaultScenario.turnCount;
  state.demandSequenceText = inferDemandSequenceText(defaultScenario);
  state.demandBuilder = createDefaultDemandBuilder(defaultScenario.turnCount);
  state.selectedTurn = 1;
  runCurrentScenario();
}

function runCurrentScenario() {
  const scenarioErrorEl = document.querySelector("#scenario-error");
  const demandErrorEl = document.querySelector("#demand-error");
  const built = buildScenarioFromEditors();

  if (built.scenarioError || built.demandError) {
    if (scenarioErrorEl) {
      scenarioErrorEl.textContent = built.scenarioError;
    }
    if (demandErrorEl) {
      demandErrorEl.textContent = built.demandError;
    }
    return;
  }

  state.scenario = built.scenario;
  state.scenarioText = JSON.stringify(state.scenario, null, 2);
  state.turnCount = built.scenario.turnCount;
  state.result = runSimulation(state.scenario);
  state.selectedTurn = Math.min(state.selectedTurn, state.result.turns);
  state.demandSequenceText = inferDemandSequenceText(state.scenario);

  if (scenarioErrorEl) {
    scenarioErrorEl.textContent = "";
  }

  if (demandErrorEl) {
    demandErrorEl.textContent = "";
  }

  render();
}

function runComparisonScenario() {
  const scenarioErrorEl = document.querySelector("#compare-scenario-error");
  const demandErrorEl = document.querySelector("#compare-demand-error");
  const built = buildScenarioFromTextInputs(
    state.compareScenarioText,
    state.compareDemandSequenceText,
    state.compareTurnCount
  );

  if (built.scenarioError || built.demandError) {
    if (scenarioErrorEl) {
      scenarioErrorEl.textContent = built.scenarioError;
    }
    if (demandErrorEl) {
      demandErrorEl.textContent = built.demandError;
    }
    return;
  }

  state.compareScenarioText = JSON.stringify(built.scenario, null, 2);
  state.compareTurnCount = built.scenario.turnCount;
  state.compareDemandSequenceText = inferDemandSequenceText(built.scenario);
  state.compareResult = runSimulation(built.scenario);

  if (scenarioErrorEl) {
    scenarioErrorEl.textContent = "";
  }

  if (demandErrorEl) {
    demandErrorEl.textContent = "";
  }

  render();
}

function cloneCurrentToComparison() {
  state.compareScenarioText = state.scenarioText;
  state.compareDemandSequenceText = state.demandSequenceText;
  state.compareTurnCount = state.turnCount;
  state.compareDemandBuilder = structuredClone(state.demandBuilder);
  state.compareResult = null;
  render();
}

function stopAutoplay() {
  if (state.autoplayTimer) {
    window.clearInterval(state.autoplayTimer);
    state.autoplayTimer = null;
  }
}

function startAutoplay() {
  stopAutoplay();
  state.autoplayTimer = window.setInterval(() => {
    if (!state.result) {
      stopAutoplay();
      return;
    }

    if (state.selectedTurn >= state.result.turns) {
      stopAutoplay();
      render();
      return;
    }

    state.selectedTurn += 1;
    render();
  }, state.speedMs);
}

function getBullwhipMetrics() {
  if (!state.result) {
    return [];
  }

  return getBullwhipMetricsForResult(state.result);
}

function getBullwhipMetricsForResult(result) {
  if (!result) {
    return [];
  }

  const demandHistory = result.nodeHistory[result.orderedNodeIds[0]].map((turn) => turn.orderReceived);
  const demandPeak = Math.max(...demandHistory, 1);
  const demandVariance = Math.max(variance(demandHistory), 0.0001);

  return result.orderedNodeIds.map((nodeId) => {
    const history = result.nodeHistory[nodeId];
    const ordersReceived = history.map((turn) => turn.orderReceived);
    const ordersPlaced = history.map(
      (turn) => turn.replenishmentOrderPlaced || turn.productionOrderPlaced || 0
    );
    const inventory = history.map((turn) => turn.inventoryEnd);
    const backlog = history.map((turn) => turn.backlogEnd);
    const pipelines = history.map((turn) => turn.inboundPipelineTotalEnd);
    const inventoryPosition = history.map(
      (turn) => turn.inventoryEnd + turn.inboundPipelineTotalEnd - turn.backlogEnd
    );
    const peakOrder = Math.max(...ordersPlaced, 0);
    const placedVariance = variance(ordersPlaced);
    const amplification = peakOrder / demandPeak;
    const bullwhipScore = placedVariance / demandVariance;

    return {
      nodeId,
      peakOrder,
      amplification,
      demandHistory,
      ordersReceived,
      ordersPlaced,
      inventory,
      backlog,
      pipelines,
      inventoryPosition,
      placedVariance,
      bullwhipScore,
    };
  });
}

function getPolicyLabel(policyId) {
  return (
    {
      fixedOrder: "Fixed order",
      baseStock: "Base-stock replenishment",
      profitAware: "Profit-aware heuristic",
      forecast: "Forecast with sentiment",
    }[policyId] ?? policyId
  );
}

function getPolicySummary(node) {
  const params = node.policyParams ?? {};

  if (node.policyId === "fixedOrder") {
    return `Always order a constant amount of ${params.amount ?? 0} regardless of recent noise.`;
  }

  if (node.policyId === "baseStock") {
    return `Tries to restore inventory position to a target of ${params.targetBaseStock ?? 0} units after considering backlog and in-flight supply.`;
  }

  if (node.policyId === "profitAware") {
    return `Balances shortage pain versus holding cost. A target cover of ${params.targetCover ?? 1} makes this node carry more forward protection when demand spikes.`;
  }

  if (node.policyId === "forecast") {
    return `Forecasts visible demand from recent history, then tilts that forecast with sentiment ${Number(params.sentiment ?? 0).toFixed(2)}. Smoothing ${Number(params.smoothing ?? 0.55).toFixed(2)} tempers sudden changes, and growth cap ${Number(params.maxGrowthFactor ?? 1.35).toFixed(2)}x limits how fast replenishment can jump turn-to-turn.`;
  }

  return "Custom policy.";
}

function getPolicyFormula(node) {
  const params = node.policyParams ?? {};

  if (node.policyId === "fixedOrder") {
    return "order_t = fixed_amount";
  }

  if (node.policyId === "baseStock") {
    return `inventory_position = on_hand + inbound_pipeline - backlog\norder_t = max(0, target_base_stock - inventory_position)\ncurrent target = ${params.targetBaseStock ?? 0}`;
  }

  if (node.policyId === "profitAware") {
    return `service_bias = shortage_penalty / holding_cost\nsafety_stock = target_cover * latest_order * min(service_bias, 3)\ntarget_position = backlog + latest_order + safety_stock\norder_t = max(0, target_position - (on_hand + inbound_pipeline))\ncurrent target_cover = ${params.targetCover ?? 1}`;
  }

  if (node.policyId === "forecast") {
    return `baseline = avg(recent visible orders)\ntrend = latest_visible_order - oldest_visible_order\nforecast = baseline + 0.2*trend + 0.18*sentiment*baseline\nsafety_stock = forecast*(service_level - 0.35) + positive_trend_buffer\nraw_order = target_position - current_position\nsmoothed_order = smoothing*previous_order + (1-smoothing)*raw_order\norder_t = min(smoothed_order, previous_order * max_growth_factor)\ncurrent sentiment=${Number(params.sentiment ?? 0).toFixed(2)}, smoothing=${Number(params.smoothing ?? 0.55).toFixed(2)}, growth cap=${Number(params.maxGrowthFactor ?? 1.35).toFixed(2)}x`;
  }

  return "Custom policy formula.";
}

function getNodeStrategyDescription(node) {
  const delayBits = [
    `shipment delay ${node.outboundLeadTime} turns`,
    node.productionLeadTime !== undefined ? `production delay ${node.productionLeadTime} turns` : null,
  ].filter(Boolean);

  return `${getPolicyLabel(node.policyId)} with ${delayBits.join(", ")}. ${getPolicySummary(node)}`;
}

function getNodeStrategyControls(node, options = {}) {
  const nodeAttr = options.compare ? "data-compare-node-id" : "data-node-id";
  const fieldAttr = options.compare ? "data-compare-field" : "data-field";
  const params = node.policyParams ?? {};

  const policySpecific = [];

  if (node.policyId === "fixedOrder") {
    policySpecific.push(`
        <label class="mini-field">
          <span>Fixed Order Amount</span>
          <input ${nodeAttr}="${node.id}" ${fieldAttr}="policy.amount" type="number" min="0" step="1" value="${params.amount ?? 0}" />
        </label>
    `);
  }

  if (node.policyId === "baseStock") {
    policySpecific.push(`
        <label class="mini-field">
          <span>Base Stock Target</span>
          <input ${nodeAttr}="${node.id}" ${fieldAttr}="policy.targetBaseStock" type="number" min="0" step="1" value="${params.targetBaseStock ?? 0}" />
        </label>
    `);
  }

  if (node.policyId === "profitAware") {
    policySpecific.push(`
        <label class="mini-field">
          <span>Target Cover</span>
          <input ${nodeAttr}="${node.id}" ${fieldAttr}="policy.targetCover" type="number" min="0" step="1" value="${params.targetCover ?? 1}" />
        </label>
    `);
  }

  if (node.policyId === "forecast") {
    policySpecific.push(`
        <label class="mini-field">
          <span>Forecast Window</span>
          <input ${nodeAttr}="${node.id}" ${fieldAttr}="policy.forecastWindow" type="number" min="1" step="1" value="${params.forecastWindow ?? 4}" />
        </label>
        <label class="mini-field">
          <span>Sentiment</span>
          <input ${nodeAttr}="${node.id}" ${fieldAttr}="policy.sentiment" type="number" min="-1" max="1" step="0.05" value="${params.sentiment ?? 0}" />
        </label>
        <label class="mini-field">
          <span>Service Level</span>
          <input ${nodeAttr}="${node.id}" ${fieldAttr}="policy.serviceLevel" type="number" min="0" step="0.05" value="${params.serviceLevel ?? 1.2}" />
        </label>
        <label class="mini-field">
          <span>Smoothing</span>
          <input ${nodeAttr}="${node.id}" ${fieldAttr}="policy.smoothing" type="number" min="0" max="0.95" step="0.05" value="${params.smoothing ?? 0.55}" />
        </label>
        <label class="mini-field">
          <span>Max Growth Per Turn</span>
          <input ${nodeAttr}="${node.id}" ${fieldAttr}="policy.maxGrowthFactor" type="number" min="1" step="0.05" value="${params.maxGrowthFactor ?? 1.35}" />
        </label>
    `);
  }

  return `
    <article class="strategy-card">
      <div class="section-heading">
        <h3>${node.name}</h3>
        <span>${node.role}</span>
      </div>
      <p class="strategy-copy">${getNodeStrategyDescription(node)}</p>
      <pre class="formula-block">${getPolicyFormula(node)}</pre>
      <div class="strategy-grid">
          <label class="mini-field">
            <span>Decision Policy</span>
            <select ${nodeAttr}="${node.id}" ${fieldAttr}="policyId">
            <option value="forecast" ${node.policyId === "forecast" ? "selected" : ""}>Forecast with sentiment</option>
            <option value="baseStock" ${node.policyId === "baseStock" ? "selected" : ""}>Base-stock replenishment</option>
            <option value="profitAware" ${node.policyId === "profitAware" ? "selected" : ""}>Profit-aware heuristic</option>
            <option value="fixedOrder" ${node.policyId === "fixedOrder" ? "selected" : ""}>Fixed order</option>
          </select>
        </label>
        <label class="mini-field">
          <span>Initial Inventory</span>
          <input ${nodeAttr}="${node.id}" ${fieldAttr}="initialInventory" type="number" min="0" step="1" value="${node.initialInventory}" />
        </label>
        <label class="mini-field">
          <span>Shipment Delay</span>
          <input ${nodeAttr}="${node.id}" ${fieldAttr}="outboundLeadTime" type="number" min="0" step="1" value="${node.outboundLeadTime}" />
        </label>
        ${
          node.productionLeadTime !== undefined
            ? `
        <label class="mini-field">
          <span>Production Delay</span>
          <input ${nodeAttr}="${node.id}" ${fieldAttr}="productionLeadTime" type="number" min="0" step="1" value="${node.productionLeadTime}" />
        </label>
        `
            : ""
        }
        <label class="mini-field">
          <span>Holding Cost</span>
          <input ${nodeAttr}="${node.id}" ${fieldAttr}="cost.unitHoldingCost" type="number" min="0" step="1" value="${node.costModel.unitHoldingCost}" />
        </label>
        <label class="mini-field">
          <span>Shortage Penalty</span>
          <input ${nodeAttr}="${node.id}" ${fieldAttr}="cost.unitShortagePenalty" type="number" min="0" step="1" value="${node.costModel.unitShortagePenalty}" />
        </label>
        ${policySpecific.join("")}
      </div>
    </article>
  `;
}

function applyNodeFieldChange(nodeId, field, rawValue) {
  const value = rawValue === "" ? 0 : Number(rawValue);
  if (!Number.isFinite(value) && field !== "policyId") {
    if (field !== "name" && field !== "role") {
      return;
    }
  }

  mutateStructuredScenario((scenario) => {
    const node = scenario.nodes.find((entry) => entry.id === nodeId);
    if (!node) {
      return;
    }

    if (field === "name") {
      node.name = rawValue || node.name;
      return;
    }

    if (field === "role") {
      node.role = rawValue;
      return;
    }

    if (field === "policyId") {
      node.policyId = rawValue;
      if (rawValue === "fixedOrder") {
        node.policyParams = { amount: node.policyParams?.amount ?? 4 };
      } else if (rawValue === "baseStock") {
        node.policyParams = { targetBaseStock: node.policyParams?.targetBaseStock ?? 12 };
      } else if (rawValue === "profitAware") {
        node.policyParams = { targetCover: node.policyParams?.targetCover ?? 2 };
      } else if (rawValue === "forecast") {
        node.policyParams = {
          forecastWindow: node.policyParams?.forecastWindow ?? 4,
          sentiment: node.policyParams?.sentiment ?? 0.2,
          serviceLevel: node.policyParams?.serviceLevel ?? 1.2,
          smoothing: node.policyParams?.smoothing ?? 0.55,
          maxGrowthFactor: node.policyParams?.maxGrowthFactor ?? 1.35,
        };
      }
      return;
    }

    if (field === "initialInventory" || field === "outboundLeadTime" || field === "productionLeadTime") {
      node[field] = Math.max(0, Math.round(value));
      return;
    }

    if (field.startsWith("cost.")) {
      const costField = field.replace("cost.", "");
      node.costModel[costField] = Math.max(0, value);
      return;
    }

    if (field.startsWith("policy.")) {
      const policyField = field.replace("policy.", "");
      node.policyParams = {
        ...(node.policyParams ?? {}),
        [policyField]: Math.max(0, value),
      };
    }
  });
}

function applyComparisonNodeFieldChange(nodeId, field, rawValue) {
  const value = rawValue === "" ? 0 : Number(rawValue);
  if (!Number.isFinite(value) && field !== "policyId") {
    if (field !== "name" && field !== "role") {
      return;
    }
  }

  mutateStructuredComparisonScenario((scenario) => {
    const node = scenario.nodes.find((entry) => entry.id === nodeId);
    if (!node) {
      return;
    }

    if (field === "name") {
      node.name = rawValue || node.name;
      return;
    }

    if (field === "role") {
      node.role = rawValue;
      return;
    }

    if (field === "policyId") {
      node.policyId = rawValue;
      if (rawValue === "fixedOrder") {
        node.policyParams = { amount: node.policyParams?.amount ?? 4 };
      } else if (rawValue === "baseStock") {
        node.policyParams = { targetBaseStock: node.policyParams?.targetBaseStock ?? 12 };
      } else if (rawValue === "profitAware") {
        node.policyParams = { targetCover: node.policyParams?.targetCover ?? 2 };
      } else if (rawValue === "forecast") {
        node.policyParams = {
          forecastWindow: node.policyParams?.forecastWindow ?? 4,
          sentiment: node.policyParams?.sentiment ?? 0.2,
          serviceLevel: node.policyParams?.serviceLevel ?? 1.2,
          smoothing: node.policyParams?.smoothing ?? 0.55,
          maxGrowthFactor: node.policyParams?.maxGrowthFactor ?? 1.35,
        };
      }
      return;
    }

    if (field === "initialInventory" || field === "outboundLeadTime" || field === "productionLeadTime") {
      node[field] = Math.max(0, Math.round(value));
      return;
    }

    if (field.startsWith("cost.")) {
      const costField = field.replace("cost.", "");
      node.costModel[costField] = Math.max(0, value);
      return;
    }

    if (field.startsWith("policy.")) {
      const policyField = field.replace("policy.", "");
      node.policyParams = {
        ...(node.policyParams ?? {}),
        [policyField]: Math.max(0, value),
      };
    }
  });
}

function createHeroMarkup() {
  const bullwhipMetrics = getBullwhipMetrics();
  const mostAmplified = bullwhipMetrics.reduce(
    (best, current) => (current.amplification > best.amplification ? current : best),
    bullwhipMetrics[0] ?? { amplification: 1, nodeId: "retailer", peakOrder: 0 }
  );
  const landingSeries = [
    {
      label: "customer demand",
      values: bullwhipMetrics[0]?.demandHistory ?? [],
      color: "#111111",
    },
    ...bullwhipMetrics.slice(0, 3).map((metric, index) => ({
      label: `${metric.nodeId} order`,
      values: metric.ordersPlaced,
      color: ["#155f63", "#b56729", "#a63d40"][index % 3],
    })),
  ];

  return `
    <section id="top" class="panel hero">
      <div class="hero-copy">
        <p class="eyebrow">Beer Game Playground · v${VERSION}</p>
        <h1>Push demand in. Watch distortion climb upstream.</h1>
        <p class="lede">
          Each chain node reacts only to its local order signal, its inventory, its backlog, and delayed arrivals.
          Now those decisions can also be forecast-driven, with sentiment ranging from conservative to aggressive.
        </p>
        <div class="insight-strip">
          <div class="insight-chip">
            <span>Customer Demand Peak</span>
            <strong>${formatNumber(bullwhipMetrics[0]?.peakOrder ?? 0)}</strong>
          </div>
          <div class="insight-chip">
            <span>Largest Amplification</span>
            <strong>${mostAmplified.amplification?.toFixed(2) ?? "1.00"}x</strong>
          </div>
          <div class="insight-chip">
            <span>Most Amplified Tier</span>
            <strong>${mostAmplified.nodeId ?? "n/a"}</strong>
          </div>
        </div>
      </div>
      <div class="hero-metrics">
        <div class="metric-card">
          <span>Total Profit</span>
          <strong>${formatNumber(state.result?.aggregateMetrics.totalProfit ?? 0)}</strong>
        </div>
        <div class="metric-card">
          <span>Total Shortage Cost</span>
          <strong>${formatNumber(state.result?.aggregateMetrics.totalShortageCost ?? 0)}</strong>
        </div>
        <div class="metric-card">
          <span>Total Holding Cost</span>
          <strong>${formatNumber(state.result?.aggregateMetrics.totalHoldingCost ?? 0)}</strong>
        </div>
      </div>
    </section>
  `;
}

function createDemandLabMarkup() {
  const parsed = parseDemandSequence(state.demandSequenceText);
  const previewText = parsed.error ? "Invalid sequence" : demandPreview(parsed.values);

  return `
    <section id="demand-lab" class="panel demand-lab">
      <div class="section-heading">
        <h2>Demand Playground</h2>
        <span class="supporting">Enter customer demand directly to provoke the bullwhip effect.</span>
      </div>
      <p class="supporting">
        Use a comma-separated sequence like <code>4, 4, 4, 8, 8, 8, 6, 6</code>. When you apply it,
        the scenario switches to a fixed sequence demand model and sets the turn count to match.
        <strong>Run Simulation</strong> also uses whatever sequence is currently in this box.
      </p>
      <div class="demand-builder-grid">
        <label class="mini-field">
          <span>Turns</span>
          <input id="turn-count-input" type="number" min="1" step="1" value="${state.turnCount}" />
        </label>
        <label class="mini-field">
          <span>Pattern</span>
          <select id="demand-mode-select">
            <option value="step" ${state.demandBuilder.mode === "step" ? "selected" : ""}>Step change</option>
            <option value="constant" ${state.demandBuilder.mode === "constant" ? "selected" : ""}>Constant</option>
            <option value="pulse" ${state.demandBuilder.mode === "pulse" ? "selected" : ""}>Single pulse</option>
          </select>
        </label>
        <label class="mini-field">
          <span>Base Demand</span>
          <input id="builder-base-demand" type="number" min="0" step="1" value="${state.demandBuilder.baseDemand}" />
        </label>
        <label class="mini-field">
          <span>Shock Demand</span>
          <input id="builder-shock-demand" type="number" min="0" step="1" value="${state.demandBuilder.shockDemand}" />
        </label>
        <label class="mini-field">
          <span>Shock Starts</span>
          <input id="builder-shock-start" type="number" min="1" step="1" value="${state.demandBuilder.shockStartTurn}" />
        </label>
        <label class="mini-field">
          <span>Recovery Demand</span>
          <input id="builder-recovery-demand" type="number" min="0" step="1" value="${state.demandBuilder.recoveryDemand}" />
        </label>
        <label class="mini-field">
          <span>Recovery Starts</span>
          <input id="builder-recovery-start" type="number" min="1" step="1" value="${state.demandBuilder.recoveryStartTurn}" />
        </label>
      </div>
      <label class="field">
        <span>Customer Demand Sequence</span>
        <textarea id="demand-sequence-input" class="demand-textarea" spellcheck="false">${state.demandSequenceText}</textarea>
      </label>
      <div id="demand-error" class="error-text"></div>
      <div class="button-row">
        <button id="generate-demand-sequence" class="button ghost">Generate Sequence</button>
        <button id="apply-demand-sequence" class="button primary">Apply Sequence</button>
        <button id="preset-classic-bullwhip" class="button ghost">Classic Bullwhip Preset</button>
        <button id="preset-demand-shock" class="button ghost">Demand Shock Preset</button>
        <button id="preset-demand-whipsaw" class="button ghost">Whipsaw Preset</button>
      </div>
      <div class="mini-note">
        <span>Preview</span>
        <strong>${previewText}</strong>
      </div>
    </section>
  `;
}

function createChainBuilderMarkup() {
  const scenario = getCurrentScenarioFromEditor();
  const orderedNodes = scenario.nodes ?? [];
  const roleOptions = ["retailer", "distributor", "wholesaler", "custom", "manufacturer"];
  const selectedMoveNodeId = state.builderMoveNodeId;

  const cards = orderedNodes
    .map((node, index) => {
      const isFirst = index === 0;
      const isLast = index === orderedNodes.length - 1;
      const nodeRoleOptions = roleOptions
        .filter((role) => !isLast || role === "manufacturer")
        .map(
          (role) =>
            `<option value="${role}" ${node.role === role ? "selected" : ""}>${role}</option>`
        )
        .join("");

      return `
        <div class="builder-slot" data-drop-index="${index}">
          <span>${selectedMoveNodeId ? "Place tier here" : "Drop tier here"}</span>
          ${
            selectedMoveNodeId
              ? `<button class="button ghost compact" data-place-index="${index}">Place Here</button>`
              : ""
          }
        </div>
        <article class="builder-node-card" draggable="true" data-builder-node-id="${node.id}">
          <div class="builder-node-top">
            <div>
              <span class="builder-tier-label">${isFirst ? "Customer-facing tier" : isLast ? "Source tier" : `Middle tier ${index}`}</span>
              <strong>${node.name}</strong>
            </div>
            <div class="builder-node-actions">
              <button class="icon-button" data-shift-node-id="${node.id}" data-shift-offset="-1" ${isFirst ? "disabled" : ""} aria-label="Move tier left">←</button>
              <button class="icon-button" data-shift-node-id="${node.id}" data-shift-offset="1" ${isLast ? "disabled" : ""} aria-label="Move tier right">→</button>
              <button class="icon-button danger" data-remove-node-id="${node.id}" ${orderedNodes.length <= 2 ? "disabled" : ""} aria-label="Remove tier">×</button>
            </div>
          </div>
          <div class="builder-node-form">
            <label class="mini-field">
              <span>Name</span>
              <input data-node-id="${node.id}" data-field="name" type="text" value="${node.name}" />
            </label>
            <label class="mini-field">
              <span>Role</span>
              <select data-node-id="${node.id}" data-field="role" ${isLast ? "disabled" : ""}>
                ${nodeRoleOptions}
              </select>
            </label>
          </div>
          <div class="builder-node-badges">
            <span>Ship delay ${node.outboundLeadTime}</span>
            ${isLast ? `<span>Production delay ${node.productionLeadTime ?? 0}</span>` : `<span>Orders from ${orderedNodes[index - 1]?.name ?? "consumer"}</span>`}
          </div>
          <div class="builder-inline-actions">
            <button class="button ghost compact" data-pick-node-id="${node.id}">
              ${selectedMoveNodeId === node.id ? "Cancel Move" : "Pick Up Tier"}
            </button>
            <button class="button ghost compact" data-insert-index="${index + 1}">
              ${isLast ? "Add upstream tier" : "Insert tier after"}
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  return `
    <section id="chain-builder" class="panel">
      <div class="section-heading">
        <h2>Chain Builder</h2>
        <button class="button ghost" data-insert-index="${orderedNodes.length}">Add Source Tier</button>
      </div>
      <p class="supporting">
        Build the chain visually. Drag tiers to reorder them, or use the insert and remove controls to add more layers between the retailer and the source.
        The builder keeps the topology as one linear chain so it still matches the Beer Game rules.
      </p>
      <div class="builder-lane">
        ${cards}
        <div class="builder-slot" data-drop-index="${orderedNodes.length}">
          <span>${selectedMoveNodeId ? "Place at end" : "Drop at end"}</span>
          ${
            selectedMoveNodeId
              ? `<button class="button ghost compact" data-place-index="${orderedNodes.length}">Place Here</button>`
              : ""
          }
        </div>
      </div>
    </section>
  `;
}

function createStrategyLabMarkup() {
  const scenario = getCurrentScenarioFromEditor();
  const cards = scenario.nodes.map((node) => getNodeStrategyControls(node)).join("");

  return `
    <section id="strategy-lab" class="panel strategy-lab">
      <div class="section-heading">
        <h2>Strategy Lab</h2>
        <span class="supporting">Adjust delays, costs, and policies here instead of digging through raw JSON.</span>
      </div>
      <p class="supporting">
        These controls update the scenario model directly. After you tweak a node's policy or lead times,
        click <strong>Run Simulation</strong> to compare how the result changes. Forecast policies use only the demand history each node can observe.
      </p>
      <div class="strategy-grid-layout">${cards}</div>
    </section>
  `;
}

function createLibraryMarkup() {
  const cards = state.savedSimulations.length
    ? state.savedSimulations
        .map(
          (entry) => `
            <article class="saved-run-card">
              <div class="section-heading">
                <h3>${entry.label}</h3>
                <span>${entry.nodeCount} tiers · ${entry.turnCount} turns</span>
              </div>
              <p class="supporting">${new Date(entry.savedAt).toLocaleString()}</p>
              <div class="button-row">
                <button class="button primary compact" data-load-run-id="${entry.id}">Load</button>
                <button class="button ghost compact" data-download-run-id="${entry.id}">Download</button>
                <button class="button ghost compact" data-delete-run-id="${entry.id}">Delete</button>
              </div>
            </article>
          `
        )
        .join("")
    : `<p class="supporting">No saved simulations yet. Save a run here and it will stay available in this browser.</p>`;

  return `
    <section id="share-lab" class="panel">
      <div class="section-heading">
        <h2>Simulation Library</h2>
        <span class="supporting">Save runs locally, reload them later, or download them as JSON.</span>
      </div>
      <div class="button-row">
        <button id="save-sim" class="button primary">Save Simulation</button>
        <button id="download-run" class="button ghost">Download Run JSON</button>
        <button id="download-scenario" class="button ghost">Download Scenario JSON</button>
        <button id="import-json" class="button ghost">Import JSON</button>
        <input id="import-json-input" type="file" accept="application/json,.json" hidden />
      </div>
      ${state.libraryMessage ? `<div class="mini-note success-note"><strong>${state.libraryMessage}</strong></div>` : ""}
      <div class="saved-run-grid">${cards}</div>
    </section>
  `;
}

function createShareMarkup() {
  const scenarioName = state.scenario?.name || "Simulation";
  return `
    <section id="bullwhip-analysis" class="panel">
      <div class="section-heading">
        <h2>Share This Scenario</h2>
        <span class="supporting">Use downloads for durable sharing, or copy JSON directly for quick collaboration.</span>
      </div>
      <div class="about-grid">
        <article class="about-card">
          <h3>Share with JSON</h3>
          <p class="supporting">Download the scenario configuration if you want someone else to run the same model, or download a full run if you want to preserve both inputs and results.</p>
          <div class="button-row">
            <button id="copy-scenario-json" class="button ghost">Copy Scenario JSON</button>
            <button id="copy-app-url" class="button ghost">Copy App URL</button>
          </div>
          ${state.shareMessage ? `<div class="mini-note success-note"><strong>${state.shareMessage}</strong></div>` : ""}
        </article>
        <article class="about-card">
          <h3>Current Share State</h3>
          <div class="mini-stats-grid">
            <div>
              <span>Scenario</span>
              <strong>${scenarioName}</strong>
            </div>
            <div>
              <span>Turns</span>
              <strong>${formatNumber(state.turnCount)}</strong>
            </div>
            <div>
              <span>Tiers</span>
              <strong>${formatNumber(state.scenario?.nodes?.length ?? 0)}</strong>
            </div>
            <div>
              <span>Persistence</span>
              <strong>Local + JSON</strong>
            </div>
          </div>
          <p class="supporting">For a classroom or public workshop, the most reliable flow today is: download scenario JSON, share the file, then let others import it in their own browser.</p>
        </article>
      </div>
    </section>
  `;
}

function createFooterMarkup() {
  return `
    <footer class="site-footer">
      <div>
        <strong>${t("brand")}</strong>
        <p>${t("footerText")}</p>
      </div>
      <div class="footer-links">
        <a href="#top">Top</a>
        <a href="#about-sim">How It Works</a>
        <a href="#share-lab">${t("navShare")}</a>
      </div>
    </footer>
  `;
}

function createLandingHeroMarkupLegacy() {
  const bullwhipMetrics = getBullwhipMetrics();
  const mostAmplified = bullwhipMetrics.reduce(
    (best, current) => (current.amplification > best.amplification ? current : best),
    bullwhipMetrics[0] ?? { amplification: 1, nodeId: "retailer", peakOrder: 0 }
  );

  return `
    <section id="top" class="panel landing-hero">
      <div class="landing-copy">
        <p class="eyebrow">Supply Chain Studio · v${VERSION}</p>
        <h1>Model the Beer Game with clearer strategy, cleaner visuals, and faster insight.</h1>
        <p class="lede">
          Build a chain, inject demand shocks, tune replenishment logic, and watch the bullwhip effect unfold through orders, inventory, backlog, and profit.
        </p>
        <div class="hero-bullets">
          <span>Configurable demand and delays</span>
          <span>Forecast, base-stock, and profit-aware policies</span>
          <span>Playback, comparison, save, and share tools</span>
        </div>
        <div class="button-row landing-actions">
          <button class="button primary" data-page-id="model">Start Modeling</button>
          <button class="button ghost" data-page-id="run">Open Analysis</button>
          <button class="button ghost" data-page-id="share">Share Scenarios</button>
        </div>
      </div>
      <div class="landing-highlight-grid">
        <div class="highlight-card feature-card">
          <span>Customer Peak</span>
          <strong>${formatNumber(bullwhipMetrics[0]?.peakOrder ?? 0)}</strong>
        </div>
        <div class="highlight-card feature-card">
          <span>Largest Amplification</span>
          <strong>${mostAmplified.amplification?.toFixed(2) ?? "1.00"}x</strong>
        </div>
        <div class="highlight-card feature-card">
          <span>Most Amplified Tier</span>
          <strong>${mostAmplified.nodeId ?? "n/a"}</strong>
        </div>
        <div class="highlight-card stat-ribbon">
          <span>Current Run</span>
          <p>Use the tabs above to move between modeling, analysis, and sharing instead of scrolling through one long page.</p>
        </div>
        <div class="highlight-card live-preview-card">
          <div class="section-heading">
            <h3>Latest Run Preview</h3>
            <span>${state.result?.turns ?? 0} turns</span>
          </div>
          ${multiSeriesChartSvg({ series: landingSeries, width: 560, height: 220 })}
          <p class="supporting">This preview uses the most recent run so the landing page shows a real customer-demand versus upstream-order snapshot.</p>
        </div>
      </div>
    </section>
  `;
}

function createScenarioEditorMarkup() {
  return `
    <section class="panel control-panel">
      <div class="section-heading">
        <h2>Scenario Config</h2>
        <button id="reset-scenario" class="button ghost">Reset Default</button>
      </div>
      <p class="supporting">
        Keep the JSON editor for full control, but use the strategy lab above for the most important parameters like delays,
        shortage penalties, and policy settings.
      </p>
      <label class="field">
        <span>Scenario JSON</span>
        <textarea id="scenario-input" spellcheck="false">${state.scenarioText}</textarea>
      </label>
      <div id="scenario-error" class="error-text"></div>
      <div class="button-row">
        <button id="run-sim" class="button primary">Run Simulation</button>
      </div>
    </section>
  `;
}

function createTopNavMarkup() {
  const pages = [
    { id: "home", label: t("navHome") },
    { id: "model", label: t("navModel") },
    { id: "run", label: t("navRun") },
    { id: "share", label: t("navShare") },
  ];

  return `
    <section class="top-nav-shell">
      <div class="top-nav">
        <button class="brand-mark brand-button" data-page-id="home">${t("brand")}</button>
        <nav class="top-nav-links" aria-label="Primary">
          ${pages
            .map(
              (page) => `
            <button class="top-nav-tab ${state.activePage === page.id ? "is-active" : ""}" data-page-id="${page.id}">
              ${page.label}
            </button>
          `
            )
            .join("")}
        </nav>
        <label class="language-switch">
          <span>Lang</span>
          <select id="language-select">
            <option value="en" ${state.language === "en" ? "selected" : ""}>English</option>
            <option value="zh" ${state.language === "zh" ? "selected" : ""}>中文</option>
            <option value="fr" ${state.language === "fr" ? "selected" : ""}>Français</option>
            <option value="ja" ${state.language === "ja" ? "selected" : ""}>日本語</option>
          </select>
        </label>
      </div>
    </section>
  `;
}

function createAboutMarkup() {
  return `
    <section id="about-sim" class="panel about-panel">
      <div class="section-heading">
        <h2>${t("aboutTitle")}</h2>
        <span class="supporting">${t("aboutLead")}</span>
      </div>
      <div class="about-grid">
        <article class="about-card">
          <h3>${t("about1Title")}</h3>
          <p class="supporting">${t("about1Body")}</p>
        </article>
        <article class="about-card">
          <h3>${t("about2Title")}</h3>
          <p class="supporting">${t("about2Body")}</p>
        </article>
        <article class="about-card">
          <h3>${t("about3Title")}</h3>
          <p class="supporting">${t("about3Body")}</p>
        </article>
      </div>
    </section>
  `;
}

function createGettingStartedMarkup() {
  return `
    <section class="panel getting-started-panel">
      <div class="section-heading">
        <h2>${t("howToTitle")}</h2>
        <span class="supporting">${t("howToLead")}</span>
      </div>
      <div class="about-grid">
        <article class="about-card step-card">
          <span class="step-index">1</span>
          <h3>${t("step1Title")}</h3>
          <p class="supporting">${t("step1Body")}</p>
        </article>
        <article class="about-card step-card">
          <span class="step-index">2</span>
          <h3>${t("step2Title")}</h3>
          <p class="supporting">${t("step2Body")}</p>
        </article>
        <article class="about-card step-card">
          <span class="step-index">3</span>
          <h3>${t("step3Title")}</h3>
          <p class="supporting">${t("step3Body")}</p>
        </article>
      </div>
      <div class="button-row landing-actions">
        <button class="button primary" data-page-id="model">${t("ctaModel")}</button>
        <button class="button ghost" data-page-id="run">${t("ctaRun")}</button>
        <button class="button ghost" data-page-id="share">${t("ctaShare")}</button>
      </div>
    </section>
  `;
}

function createLandingHeroMarkup() {
  const bullwhipMetrics = getBullwhipMetrics();
  const mostAmplified = bullwhipMetrics.reduce(
    (best, current) => (current.amplification > best.amplification ? current : best),
    bullwhipMetrics[0] ?? { amplification: 1, nodeId: "retailer", peakOrder: 0 }
  );
  const landingSeries = [
    {
      label: t("customerPeak"),
      values: bullwhipMetrics[0]?.demandHistory ?? [],
      color: "#111111",
    },
    ...bullwhipMetrics.slice(0, 3).map((metric, index) => ({
      label: `${metric.nodeId} order`,
      values: metric.ordersPlaced,
      color: ["#155f63", "#b56729", "#a63d40"][index % 3],
    })),
  ];

  return `
    <section id="top" class="panel landing-hero">
      <div class="landing-copy">
        <p class="eyebrow">${t("landingEyebrow")} · v${VERSION}</p>
        <h1>${t("landingTitle")}</h1>
        <p class="lede">${t("landingLead")}</p>
        <div class="hero-bullets">
          <span>${t("bullet1")}</span>
          <span>${t("bullet2")}</span>
          <span>${t("bullet3")}</span>
        </div>
        <div class="button-row landing-actions">
          <button class="button primary" data-page-id="model">${t("ctaModel")}</button>
          <button class="button ghost" data-page-id="run">${t("ctaRun")}</button>
          <button class="button ghost" data-page-id="share">${t("ctaShare")}</button>
        </div>
      </div>
      <div class="landing-highlight-grid">
        <div class="highlight-card feature-card">
          <span>${t("customerPeak")}</span>
          <strong>${formatNumber(bullwhipMetrics[0]?.peakOrder ?? 0)}</strong>
        </div>
        <div class="highlight-card feature-card">
          <span>${t("largestAmp")}</span>
          <strong>${mostAmplified.amplification?.toFixed(2) ?? "1.00"}x</strong>
        </div>
        <div class="highlight-card feature-card">
          <span>${t("mostAmpTier")}</span>
          <strong>${mostAmplified.nodeId ?? "n/a"}</strong>
        </div>
        <div class="highlight-card stat-ribbon">
          <span>${t("currentRun")}</span>
          <p>${t("currentRunText")}</p>
        </div>
        <div class="highlight-card live-preview-card">
          <div class="section-heading">
            <h3>${t("latestRunPreview")}</h3>
            <span>${state.result?.turns ?? 0} ${t("turns")}</span>
          </div>
          ${multiSeriesChartSvg({ series: landingSeries, width: 560, height: 220 })}
          <p class="supporting">${t("latestPreviewText")}</p>
        </div>
      </div>
    </section>
  `;
}

function createPlaybackMarkup() {
  return `
    <section class="panel playback-panel">
      <div class="section-heading">
        <h2>Playback</h2>
        <span class="turn-badge">Turn ${state.selectedTurn} / ${state.result?.turns ?? 0}</span>
      </div>
      <label class="field compact">
        <span>Selected Turn</span>
        <input id="turn-slider" type="range" min="1" max="${state.result?.turns ?? 1}" value="${state.selectedTurn}" />
      </label>
      <div class="button-row">
        <button id="prev-turn" class="button ghost">Previous</button>
        <button id="next-turn" class="button ghost">Next</button>
        <button id="play-turns" class="button primary">${state.autoplayTimer ? "Pause" : "Autoplay"}</button>
      </div>
      <label class="field compact">
        <span>Autoplay Speed</span>
        <select id="speed-select">
          <option value="1200" ${state.speedMs === 1200 ? "selected" : ""}>Slow</option>
          <option value="900" ${state.speedMs === 900 ? "selected" : ""}>Normal</option>
          <option value="450" ${state.speedMs === 450 ? "selected" : ""}>Fast</option>
        </select>
      </label>
      <div class="explanation-box">
        <h3>How to Read This</h3>
        <p>
          Move turn by turn and compare what changed in the downstream signal, what inventory arrived, and how each tier reacted.
        </p>
      </div>
    </section>
  `;
}

function createModelPageMarkup() {
  return `
    <section class="page-section">
      <div class="section-heading section-banner">
        <div>
          <h2>${t("pageModelTitle")}</h2>
          <span class="supporting">${t("pageModelLead")}</span>
        </div>
      </div>
      ${createDemandLabMarkup()}
      ${createChainBuilderMarkup()}
      ${createStrategyLabMarkup()}
      ${createScenarioEditorMarkup()}
    </section>
  `;
}

function createRunPageMarkup() {
  return `
    <section class="page-section">
      <div class="section-heading section-banner">
        <div>
          <h2>${t("pageRunTitle")}</h2>
          <span class="supporting">${t("pageRunLead")}</span>
        </div>
      </div>
      ${createPlaybackMarkup()}
      ${createComparisonMarkup()}
      ${createChainMarkup()}
      ${createBullwhipMarkup()}
      ${createChartsMarkup()}
      ${createTurnTableMarkup()}
    </section>
  `;
}

function createSharePageMarkup() {
  return `
    <section class="page-section">
      <div class="section-heading section-banner">
        <div>
          <h2>${t("pageShareTitle")}</h2>
          <span class="supporting">${t("pageShareLead")}</span>
        </div>
      </div>
      ${createShareMarkup()}
      ${createLibraryMarkup()}
    </section>
  `;
}

function createPageContentMarkup() {
  if (state.activePage === "model") {
    return createModelPageMarkup();
  }

  if (state.activePage === "run") {
    return createRunPageMarkup();
  }

  if (state.activePage === "share") {
    return createSharePageMarkup();
  }

  return `
    <section class="page-section">
      ${createLandingHeroMarkup()}
      ${createAboutMarkup()}
      ${createGettingStartedMarkup()}
    </section>
  `;
}

function createScenarioMarkup() {
  return `
    <section class="workspace-grid">
      <div class="panel control-panel">
        <div class="section-heading">
          <h2>Scenario Config</h2>
          <button id="reset-scenario" class="button ghost">Reset Default</button>
        </div>
        <p class="supporting">
          Keep the JSON editor for full control, but use the strategy lab above for the most important parameters like delays,
          shortage penalties, and policy settings.
        </p>
        <label class="field">
          <span>Scenario JSON</span>
          <textarea id="scenario-input" spellcheck="false">${state.scenarioText}</textarea>
        </label>
        <div id="scenario-error" class="error-text"></div>
        <div class="button-row">
          <button id="run-sim" class="button primary">Run Simulation</button>
        </div>
      </div>

      <div class="panel playback-panel">
        <div class="section-heading">
          <h2>Playback</h2>
          <span class="turn-badge">Turn ${state.selectedTurn} / ${state.result?.turns ?? 0}</span>
        </div>
        <label class="field compact">
          <span>Selected Turn</span>
          <input id="turn-slider" type="range" min="1" max="${state.result?.turns ?? 1}" value="${state.selectedTurn}" />
        </label>
        <div class="button-row">
          <button id="prev-turn" class="button ghost">Previous</button>
          <button id="next-turn" class="button ghost">Next</button>
          <button id="play-turns" class="button primary">${state.autoplayTimer ? "Pause" : "Autoplay"}</button>
        </div>
        <label class="field compact">
          <span>Autoplay Speed</span>
          <select id="speed-select">
            <option value="1200" ${state.speedMs === 1200 ? "selected" : ""}>Slow</option>
            <option value="900" ${state.speedMs === 900 ? "selected" : ""}>Normal</option>
            <option value="450" ${state.speedMs === 450 ? "selected" : ""}>Fast</option>
          </select>
        </label>
        <div class="explanation-box">
          <h3>How to See the Bullwhip</h3>
          <p>
            Enter a simple step change in customer demand, run the scenario, then compare order peaks in the bullwhip dashboard below.
            Upstream tiers should usually spike harder than the retailer.
          </p>
        </div>
      </div>
    </section>
  `;
}

function createComparisonMarkup() {
  const compareMetrics = state.compareResult
    ? getBullwhipMetricsForResult(state.compareResult)
    : [];
  const compareScenario = getCurrentComparisonScenarioFromEditor();
  const compareCards = compareScenario.nodes
    .map((node) => getNodeStrategyControls(node, { compare: true }))
    .join("");

  const rows = state.compareResult
    ? state.result.orderedNodeIds.map((nodeId) => {
        const leftNode = state.scenario.nodes.find((entry) => entry.id === nodeId);
        const baseMetric = getBullwhipMetrics().find((entry) => entry.nodeId === nodeId);
        const compareMetric = compareMetrics.find((entry) => entry.nodeId === nodeId);

        return `
          <tr>
            <td data-label="Node">${leftNode?.name ?? nodeId}</td>
            <td data-label="Base Peak">${formatNumber(baseMetric?.peakOrder ?? 0)}</td>
            <td data-label="Base Amp">${(baseMetric?.amplification ?? 0).toFixed(2)}x</td>
            <td data-label="Variant Peak">${formatNumber(compareMetric?.peakOrder ?? 0)}</td>
            <td data-label="Variant Amp">${(compareMetric?.amplification ?? 0).toFixed(2)}x</td>
          </tr>
        `;
      }).join("")
    : "";

  return `
    <section class="panel comparison-lab">
      <div class="section-heading">
        <h2>Side-by-Side Comparison</h2>
        <button id="clone-to-comparison" class="button ghost">Clone Current Into Variant</button>
      </div>
      <p class="supporting">
        Use this variant scenario to compare two strategies or parameter sets side by side. The left run is your current main scenario; the right run is the comparison variant below.
      </p>
      <div class="comparison-grid">
        <div class="comparison-card">
          <h3>Current Scenario</h3>
          <div class="comparison-metrics">
            <div><span>Total Profit</span><strong>${formatNumber(state.result?.aggregateMetrics.totalProfit ?? 0)}</strong></div>
            <div><span>Shortage Cost</span><strong>${formatNumber(state.result?.aggregateMetrics.totalShortageCost ?? 0)}</strong></div>
          </div>
        </div>
        <div class="comparison-card">
          <h3>Comparison Variant</h3>
          <div class="comparison-metrics">
            <div><span>Total Profit</span><strong>${formatNumber(state.compareResult?.aggregateMetrics.totalProfit ?? 0)}</strong></div>
            <div><span>Shortage Cost</span><strong>${formatNumber(state.compareResult?.aggregateMetrics.totalShortageCost ?? 0)}</strong></div>
          </div>
        </div>
      </div>
        <div class="workspace-grid">
        <div class="panel control-panel inset-panel">
          <div class="section-heading"><h3>Variant Demand</h3></div>
          <div class="demand-builder-grid">
            <label class="mini-field">
              <span>Turns</span>
              <input id="compare-turn-count-input" type="number" min="1" step="1" value="${state.compareTurnCount}" />
            </label>
            <label class="mini-field">
              <span>Pattern</span>
              <select id="compare-demand-mode-select">
                <option value="step" ${state.compareDemandBuilder.mode === "step" ? "selected" : ""}>Step change</option>
                <option value="constant" ${state.compareDemandBuilder.mode === "constant" ? "selected" : ""}>Constant</option>
                <option value="pulse" ${state.compareDemandBuilder.mode === "pulse" ? "selected" : ""}>Single pulse</option>
              </select>
            </label>
            <label class="mini-field">
              <span>Base Demand</span>
              <input id="compare-builder-base-demand" type="number" min="0" step="1" value="${state.compareDemandBuilder.baseDemand}" />
            </label>
            <label class="mini-field">
              <span>Shock Demand</span>
              <input id="compare-builder-shock-demand" type="number" min="0" step="1" value="${state.compareDemandBuilder.shockDemand}" />
            </label>
            <label class="mini-field">
              <span>Shock Starts</span>
              <input id="compare-builder-shock-start" type="number" min="1" step="1" value="${state.compareDemandBuilder.shockStartTurn}" />
            </label>
            <label class="mini-field">
              <span>Recovery Demand</span>
              <input id="compare-builder-recovery-demand" type="number" min="0" step="1" value="${state.compareDemandBuilder.recoveryDemand}" />
            </label>
            <label class="mini-field">
              <span>Recovery Starts</span>
              <input id="compare-builder-recovery-start" type="number" min="1" step="1" value="${state.compareDemandBuilder.recoveryStartTurn}" />
            </label>
          </div>
          <label class="field">
            <span>Comparison Demand Sequence</span>
            <textarea id="compare-demand-sequence-input" class="demand-textarea" spellcheck="false">${state.compareDemandSequenceText}</textarea>
          </label>
          <div id="compare-demand-error" class="error-text"></div>
          <div class="button-row">
            <button id="generate-compare-demand-sequence" class="button ghost">Generate Variant Sequence</button>
            <button id="run-comparison" class="button primary">Run Comparison</button>
          </div>
        </div>
        <div class="panel control-panel inset-panel">
          <div class="section-heading"><h3>Variant Strategy Editor</h3></div>
          <p class="supporting">
            Adjust the comparison variant directly here. Use the same policies, delays, and cost settings as the baseline editor, but applied only to the right-hand run.
          </p>
          <div class="strategy-grid-layout">${compareCards}</div>
          <div id="compare-scenario-error" class="error-text"></div>
        </div>
      </div>
      ${
        state.compareResult
          ? `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Node</th>
                <th>Base Peak</th>
                <th>Base Amp</th>
                <th>Variant Peak</th>
                <th>Variant Amp</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `
          : `
        <p class="supporting">Run the comparison variant to see side-by-side bullwhip and economic results.</p>
      `
      }
    </section>
  `;
}

function createChainMarkup() {
  if (!state.result) {
    return "";
  }

  const cards = state.result.orderedNodeIds
    .map((nodeId, index) => {
      const turn = getTurnState(nodeId, state.selectedTurn);
      const node = state.scenario.nodes.find((entry) => entry.id === nodeId);
      return `
        <article class="node-card">
          <div class="node-card-header">
            <div>
              <p class="node-role">${node.role}</p>
              <h3>${node.name}</h3>
            </div>
            <span class="node-index">${index + 1}</span>
          </div>
          <div class="node-stats">
            <div><span>Order In</span><strong>${formatNumber(turn.orderReceived)}</strong></div>
            <div><span>Shipment Out</span><strong>${formatNumber(turn.shipmentSent)}</strong></div>
            <div><span>Inventory</span><strong>${formatNumber(turn.inventoryEnd)}</strong></div>
            <div><span>Backlog</span><strong>${formatNumber(turn.backlogEnd)}</strong></div>
            <div><span>Pipeline</span><strong>${formatNumber(turn.inboundPipelineTotalEnd)}</strong></div>
            <div><span>Turn Profit</span><strong>${formatNumber(turn.turnProfit)}</strong></div>
          </div>
          <div class="strategy-note">
            <span>Decision Strategy</span>
            <strong>${getPolicyLabel(node.policyId)}</strong>
            <p>${getNodeStrategyDescription(node)}</p>
            <pre class="formula-inline">${getPolicyFormula(node)}</pre>
          </div>
          <p class="node-rationale">${turn.rationale || "No rationale recorded."}</p>
        </article>
      `;
    })
    .join('<div class="chain-arrow">&rarr;</div>');

  return `
    <section class="panel">
      <div class="section-heading">
        <h2>Chain View</h2>
        <span class="supporting">Each node sees only its downstream order, local inventory, local backlog, and in-flight supply.</span>
      </div>
      <div class="chain-row">${cards}</div>
    </section>
  `;
}

function createBullwhipMarkup() {
  if (!state.result) {
    return "";
  }

  const metrics = getBullwhipMetrics();
  const demandSeries = {
    label: "customer demand",
    values: metrics[0]?.demandHistory ?? [],
    color: "#111111",
  };
  const orderSeries = metrics.map((metric, index) => ({
    label: `${metric.nodeId} order up`,
    values: metric.ordersPlaced,
    color: ["#155f63", "#b56729", "#a63d40", "#2d4ea2", "#6d4aff"][index % 5],
  }));
  const inventorySeries = metrics.map((metric, index) => ({
    label: `${metric.nodeId} inventory`,
    values: metric.inventory,
    color: ["#155f63", "#b56729", "#a63d40", "#2d4ea2", "#6d4aff"][index % 5],
  }));
  const backlogSeries = metrics.map((metric, index) => ({
    label: `${metric.nodeId} backlog`,
    values: metric.backlog,
    color: ["#155f63", "#b56729", "#a63d40", "#2d4ea2", "#6d4aff"][index % 5],
  }));

  const cards = metrics
    .map((metric) => {
      const node = state.scenario.nodes.find((entry) => entry.id === metric.nodeId);
      return `
        <article class="chart-card bullwhip-card">
          <div class="section-heading">
            <h3>${node.name}</h3>
            <span>Bullwhip score ${metric.bullwhipScore.toFixed(2)}</span>
          </div>
          <div class="amplification-row">
            <span>Peak upstream order vs peak customer demand</span>
            <strong>${metric.amplification.toFixed(2)}x</strong>
          </div>
          <div class="mini-stats-grid">
            <div>
              <span>Peak placed order</span>
              <strong>${formatNumber(metric.peakOrder)}</strong>
            </div>
            <div>
              <span>Order variance</span>
              <strong>${metric.placedVariance.toFixed(1)}</strong>
            </div>
            <div>
              <span>Peak pipeline</span>
              <strong>${formatNumber(Math.max(...metric.pipelines, 0))}</strong>
            </div>
            <div>
              <span>Peak inventory position</span>
              <strong>${formatNumber(Math.max(...metric.inventoryPosition, 0))}</strong>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  return `
    <section class="panel">
      <div class="section-heading">
        <h2>Bullwhip Analysis</h2>
        <span class="supporting">Look at order amplification, inventory oscillation, backlog propagation, and variance amplification together.</span>
      </div>
      <div class="combined-bullwhip">
        <div class="section-heading">
          <h3>Customer Demand vs Orders Placed</h3>
          <span>Demand is the cause; upstream orders are the response</span>
        </div>
        ${multiSeriesChartSvg({ series: [demandSeries, ...orderSeries] })}
        <p class="supporting chart-caption">
          This is the clearest bullwhip signal: if upstream order lines rise more sharply than customer demand, the chain is amplifying demand noise.
        </p>
        <div class="comparison-legend">
          ${[demandSeries, ...orderSeries]
            .map(
              (entry) => `
            <div class="legend-chip">
              <span class="legend-dot" style="background:${entry.color}"></span>
              <strong>${entry.label}</strong>
            </div>
            `
            )
            .join("")}
        </div>
      </div>
      <div class="combined-bullwhip">
        <div class="section-heading">
          <h3>Inventory Oscillation By Tier</h3>
          <span>Whip shows up as overshoot and correction in stock</span>
        </div>
        ${multiSeriesChartSvg({ series: inventorySeries })}
      </div>
      <div class="combined-bullwhip">
        <div class="section-heading">
          <h3>Backlog Oscillation By Tier</h3>
          <span>Ripple propagation often appears here before inventory recovers</span>
        </div>
        ${multiSeriesChartSvg({ series: backlogSeries })}
      </div>
      <div class="chart-grid">${cards}</div>
    </section>
  `;
}

function createChartsMarkup() {
  if (!state.result) {
    return "";
  }

  const chartCards = state.result.orderedNodeIds
    .map((nodeId) => {
      const history = state.result.nodeHistory[nodeId];
      const node = state.scenario.nodes.find((entry) => entry.id === nodeId);
      return `
        <article class="chart-card">
          <div class="section-heading">
            <h3>${node.name}</h3>
            <span>${history.length} turns</span>
          </div>
          <div class="mini-chart">
            <p>Inventory</p>
            ${chartSvg({
              values: sumHistoryMetric(history, "inventoryEnd"),
              stroke: "#0f6c5a",
              fill: "rgba(15, 108, 90, 0.16)",
            })}
          </div>
          <div class="mini-chart">
            <p>Backlog</p>
            ${chartSvg({
              values: sumHistoryMetric(history, "backlogEnd"),
              stroke: "#a63d40",
              fill: "rgba(166, 61, 64, 0.16)",
            })}
          </div>
          <div class="mini-chart">
            <p>Cumulative Profit</p>
            ${chartSvg({
              values: sumHistoryMetric(history, "cumulativeProfit"),
              stroke: "#2d4ea2",
              fill: "rgba(45, 78, 162, 0.16)",
            })}
          </div>
        </article>
      `;
    })
    .join("");

  return `
    <section class="panel">
      <div class="section-heading">
        <h2>Operations Dashboard</h2>
        <span class="supporting">Inventory, backlog, and economics for each tier across the run.</span>
      </div>
      <div class="chart-grid">${chartCards}</div>
    </section>
  `;
}

function createTurnTableMarkup() {
  if (!state.result) {
    return "";
  }

  const rows = state.result.orderedNodeIds
    .map((nodeId) => {
      const turn = getTurnState(nodeId, state.selectedTurn);
      const node = state.scenario.nodes.find((entry) => entry.id === nodeId);
        return `
          <tr>
            <td data-label="Node">${node.name}</td>
            <td data-label="Arrivals">${formatNumber(turn.arrivalsReceived)}</td>
            <td data-label="Order In">${formatNumber(turn.orderReceived)}</td>
            <td data-label="Owed">${formatNumber(turn.owedDemand)}</td>
            <td data-label="Ship Out">${formatNumber(turn.shipmentSent)}</td>
            <td data-label="Order Up">${formatNumber(turn.replenishmentOrderPlaced || turn.productionOrderPlaced || 0)}</td>
            <td data-label="Pipeline End">${formatNumber(turn.inboundPipelineTotalEnd)}</td>
            <td data-label="Inv Position">${formatNumber(turn.inventoryEnd + turn.inboundPipelineTotalEnd - turn.backlogEnd)}</td>
            <td data-label="Holding Cost">${formatNumber(turn.holdingCost)}</td>
            <td data-label="Shortage Cost">${formatNumber(turn.shortageCost)}</td>
          </tr>
        `;
    })
    .join("");

  return `
    <section class="panel">
      <div class="section-heading">
        <h2>Turn Detail</h2>
        <span class="turn-badge">Showing Turn ${state.selectedTurn}</span>
      </div>
      <p class="supporting">Audit one turn at a time to see where shortages, inventory, and ordering decisions came from.</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Node</th>
              <th>Arrivals</th>
              <th>Order In</th>
                <th>Owed</th>
                <th>Ship Out</th>
                <th>Order Up</th>
                <th>Pipeline End</th>
                <th>Inv Position</th>
                <th>Holding Cost</th>
                <th>Shortage Cost</th>
              </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-page-id]").forEach((element) => {
    element.addEventListener("click", () => {
      state.activePage = element.dataset.pageId;
      window.scrollTo({ top: 0, behavior: "smooth" });
      render();
    });
  });

  document.querySelector("#language-select")?.addEventListener("change", (event) => {
    state.language = event.target.value;
    render();
  });

  document.querySelector("#scenario-input")?.addEventListener("input", (event) => {
    state.scenarioText = event.target.value;
  });

  document.querySelectorAll("[data-insert-index]").forEach((element) => {
    element.addEventListener("click", () => {
      stopAutoplay();
      insertNodeAt(Number(element.dataset.insertIndex));
    });
  });

  document.querySelectorAll("[data-remove-node-id]").forEach((element) => {
    element.addEventListener("click", () => {
      stopAutoplay();
      removeNode(element.dataset.removeNodeId);
    });
  });

  document.querySelectorAll("[data-shift-node-id]").forEach((element) => {
    element.addEventListener("click", () => {
      stopAutoplay();
      moveNode(element.dataset.shiftNodeId, Number(element.dataset.shiftOffset));
    });
  });

  document.querySelectorAll("[data-builder-node-id]").forEach((element) => {
    element.addEventListener("dragstart", (event) => {
      state.dragNodeId = element.dataset.builderNodeId;
      state.builderMoveNodeId = element.dataset.builderNodeId;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", state.dragNodeId);
    });

    element.addEventListener("dragend", () => {
      state.dragNodeId = "";
    });
  });

  document.querySelectorAll("[data-pick-node-id]").forEach((element) => {
    element.addEventListener("click", () => {
      const nodeId = element.dataset.pickNodeId;
      state.builderMoveNodeId = state.builderMoveNodeId === nodeId ? "" : nodeId;
      render();
    });
  });

  document.querySelectorAll("[data-place-index]").forEach((element) => {
    element.addEventListener("click", () => {
      if (!state.builderMoveNodeId) {
        return;
      }
      stopAutoplay();
      reorderNode(state.builderMoveNodeId, Number(element.dataset.placeIndex));
    });
  });

  document.querySelectorAll("[data-drop-index]").forEach((element) => {
    element.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    });

    element.addEventListener("drop", (event) => {
      event.preventDefault();
      const nodeId = event.dataTransfer.getData("text/plain") || state.dragNodeId;
      if (!nodeId) {
        return;
      }
      stopAutoplay();
      reorderNode(nodeId, Number(element.dataset.dropIndex));
      state.dragNodeId = "";
    });
  });

  document.querySelectorAll("[data-node-id][data-field]").forEach((element) => {
    element.addEventListener("change", (event) => {
      const target = event.target;
      applyNodeFieldChange(target.dataset.nodeId, target.dataset.field, target.value);
    });
  });

  document.querySelectorAll("[data-compare-node-id][data-compare-field]").forEach((element) => {
    element.addEventListener("change", (event) => {
      const target = event.target;
      applyComparisonNodeFieldChange(
        target.dataset.compareNodeId,
        target.dataset.compareField,
        target.value
      );
    });
  });

  document.querySelector("#demand-sequence-input")?.addEventListener("input", (event) => {
    state.demandSequenceText = event.target.value;
  });

  document.querySelector("#turn-count-input")?.addEventListener("input", (event) => {
    updateDemandBuilderField(false, "turnCount", event.target.value);
  });

  document.querySelector("#demand-mode-select")?.addEventListener("change", (event) => {
    updateDemandBuilderField(false, "mode", event.target.value);
  });

  document.querySelector("#builder-base-demand")?.addEventListener("input", (event) => {
    updateDemandBuilderField(false, "baseDemand", event.target.value);
  });

  document.querySelector("#builder-shock-demand")?.addEventListener("input", (event) => {
    updateDemandBuilderField(false, "shockDemand", event.target.value);
  });

  document.querySelector("#builder-shock-start")?.addEventListener("input", (event) => {
    updateDemandBuilderField(false, "shockStartTurn", event.target.value);
  });

  document.querySelector("#builder-recovery-demand")?.addEventListener("input", (event) => {
    updateDemandBuilderField(false, "recoveryDemand", event.target.value);
  });

  document.querySelector("#builder-recovery-start")?.addEventListener("input", (event) => {
    updateDemandBuilderField(false, "recoveryStartTurn", event.target.value);
  });

  document.querySelector("#compare-demand-sequence-input")?.addEventListener("input", (event) => {
    state.compareDemandSequenceText = event.target.value;
  });

  document.querySelector("#compare-turn-count-input")?.addEventListener("input", (event) => {
    updateDemandBuilderField(true, "turnCount", event.target.value);
  });

  document.querySelector("#compare-demand-mode-select")?.addEventListener("change", (event) => {
    updateDemandBuilderField(true, "mode", event.target.value);
  });

  document.querySelector("#compare-builder-base-demand")?.addEventListener("input", (event) => {
    updateDemandBuilderField(true, "baseDemand", event.target.value);
  });

  document.querySelector("#compare-builder-shock-demand")?.addEventListener("input", (event) => {
    updateDemandBuilderField(true, "shockDemand", event.target.value);
  });

  document.querySelector("#compare-builder-shock-start")?.addEventListener("input", (event) => {
    updateDemandBuilderField(true, "shockStartTurn", event.target.value);
  });

  document.querySelector("#compare-builder-recovery-demand")?.addEventListener("input", (event) => {
    updateDemandBuilderField(true, "recoveryDemand", event.target.value);
  });

  document.querySelector("#compare-builder-recovery-start")?.addEventListener("input", (event) => {
    updateDemandBuilderField(true, "recoveryStartTurn", event.target.value);
  });

  document.querySelector("#apply-demand-sequence")?.addEventListener("click", () => {
    stopAutoplay();
    applyDemandSequenceFromInput();
  });

  document.querySelector("#generate-demand-sequence")?.addEventListener("click", () => {
    stopAutoplay();
    applyGeneratedDemand(false);
  });

  document.querySelector("#preset-demand-shock")?.addEventListener("click", () => {
    stopAutoplay();
    applyDemandShockPreset();
  });

  document.querySelector("#preset-classic-bullwhip")?.addEventListener("click", () => {
    stopAutoplay();
    applyClassicBullwhipPreset();
  });

  document.querySelector("#preset-demand-whipsaw")?.addEventListener("click", () => {
    stopAutoplay();
    applyDemandWhipsawPreset();
  });

  document.querySelector("#run-sim")?.addEventListener("click", () => {
    stopAutoplay();
    runCurrentScenario();
  });

  document.querySelector("#run-comparison")?.addEventListener("click", () => {
    stopAutoplay();
    runComparisonScenario();
  });

  document.querySelector("#generate-compare-demand-sequence")?.addEventListener("click", () => {
    stopAutoplay();
    applyGeneratedDemand(true);
  });

  document.querySelector("#clone-to-comparison")?.addEventListener("click", () => {
    cloneCurrentToComparison();
  });

  document.querySelector("#reset-scenario")?.addEventListener("click", () => {
    resetScenarioAndDemand();
  });

  document.querySelector("#save-sim")?.addEventListener("click", () => {
    stopAutoplay();
    saveCurrentSimulation();
  });

  document.querySelector("#download-run")?.addEventListener("click", () => {
    stopAutoplay();
    downloadCurrentSimulation();
  });

  document.querySelector("#download-scenario")?.addEventListener("click", () => {
    stopAutoplay();
    downloadCurrentScenario();
  });

  document.querySelector("#copy-scenario-json")?.addEventListener("click", async () => {
    const built = buildScenarioFromEditors();
    if (built.scenarioError || built.demandError) {
      state.shareMessage = built.scenarioError || built.demandError;
      render();
      return;
    }
    await copyTextToClipboard(JSON.stringify(built.scenario, null, 2), "Copied scenario JSON to the clipboard.");
  });

  document.querySelector("#copy-app-url")?.addEventListener("click", async () => {
    await copyTextToClipboard(window.location.href, "Copied the app URL to the clipboard.");
  });

  document.querySelector("#import-json")?.addEventListener("click", () => {
    document.querySelector("#import-json-input")?.click();
  });

  document.querySelector("#import-json-input")?.addEventListener("change", async (event) => {
    const [file] = event.target.files ?? [];
    await importSimulationFile(file);
    event.target.value = "";
  });

  document.querySelectorAll("[data-load-run-id]").forEach((element) => {
    element.addEventListener("click", () => {
      stopAutoplay();
      loadSavedSimulation(element.dataset.loadRunId);
    });
  });

  document.querySelectorAll("[data-download-run-id]").forEach((element) => {
    element.addEventListener("click", () => {
      downloadSavedSimulation(element.dataset.downloadRunId);
    });
  });

  document.querySelectorAll("[data-delete-run-id]").forEach((element) => {
    element.addEventListener("click", () => {
      deleteSavedSimulation(element.dataset.deleteRunId);
    });
  });

  document.querySelector("#turn-slider")?.addEventListener("input", (event) => {
    state.selectedTurn = Number(event.target.value);
    render();
  });

  document.querySelector("#prev-turn")?.addEventListener("click", () => {
    stopAutoplay();
    state.selectedTurn = Math.max(1, state.selectedTurn - 1);
    render();
  });

  document.querySelector("#next-turn")?.addEventListener("click", () => {
    stopAutoplay();
    state.selectedTurn = Math.min(state.result.turns, state.selectedTurn + 1);
    render();
  });

  document.querySelector("#play-turns")?.addEventListener("click", () => {
    if (state.autoplayTimer) {
      stopAutoplay();
      render();
      return;
    }
    startAutoplay();
    render();
  });

  document.querySelector("#speed-select")?.addEventListener("change", (event) => {
    state.speedMs = Number(event.target.value);
    if (state.autoplayTimer) {
      startAutoplay();
    }
  });
}

function render() {
  if (!state.result) {
    state.result = runSimulation(state.scenario);
  }

  app.innerHTML = `
    <main class="page-shell">
      ${createTopNavMarkup()}
      ${createPageContentMarkup()}
      ${createFooterMarkup()}
    </main>
  `;

  bindEvents();
}

function showFatalError(error) {
  const message = error instanceof Error ? `${error.message}\n\n${error.stack ?? ""}` : String(error);
  app.innerHTML = `
    <main class="page-shell">
      <section class="panel">
        <h1>Preview failed to load</h1>
        <p class="supporting">
          The standalone app hit a startup error. A hard refresh should pick up the latest code.
        </p>
        <div class="fatal-error">${message}</div>
      </section>
    </main>
  `;
}

window.addEventListener("error", (event) => {
  showFatalError(event.error ?? event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  showFatalError(event.reason);
});

try {
  render();
} catch (error) {
  showFatalError(error);
}
