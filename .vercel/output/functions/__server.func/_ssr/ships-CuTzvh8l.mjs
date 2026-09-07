import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Minus, i as Plus, l as ChevronDown, n as Ship, o as Info } from "../_libs/lucide-react.mjs";
import { i as useLocalStorage, n as cn, r as formatNumber, t as AppShell } from "./app-shell-C2sGcISJ.mjs";
import { t as ItemGlyph } from "./item-glyph-D8jZE5N9.mjs";
import { t as Progress } from "./progress-DEcPW9jT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ships-CuTzvh8l.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function leaf(id, name, req, how) {
	return {
		id,
		name,
		req,
		how
	};
}
var BARTER4 = "Barter Level 4 goods, Oquilla Dailies, or Crow Coin Shop.";
var BARTER3 = "Barter Level 3 goods, Oquilla Dailies, or Crow Coin Shop.";
var BARTER5 = "Barter Level 5 goods, Drying Khan's Tendon, Oquilla Dailies, or Crow Coin Shop.";
var DEEP_TIDE_HOW = "Barter Level 5 goods, Sea Monster Hunting, Oquilla Dailies, or Crow Coin Shop.";
var TEAR_HOW = "Oquilla's Eye Weekly/Daily Quests, Barter, or Crow Coin Shop.";
var HIGH_BARTER = "High-tier Barter (Level 5) or Crow Coin Shop.";
function caravelBlueGear() {
	return {
		id: "caravel_blue_gear",
		name: "+10 Epheria Caravel Blue Gear Set",
		req: 4,
		how: "Crafted at Port Epheria 1-4, 2F Ship Part Workshop & enhanced to +10 with Tidal Black Stones.",
		children: [
			leaf("green_gear", "+10 Caravel Green Gear Set", 4, "Buy from Falasi in Port Epheria & enhance with Tidal Black Stones."),
			leaf("manganese", "Ruddy Manganese Nodule", 90, BARTER4),
			leaf("plywood", "Enhanced Island Tree Coated Plywood", 300, BARTER4),
			leaf("seaweed", "Seaweed Stalk", 205, BARTER4),
			leaf("dark_iron", "Great Ocean Dark Iron", 150, BARTER4),
			leaf("pearl_crystal", "Pure Pearl Crystal", 45, BARTER3),
			leaf("moon_scale", "Moon Scale Plywood", 400, "Barter / Khan / Oquilla Dailies."),
			leaf("tide_timber", "Tide-Dyed Standardized Timber Square", 180, "Sea Monster Hunting or Barter Level 4."),
			leaf("bright_reef", "Bright Reef Piece", 180, "Barter Level 3 goods or Oquilla Dailies."),
			leaf("artifact_combat", "Cox Pirates' Artifact (Combat)", 120, "Defeat Cox Pirates or barter."),
			leaf("artifact_parley_beginner", "Cox Pirates' Artifact (Parley Beginner)", 60, "Barter Level 2 goods, Supplies Delivery dailies, or Crow Coin Shop."),
			leaf("artifact_parley_expert", "Cox Pirates' Artifact (Parley Expert)", 30, "Barter Level 4 goods or Crow Coin Shop."),
			leaf("cobalt", "Luminous Cobalt Ingot", 30, "Barter Level 4 goods or Crow Coin Shop."),
			leaf("tidal_stones", "Tidal Black Stones", 220, "Used to enhance Blue Gear from +1 to +10.")
		]
	};
}
function galleassBlueGear() {
	return {
		id: "galleass_blue_gear",
		name: "+10 Epheria Galleass Blue Gear Set",
		req: 4,
		how: "Crafted at Port Epheria 1-4, 2F Ship Part Workshop & enhanced to +10 with Tidal Black Stones.",
		children: [
			leaf("green_gear", "+10 Galleass Green Gear Set", 4, "Buy from Falasi in Port Epheria & enhance with Tidal Black Stones."),
			leaf("manganese", "Ruddy Manganese Nodule", 100, BARTER4),
			leaf("plywood", "Enhanced Island Tree Coated Plywood", 300, BARTER4),
			leaf("seaweed", "Seaweed Stalk", 250, BARTER4),
			leaf("dark_iron", "Great Ocean Dark Iron", 150, BARTER4),
			leaf("pearl_crystal", "Pure Pearl Crystal", 45, BARTER3),
			leaf("moon_scale", "Moon Scale Plywood", 600, "Barter / Khan / Oquilla Dailies."),
			leaf("tide_timber", "Tide-Dyed Standardized Timber Square", 180, "Sea Monster Hunting or Barter Level 4."),
			leaf("bright_reef", "Bright Reef Piece", 180, "Barter Level 3 goods or Oquilla Dailies."),
			leaf("artifact_combat", "Cox Pirates' Artifact (Combat)", 250, "Defeat Cox Pirates or barter."),
			leaf("artifact_parley_beginner", "Cox Pirates' Artifact (Parley Beginner)", 60, "Barter Level 2 goods, Supplies Delivery dailies, or Crow Coin Shop."),
			leaf("artifact_parley_expert", "Cox Pirates' Artifact (Parley Expert)", 30, "Barter Level 4 goods or Crow Coin Shop."),
			leaf("cobalt", "Luminous Cobalt Ingot", 30, "Barter Level 4 goods or Crow Coin Shop."),
			leaf("tidal_stones", "Tidal Black Stones", 220, "Used to enhance Blue Gear from +1 to +10.")
		]
	};
}
function carrackMats(opts) {
	return [
		leaf("flax_fabric", "Moon Vein Flax Fabric", opts.flax, BARTER5),
		leaf("deep_tide", "Deep Tide-Dyed Standardized Timber Square", opts.deepTide, DEEP_TIDE_HOW),
		leaf("rock_salt", "Brilliant Rock Salt Ingot", opts.rockSalt, HIGH_BARTER),
		leaf("brilliant_pearl", "Brilliant Pearl Shard", opts.pearl, HIGH_BARTER),
		leaf("tear_ocean", "Tear of the Ocean", opts.tear, TEAR_HOW)
	];
}
var treeData = {
	caravel: {
		carrack_advance: {
			id: "carrack_advance",
			name: "Epheria Carrack: Advance",
			req: 1,
			how: "Final ship upgrade performed at Port Epheria Wharf.",
			children: [caravelBlueGear(), ...carrackMats({
				flax: 180,
				deepTide: 144,
				rockSalt: 35,
				pearl: 35,
				tear: 42
			})]
		},
		carrack_balance: {
			id: "carrack_balance",
			name: "Epheria Carrack: Balance",
			req: 1,
			how: "Final ship upgrade performed at Port Epheria Wharf.",
			children: [caravelBlueGear(), ...carrackMats({
				flax: 180,
				deepTide: 144,
				rockSalt: 30,
				pearl: 30,
				tear: 50
			})]
		}
	},
	galleass: {
		carrack_volante: {
			id: "carrack_volante",
			name: "Epheria Carrack: Volante",
			req: 1,
			how: "Final ship upgrade performed at Port Epheria Wharf.",
			children: [galleassBlueGear(), ...carrackMats({
				flax: 210,
				deepTide: 144,
				rockSalt: 30,
				pearl: 30,
				tear: 42
			})]
		},
		carrack_valor: {
			id: "carrack_valor",
			name: "Epheria Carrack: Valor",
			req: 1,
			how: "Final ship upgrade performed at Port Epheria Wharf.",
			children: [galleassBlueGear(), ...carrackMats({
				flax: 180,
				deepTide: 170,
				rockSalt: 30,
				pearl: 30,
				tear: 42
			})]
		}
	}
};
var BASE_SHIPS = [{
	value: "caravel",
	label: "Epheria Caravel"
}, {
	value: "galleass",
	label: "Epheria Galleass"
}];
var SHIP_STORAGE_KEY = "bdo_ship_tree_multi_v4";
var DEFAULT_SHIP_STATE = {
	trees: {},
	lastCurrentShip: "",
	lastTargetUpgrade: ""
};
function treeKey(ship, upgrade) {
	return `${ship}_${upgrade}`;
}
function upgradesFor(ship) {
	return Object.values(treeData[ship]);
}
function findNode(root, id) {
	if (root.id === id) return root;
	for (const child of root.children ?? []) {
		const found = findNode(child, id);
		if (found) return found;
	}
	return null;
}
function findParent(root, id) {
	for (const child of root.children ?? []) {
		if (child.id === id) return root;
		const found = findParent(child, id);
		if (found) return found;
	}
	return null;
}
function descendantsOf(node) {
	const out = [];
	for (const child of node.children ?? []) out.push(child, ...descendantsOf(child));
	return out;
}
function flattenTree(node) {
	return [node, ...descendantsOf(node)];
}
function clamp(node, n) {
	return Math.max(0, Math.min(node.req, Number.isFinite(n) ? n : 0));
}
function applyOwned(root, counts, nodeId, next) {
	const node = findNode(root, nodeId);
	if (!node) return counts;
	const owned = clamp(node, next);
	const nextCounts = {
		...counts,
		[node.id]: owned
	};
	const isRoot = root.id === node.id;
	const kids = descendantsOf(node);
	if (kids.length && !isRoot) {
		if (owned >= node.req) for (const d of kids) nextCounts[d.id] = d.req;
		else if (owned === 0) for (const d of kids) nextCounts[d.id] = 0;
	}
	let cursor = node;
	while (cursor) {
		const parent = findParent(root, cursor.id);
		if (!parent) break;
		const allDone = descendantsOf(parent).every((d) => (nextCounts[d.id] ?? 0) >= d.req);
		nextCounts[parent.id] = allDone ? parent.req : 0;
		cursor = parent;
	}
	return nextCounts;
}
function ToggleSwitch({ checked, onChange, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		role: "switch",
		"aria-checked": checked,
		"aria-label": label,
		onClick: () => onChange(!checked),
		className: cn("relative h-7 w-12 shrink-0 rounded-full border transition-[background-color,border-color] duration-150", checked ? "border-teal bg-teal/25" : "border-stone bg-ivory"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("absolute top-0.5 left-0.5 size-5 rounded-full transition-transform duration-150", checked ? "translate-x-5 bg-teal" : "bg-muted") })
	});
}
function Stepper({ node, owned, onOwned }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-1.5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": `Decrease ${node.name}`,
				onClick: () => onOwned(owned - 1),
				className: "flex size-9 items-center justify-center rounded-md border border-stone bg-ivory text-ink transition-[border-color,color] duration-150 hover:border-teal hover:text-teal",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {
					className: "size-3.5",
					strokeWidth: 2.25
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "number",
				min: 0,
				max: node.req,
				value: owned,
				"aria-label": `${node.name} owned`,
				onChange: (e) => onOwned(parseInt(e.target.value, 10) || 0),
				className: "h-9 w-16 rounded-md border border-stone bg-ivory text-center font-serif text-sm font-semibold tabular-nums text-ink outline-none focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/20"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "whitespace-nowrap text-xs text-muted",
				children: ["/ ", formatNumber(node.req)]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": `Increase ${node.name}`,
				onClick: () => onOwned(owned + 1),
				className: "flex size-9 items-center justify-center rounded-md border border-stone bg-ivory text-ink transition-[border-color,color] duration-150 hover:border-teal hover:text-teal",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
					className: "size-3.5",
					strokeWidth: 2.25
				})
			})
		]
	});
}
function StatusBadge({ owned, req }) {
	const done = owned >= req;
	const inProgress = owned > 0 && !done;
	const needed = req - owned;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("min-w-[4.25rem] rounded-full border px-2.5 py-1 text-center text-[0.7rem] font-bold", done && "border-teal bg-teal/15 text-teal", inProgress && "border-teal/40 bg-teal/10 text-teal", !done && !inProgress && "border-stone bg-ivory text-muted"),
		children: done ? "Done" : req === 1 ? "Pending" : `Need ${formatNumber(needed)}`
	});
}
function NodeRow({ node, counts, onOwned }) {
	const hasChildren = Boolean(node.children?.length);
	const [open, setOpen] = (0, import_react.useState)(true);
	const [showHow, setShowHow] = (0, import_react.useState)(false);
	const owned = counts[node.id] ?? 0;
	const done = owned >= node.req;
	const inProgress = owned > 0 && !done;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn(hasChildren ? "my-2 rounded-[10px] border bg-ivory p-3" : "border-b border-stone py-2.5 last:border-b-0", hasChildren && done && "border-teal", hasChildren && inProgress && "border-teal/40", hasChildren && !done && !inProgress && "border-stone", !hasChildren && done && "bg-teal/5", !hasChildren && inProgress && "bg-teal/[0.04]"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 items-center gap-2.5",
					children: [
						hasChildren ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-expanded": open,
							"aria-label": `${open ? "Collapse" : "Expand"} ${node.name}`,
							onClick: () => setOpen((v) => !v),
							className: "flex size-7 shrink-0 items-center justify-center text-teal",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: cn("size-4 transition-transform duration-150", !open && "-rotate-90") })
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "w-4 shrink-0 text-center text-muted",
							"aria-hidden": true,
							children: "·"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemGlyph, {
							name: node.name,
							size: 30
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("text-sm text-ink", hasChildren ? "font-semibold" : "font-medium"),
							children: node.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": `How to obtain ${node.name}`,
							"aria-expanded": showHow,
							onClick: () => setShowHow((v) => !v),
							className: "flex size-7 shrink-0 items-center justify-center rounded-full border border-stone text-muted transition-[border-color,color] duration-150 hover:border-teal hover:text-teal",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
								className: "size-3.5",
								strokeWidth: 2
							})
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [node.req === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleSwitch, {
						checked: done,
						onChange: (v) => onOwned(node.id, v ? node.req : 0),
						label: `Mark ${node.name} complete`
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stepper, {
						node,
						owned,
						onOwned: (n) => onOwned(node.id, n)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, {
						owned,
						req: node.req
					})]
				})]
			}),
			showHow ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 rounded-md bg-paper px-2.5 py-2 text-[0.82rem] text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
					className: "font-semibold text-teal",
					children: "How to get it: "
				}), node.how]
			}) : null,
			hasChildren && open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 ml-2 border-l-2 border-stone pl-4",
				children: node.children.map((child) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NodeRow, {
					node: child,
					counts,
					onOwned
				}, child.id))
			}) : null
		]
	});
}
function ShipTracker() {
	const { value, setValue } = useLocalStorage(SHIP_STORAGE_KEY, DEFAULT_SHIP_STATE);
	const [confirmReset, setConfirmReset] = (0, import_react.useState)(false);
	const current = value.lastCurrentShip || "";
	const target = value.lastTargetUpgrade || "";
	const activeTree = current && target ? treeData[current]?.[target] : void 0;
	const key = current && target ? treeKey(current, target) : "";
	const counts = key && value.trees[key] || {};
	const targets = current ? upgradesFor(current) : [];
	const progress = (0, import_react.useMemo)(() => {
		if (!activeTree) return {
			pct: 0,
			owned: 0,
			req: 0
		};
		const nodes = flattenTree(activeTree);
		let req = 0;
		let owned = 0;
		for (const n of nodes) {
			req += n.req;
			owned += Math.min(n.req, counts[n.id] ?? 0);
		}
		return {
			pct: req > 0 ? Math.round(owned / req * 100) : 0,
			owned,
			req
		};
	}, [activeTree, counts]);
	const setCurrent = (ship) => {
		setValue((prev) => ({
			...prev,
			lastCurrentShip: ship,
			lastTargetUpgrade: ""
		}));
		setConfirmReset(false);
	};
	const setTarget = (upgrade) => {
		setValue((prev) => ({
			...prev,
			lastTargetUpgrade: upgrade
		}));
		setConfirmReset(false);
	};
	const setOwned = (id, n) => {
		if (!activeTree || !key) return;
		setValue((prev) => {
			const nextCounts = applyOwned(activeTree, prev.trees[key] || {}, id, n);
			return {
				...prev,
				trees: {
					...prev.trees,
					[key]: nextCounts
				}
			};
		});
	};
	const reset = () => {
		if (!key) return;
		setValue((prev) => ({
			...prev,
			trees: {
				...prev.trees,
				[key]: {}
			}
		}));
		setConfirmReset(false);
	};
	const components = activeTree?.children?.filter((c) => c.children?.length) ?? [];
	const materials = activeTree?.children?.filter((c) => !c.children?.length) ?? [];
	const finalOwned = activeTree ? counts[activeTree.id] ?? 0 : 0;
	const finalDone = activeTree ? finalOwned >= activeTree.req : false;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-4xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-5 grid gap-4 rounded-xl border border-stone bg-paper p-4 shadow-[var(--shadow-border)] sm:grid-cols-2 sm:p-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					htmlFor: "current-ship",
					className: "text-xs font-bold uppercase tracking-wider text-teal",
					children: "Current base ship"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					id: "current-ship",
					className: "field-select",
					value: current,
					onChange: (e) => setCurrent(e.target.value || ""),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						disabled: true,
						children: "Select base ship…"
					}), BASE_SHIPS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: s.value,
						children: s.label
					}, s.value))]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					htmlFor: "target-ship",
					className: "text-xs font-bold uppercase tracking-wider text-teal",
					children: "Target upgrade"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					id: "target-ship",
					className: "field-select",
					value: target,
					disabled: !current,
					onChange: (e) => setTarget(e.target.value),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						disabled: true,
						children: "Select target upgrade…"
					}), targets.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: t.id,
						children: t.name
					}, t.id))]
				})]
			})]
		}), !activeTree ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-xl border border-stone bg-paper px-6 py-16 text-center shadow-[var(--shadow-border)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ship, {
				className: "mx-auto mb-3 size-10 text-teal",
				strokeWidth: 1.5,
				"aria-hidden": true
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Select a base ship and target upgrade above to begin tracking."
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-5 rounded-xl border border-stone bg-paper p-4 shadow-[var(--shadow-border)] sm:p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2.5 flex items-baseline justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-medium text-muted",
						children: "Overall upgrade completion"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-semibold tabular-nums text-teal",
						children: [
							progress.pct,
							"% (",
							formatNumber(progress.owned),
							" / ",
							formatNumber(progress.req),
							")"
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, { value: progress.pct })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
					className: "text-lg font-semibold text-ink",
					children: ["Crafting tree for ", activeTree.name]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setConfirmReset(true),
					className: "inline-flex min-h-11 items-center rounded-md border border-danger/40 px-3.5 text-sm font-semibold text-danger transition-[background-color,color] duration-150 hover:bg-danger hover:text-ivory",
					children: "Reset this ship"
				})]
			}),
			confirmReset ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-5 rounded-xl border border-danger/30 bg-paper p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-ink",
					children: [
						"Reset owned stock only for ",
						activeTree.name,
						"?"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: reset,
						className: "inline-flex h-11 items-center rounded-md bg-danger px-4 text-sm font-semibold text-ivory",
						children: "Reset"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setConfirmReset(false),
						className: "inline-flex h-11 items-center rounded-md border border-stone bg-paper px-4 text-sm font-semibold text-ink",
						children: "Cancel"
					})]
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("mb-4 rounded-xl border bg-paper p-4 shadow-[var(--shadow-border)] sm:p-5", finalDone ? "border-teal" : "border-stone"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemGlyph, {
								name: activeTree.name,
								size: 40
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[0.72rem] font-semibold uppercase tracking-wider text-teal",
								children: "Final step"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold text-ink",
								children: activeTree.name
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, {
							owned: finalOwned,
							req: activeTree.req
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted",
						children: activeTree.how
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex min-h-11 w-fit items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleSwitch, {
							checked: finalDone,
							onChange: (v) => setOwned(activeTree.id, v ? activeTree.req : 0),
							label: "I've turned this in"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-medium text-ink",
							children: "I've turned this in"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-stone bg-paper px-4 py-2 shadow-[var(--shadow-border)] sm:px-5",
				children: [components.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "pt-4 pb-1 text-sm font-semibold text-teal",
					children: "Components to craft"
				}), components.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NodeRow, {
					node: c,
					counts,
					onOwned: setOwned
				}, c.id))] }) : null, materials.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "border-t border-stone pt-4 pb-1 text-sm font-semibold text-teal first:border-t-0",
					children: "Materials to gather"
				}), materials.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NodeRow, {
					node: c,
					counts,
					onOwned: setOwned
				}, c.id))] }) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-center text-[0.78rem] text-muted",
				children: "Progress saves automatically in this browser."
			})
		] })]
	});
}
function ShipsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		eyebrow: "Epheria Carrack",
		title: "Ship upgrade tracker",
		subtitle: "Pick your Caravel or Galleass and the Carrack you want. Track components, materials and the final turn-in.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShipTracker, {})
	});
}
//#endregion
export { ShipsPage as component };
