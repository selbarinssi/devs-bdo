export type MatNode = {
  id: string;
  name: string;
  req: number;
  how: string;
  children?: MatNode[];
};

export type ShipKey = "caravel" | "galleass";
export type UpgradeKey =
  | "carrack_advance"
  | "carrack_balance"
  | "carrack_volante"
  | "carrack_valor";

function leaf(id: string, name: string, req: number, how: string): MatNode {
  return { id, name, req, how };
}

const BARTER4 = "Barter Level 4 goods, Oquilla Dailies, or Crow Coin Shop.";
const BARTER3 = "Barter Level 3 goods, Oquilla Dailies, or Crow Coin Shop.";
const BARTER5 = "Barter Level 5 goods, Drying Khan's Tendon, Oquilla Dailies, or Crow Coin Shop.";
const DEEP_TIDE_HOW =
  "Barter Level 5 goods, Sea Monster Hunting, Oquilla Dailies, or Crow Coin Shop.";
const TEAR_HOW = "Oquilla's Eye Weekly/Daily Quests, Barter, or Crow Coin Shop.";
const HIGH_BARTER = "High-tier Barter (Level 5) or Crow Coin Shop.";

function caravelBlueGear(): MatNode {
  return {
    id: "caravel_blue_gear",
    name: "+10 Epheria Caravel Blue Gear Set",
    req: 4,
    how: "Crafted at Port Epheria 1-4, 2F Ship Part Workshop & enhanced to +10 with Tidal Black Stones.",
    children: [
      leaf(
        "green_gear",
        "+10 Caravel Green Gear Set",
        4,
        "Buy from Falasi in Port Epheria & enhance with Tidal Black Stones.",
      ),
      leaf("manganese", "Ruddy Manganese Nodule", 90, BARTER4),
      leaf("plywood", "Enhanced Island Tree Coated Plywood", 300, BARTER4),
      leaf("seaweed", "Seaweed Stalk", 205, BARTER4),
      leaf("dark_iron", "Great Ocean Dark Iron", 150, BARTER4),
      leaf("pearl_crystal", "Pure Pearl Crystal", 45, BARTER3),
      leaf("moon_scale", "Moon Scale Plywood", 400, "Barter / Khan / Oquilla Dailies."),
      leaf(
        "tide_timber",
        "Tide-Dyed Standardized Timber Square",
        180,
        "Sea Monster Hunting or Barter Level 4.",
      ),
      leaf("bright_reef", "Bright Reef Piece", 180, "Barter Level 3 goods or Oquilla Dailies."),
      leaf(
        "artifact_combat",
        "Cox Pirates' Artifact (Combat)",
        120,
        "Defeat Cox Pirates or barter.",
      ),
      leaf(
        "artifact_parley_beginner",
        "Cox Pirates' Artifact (Parley Beginner)",
        60,
        "Barter Level 2 goods, Supplies Delivery dailies, or Crow Coin Shop.",
      ),
      leaf(
        "artifact_parley_expert",
        "Cox Pirates' Artifact (Parley Expert)",
        30,
        "Barter Level 4 goods or Crow Coin Shop.",
      ),
      leaf("cobalt", "Luminous Cobalt Ingot", 30, "Barter Level 4 goods or Crow Coin Shop."),
      leaf(
        "tidal_stones",
        "Tidal Black Stones",
        220,
        "Used to enhance Blue Gear from +1 to +10.",
      ),
    ],
  };
}

function galleassBlueGear(): MatNode {
  return {
    id: "galleass_blue_gear",
    name: "+10 Epheria Galleass Blue Gear Set",
    req: 4,
    how: "Crafted at Port Epheria 1-4, 2F Ship Part Workshop & enhanced to +10 with Tidal Black Stones.",
    children: [
      leaf(
        "green_gear",
        "+10 Galleass Green Gear Set",
        4,
        "Buy from Falasi in Port Epheria & enhance with Tidal Black Stones.",
      ),
      leaf("manganese", "Ruddy Manganese Nodule", 100, BARTER4),
      leaf("plywood", "Enhanced Island Tree Coated Plywood", 300, BARTER4),
      leaf("seaweed", "Seaweed Stalk", 250, BARTER4),
      leaf("dark_iron", "Great Ocean Dark Iron", 150, BARTER4),
      leaf("pearl_crystal", "Pure Pearl Crystal", 45, BARTER3),
      leaf("moon_scale", "Moon Scale Plywood", 600, "Barter / Khan / Oquilla Dailies."),
      leaf(
        "tide_timber",
        "Tide-Dyed Standardized Timber Square",
        180,
        "Sea Monster Hunting or Barter Level 4.",
      ),
      leaf("bright_reef", "Bright Reef Piece", 180, "Barter Level 3 goods or Oquilla Dailies."),
      leaf(
        "artifact_combat",
        "Cox Pirates' Artifact (Combat)",
        250,
        "Defeat Cox Pirates or barter.",
      ),
      leaf(
        "artifact_parley_beginner",
        "Cox Pirates' Artifact (Parley Beginner)",
        60,
        "Barter Level 2 goods, Supplies Delivery dailies, or Crow Coin Shop.",
      ),
      leaf(
        "artifact_parley_expert",
        "Cox Pirates' Artifact (Parley Expert)",
        30,
        "Barter Level 4 goods or Crow Coin Shop.",
      ),
      leaf("cobalt", "Luminous Cobalt Ingot", 30, "Barter Level 4 goods or Crow Coin Shop."),
      leaf(
        "tidal_stones",
        "Tidal Black Stones",
        220,
        "Used to enhance Blue Gear from +1 to +10.",
      ),
    ],
  };
}

function carrackMats(opts: {
  flax: number;
  deepTide: number;
  rockSalt: number;
  pearl: number;
  tear: number;
}): MatNode[] {
  return [
    leaf("flax_fabric", "Moon Vein Flax Fabric", opts.flax, BARTER5),
    leaf("deep_tide", "Deep Tide-Dyed Standardized Timber Square", opts.deepTide, DEEP_TIDE_HOW),
    leaf("rock_salt", "Brilliant Rock Salt Ingot", opts.rockSalt, HIGH_BARTER),
    leaf("brilliant_pearl", "Brilliant Pearl Shard", opts.pearl, HIGH_BARTER),
    leaf("tear_ocean", "Tear of the Ocean", opts.tear, TEAR_HOW),
  ];
}

export const treeData: Record<
  ShipKey,
  Record<string, MatNode>
> = {
  caravel: {
    carrack_advance: {
      id: "carrack_advance",
      name: "Epheria Carrack: Advance",
      req: 1,
      how: "Final ship upgrade performed at Port Epheria Wharf.",
      children: [
        caravelBlueGear(),
        ...carrackMats({ flax: 180, deepTide: 144, rockSalt: 35, pearl: 35, tear: 42 }),
      ],
    },
    carrack_balance: {
      id: "carrack_balance",
      name: "Epheria Carrack: Balance",
      req: 1,
      how: "Final ship upgrade performed at Port Epheria Wharf.",
      children: [
        caravelBlueGear(),
        ...carrackMats({ flax: 180, deepTide: 144, rockSalt: 30, pearl: 30, tear: 50 }),
      ],
    },
  },
  galleass: {
    carrack_volante: {
      id: "carrack_volante",
      name: "Epheria Carrack: Volante",
      req: 1,
      how: "Final ship upgrade performed at Port Epheria Wharf.",
      children: [
        galleassBlueGear(),
        ...carrackMats({ flax: 210, deepTide: 144, rockSalt: 30, pearl: 30, tear: 42 }),
      ],
    },
    carrack_valor: {
      id: "carrack_valor",
      name: "Epheria Carrack: Valor",
      req: 1,
      how: "Final ship upgrade performed at Port Epheria Wharf.",
      children: [
        galleassBlueGear(),
        ...carrackMats({ flax: 180, deepTide: 170, rockSalt: 30, pearl: 30, tear: 42 }),
      ],
    },
  },
};

export const BASE_SHIPS: { value: ShipKey; label: string }[] = [
  { value: "caravel", label: "Epheria Caravel" },
  { value: "galleass", label: "Epheria Galleass" },
];

export const SHIP_STORAGE_KEY = "bdo_ship_tree_multi_v4";

export type ShipSaveState = {
  trees: Record<string, Record<string, number>>;
  lastCurrentShip?: ShipKey | "";
  lastTargetUpgrade?: string;
};

export const DEFAULT_SHIP_STATE: ShipSaveState = {
  trees: {},
  lastCurrentShip: "",
  lastTargetUpgrade: "",
};

export function treeKey(ship: string, upgrade: string) {
  return `${ship}_${upgrade}`;
}

export function upgradesFor(ship: ShipKey): MatNode[] {
  return Object.values(treeData[ship]);
}

export function findNode(root: MatNode, id: string): MatNode | null {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

export function findParent(root: MatNode, id: string): MatNode | null {
  for (const child of root.children ?? []) {
    if (child.id === id) return root;
    const found = findParent(child, id);
    if (found) return found;
  }
  return null;
}

export function descendantsOf(node: MatNode): MatNode[] {
  const out: MatNode[] = [];
  for (const child of node.children ?? []) {
    out.push(child, ...descendantsOf(child));
  }
  return out;
}

export function flattenTree(node: MatNode): MatNode[] {
  return [node, ...descendantsOf(node)];
}
