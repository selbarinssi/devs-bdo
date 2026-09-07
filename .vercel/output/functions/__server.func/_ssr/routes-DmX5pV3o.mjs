import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as ChevronDown, r as Search } from "../_libs/lucide-react.mjs";
import { i as useLocalStorage, n as cn, r as formatNumber, t as AppShell } from "./app-shell-C2sGcISJ.mjs";
import { t as ItemGlyph } from "./item-glyph-D8jZE5N9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DmX5pV3o.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("h-11 w-full rounded-md border border-stone bg-ivory px-3.5 py-2 font-serif text-sm text-ink outline-none transition-[border-color,box-shadow] duration-150", "placeholder:text-muted", "focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/20", "disabled:opacity-50", className),
		...props
	});
}
function Label({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: cn("text-xs font-bold uppercase tracking-wider text-teal", className),
		...props
	});
}
var EXP_TO_GURU = 125e5;
var ALCHEMY_CATEGORIES = [
	{
		id: "oils",
		label: "Oils",
		hint: "1,400 EXP"
	},
	{
		id: "bloods",
		label: "Bloods",
		hint: "800 EXP"
	},
	{
		id: "elixirs",
		label: "Elixirs",
		hint: "for Draughts"
	},
	{
		id: "draughts",
		label: "Draughts",
		hint: "Intermediate"
	},
	{
		id: "harmony",
		label: "Harmony",
		hint: "Final"
	}
];
var recipeData = {
	oils: [
		{
			id: "oil_fortitude",
			name: "Oil of Fortitude",
			baseExp: 1400,
			ingredients: [
				{
					name: "Clown's Blood",
					qty: 1
				},
				{
					name: "Monk's Branch",
					qty: 1
				},
				{
					name: "Fruit of Nature",
					qty: 1
				},
				{
					name: "Powder of Flame",
					qty: 1
				}
			],
			spot: null
		},
		{
			id: "oil_corruption",
			name: "Oil of Corruption",
			baseExp: 1400,
			ingredients: [
				{
					name: "Sinner's Blood",
					qty: 1
				},
				{
					name: "Spirit's Leaf",
					qty: 1
				},
				{
					name: "Fruit of Nature",
					qty: 1
				},
				{
					name: "Powder of Darkness",
					qty: 1
				}
			],
			spot: null
		},
		{
			id: "oil_tranquility",
			name: "Oil of Tranquility",
			baseExp: 1400,
			ingredients: [
				{
					name: "Wise Man's Blood",
					qty: 1
				},
				{
					name: "Bloody Tree Knot",
					qty: 1
				},
				{
					name: "Fruit of Nature",
					qty: 1
				},
				{
					name: "Powder of Earth",
					qty: 1
				}
			],
			spot: null
		},
		{
			id: "oil_regeneration",
			name: "Oil of Regeneration",
			baseExp: 1400,
			ingredients: [
				{
					name: "Legendary Beast's Blood",
					qty: 1
				},
				{
					name: "Red Tree Lump",
					qty: 1
				},
				{
					name: "Fruit of Nature",
					qty: 1
				},
				{
					name: "Powder of Rifts",
					qty: 1
				}
			],
			spot: null
		},
		{
			id: "oil_storms",
			name: "Oil of Storms",
			baseExp: 1400,
			ingredients: [
				{
					name: "Tyrant's Blood",
					qty: 1
				},
				{
					name: "Old Tree Bark",
					qty: 1
				},
				{
					name: "Fruit of Nature",
					qty: 1
				},
				{
					name: "Powder of Time",
					qty: 1
				}
			],
			spot: "Not used directly in Harmony Draughts, but required for Elixir of Destruction, Elixir of Detection and Golden Hand Elixir."
		}
	],
	bloods: [
		{
			id: "clown_blood",
			name: "Clown's Blood",
			baseExp: 800,
			ingredients: [
				{
					name: "Clear Liquid Reagent",
					qty: 1
				},
				{
					name: "Wolf / Flamingo / Rhino / Cheetah Blood",
					qty: 2
				},
				{
					name: "Spirit's Leaf",
					qty: 1
				},
				{
					name: "Powder of Darkness",
					qty: 1
				}
			],
			spot: "Olvia / Imp Cave (Wolf Hills) — highest density wolf gathering spot."
		},
		{
			id: "sinners_blood",
			name: "Sinner's Blood",
			baseExp: 800,
			ingredients: [
				{
					name: "Clear Liquid Reagent",
					qty: 1
				},
				{
					name: "Deer / Sheep / Pig / Waragon Blood",
					qty: 2
				},
				{
					name: "Bloody Tree Knot",
					qty: 1
				},
				{
					name: "Powder of Flame",
					qty: 1
				}
			],
			spot: "Lynch Ranch (Sheep) or Behr Deer Herds (south of Behr)."
		},
		{
			id: "wise_mans_blood",
			name: "Wise Man's Blood",
			baseExp: 800,
			ingredients: [
				{
					name: "Clear Liquid Reagent",
					qty: 1
				},
				{
					name: "Fox / Weasel / Racoon Blood",
					qty: 2
				},
				{
					name: "Monk's Branch",
					qty: 1
				},
				{
					name: "Trace of Nature",
					qty: 1
				}
			],
			spot: "Eastern Border (Glish) or Fox node near Bartali Farm."
		},
		{
			id: "tyrants_blood",
			name: "Tyrant's Blood",
			baseExp: 800,
			ingredients: [
				{
					name: "Pure Powder Reagent",
					qty: 1
				},
				{
					name: "Troll / Bear / Ogre Blood",
					qty: 2
				},
				{
					name: "Monk's Branch",
					qty: 1
				},
				{
					name: "Trace of Nature",
					qty: 1
				}
			],
			spot: "Balenos Mountains (east of Olvia) or Mansha Forest (Bears)."
		},
		{
			id: "legendary_beasts_blood",
			name: "Legendary Beast's Blood",
			baseExp: 800,
			ingredients: [
				{
					name: "Pure Powder Reagent",
					qty: 1
				},
				{
					name: "Worm / Lizard / Bat / Kuku / Cobra Blood",
					qty: 2
				},
				{
					name: "Spirit's Leaf",
					qty: 1
				},
				{
					name: "Trace of Nature",
					qty: 1
				}
			],
			spot: "Needed for Oil of Regeneration and several elixirs — not in the original Harmony chain."
		}
	],
	elixirs: [
		{
			id: "elixir_fury",
			name: "Elixir of Fury",
			baseExp: 460,
			ingredients: [
				{
					name: "Ash Sap",
					qty: 1
				},
				{
					name: "Dwarf Mushroom",
					qty: 4
				},
				{
					name: "Troll / Bear / Ogre Blood",
					qty: 4
				},
				{
					name: "Purified Water",
					qty: 3
				}
			],
			spot: "Used in Fury Draught"
		},
		{
			id: "elixir_frenzy",
			name: "Elixir of Frenzy",
			baseExp: 1610,
			ingredients: [
				{
					name: "Oil of Regeneration",
					qty: 1
				},
				{
					name: "Clear Liquid Reagent",
					qty: 5
				},
				{
					name: "Cedar Sap",
					qty: 5
				},
				{
					name: "Trace of Nature",
					qty: 3
				},
				{
					name: "Ghost Mushroom",
					qty: 2
				}
			],
			spot: "Used in Fury Draught"
		},
		{
			id: "elixir_concentration",
			name: "Elixir of Concentration",
			baseExp: 460,
			ingredients: [
				{
					name: "Clear Liquid Reagent",
					qty: 1
				},
				{
					name: "Cloud Mushroom",
					qty: 3
				},
				{
					name: "Wild Grass",
					qty: 2
				},
				{
					name: "Troll / Bear / Ogre Blood",
					qty: 3
				}
			],
			spot: "Used in Fury Draught"
		},
		{
			id: "elixir_destruction",
			name: "Elixir of Destruction",
			baseExp: 1610,
			ingredients: [
				{
					name: "Oil of Storms",
					qty: 1
				},
				{
					name: "Trace of Nature",
					qty: 3
				},
				{
					name: "Clear Liquid Reagent",
					qty: 5
				},
				{
					name: "Powder of Flame",
					qty: 5
				},
				{
					name: "Snowfield Cedar Sap",
					qty: 7
				}
			],
			spot: "Used in Fury Draught (EXP is an estimate — not listed on public EXP tables)"
		},
		{
			id: "defense_elixir",
			name: "Defense Elixir",
			baseExp: 460,
			ingredients: [
				{
					name: "Clear Liquid Reagent",
					qty: 1
				},
				{
					name: "Ash Sap",
					qty: 6
				},
				{
					name: "Deer / Sheep / Pig / Waragon Blood",
					qty: 5
				},
				{
					name: "Purified Water",
					qty: 3
				}
			],
			spot: "Used in Adaptation Draught"
		},
		{
			id: "helix_elixir",
			name: "Helix Elixir",
			baseExp: 200,
			ingredients: [
				{
					name: "Thuja Sap",
					qty: 6
				},
				{
					name: "Monk's Branch",
					qty: 3
				},
				{
					name: "Clown's Blood",
					qty: 2
				},
				{
					name: "Powder of Flame",
					qty: 2
				},
				{
					name: "Purified Water",
					qty: 3
				}
			],
			spot: "Used in Adaptation Draught"
		},
		{
			id: "elixir_life",
			name: "Elixir of Life",
			baseExp: 460,
			ingredients: [
				{
					name: "Pure Powder Reagent",
					qty: 1
				},
				{
					name: "Silver Azalea",
					qty: 3
				},
				{
					name: "Fox / Weasel / Racoon Blood",
					qty: 5
				},
				{
					name: "HP Potion (Small)",
					qty: 3
				}
			],
			spot: "Used in Adaptation Draught"
		},
		{
			id: "elixir_endurance",
			name: "Elixir of Endurance",
			baseExp: 460,
			ingredients: [
				{
					name: "Pure Powder Reagent",
					qty: 1
				},
				{
					name: "Dwarf Mushroom",
					qty: 2
				},
				{
					name: "Birch Sap",
					qty: 5
				},
				{
					name: "Troll / Bear / Ogre Blood",
					qty: 4
				}
			],
			spot: "Used in Adaptation Draught"
		},
		{
			id: "elixir_wind",
			name: "Elixir of Wind",
			baseExp: 920,
			ingredients: [
				{
					name: "Wise Man's Blood",
					qty: 1
				},
				{
					name: "Fortune Teller Mushroom",
					qty: 5
				},
				{
					name: "Pine Sap",
					qty: 5
				},
				{
					name: "Powder of Darkness",
					qty: 2
				}
			],
			spot: "Used in Potential Draught"
		},
		{
			id: "elixir_spells",
			name: "Elixir of Spells",
			baseExp: 920,
			ingredients: [
				{
					name: "Tyrant's Blood",
					qty: 1
				},
				{
					name: "Fire Flake Flower",
					qty: 5
				},
				{
					name: "Maple Sap",
					qty: 3
				},
				{
					name: "Powder of Darkness",
					qty: 2
				}
			],
			spot: "Used in Potential Draught"
		},
		{
			id: "elixir_shock",
			name: "Elixir of Shock",
			baseExp: 920,
			ingredients: [
				{
					name: "Clown's Blood",
					qty: 1
				},
				{
					name: "Tiger Mushroom",
					qty: 5
				},
				{
					name: "Cedar Sap",
					qty: 7
				},
				{
					name: "Powder of Time",
					qty: 3
				}
			],
			spot: "Used in Potential Draught"
		},
		{
			id: "elixir_swiftness",
			name: "Elixir of Swiftness",
			baseExp: 920,
			ingredients: [
				{
					name: "Legendary Beast's Blood",
					qty: 1
				},
				{
					name: "Arrow Mushroom",
					qty: 5
				},
				{
					name: "Birch Sap",
					qty: 5
				},
				{
					name: "Powder of Darkness",
					qty: 2
				}
			],
			spot: "Used in Potential Draught"
		},
		{
			id: "elixir_perforation",
			name: "Elixir of Perforation",
			baseExp: 1610,
			ingredients: [
				{
					name: "Oil of Corruption",
					qty: 1
				},
				{
					name: "Clear Liquid Reagent",
					qty: 4
				},
				{
					name: "Bluffer Mushroom",
					qty: 5
				},
				{
					name: "Pine Sap",
					qty: 5
				},
				{
					name: "Trace of Nature",
					qty: 2
				}
			],
			spot: "Used in Corruption Draught"
		},
		{
			id: "elixir_death",
			name: "Elixir of Death",
			baseExp: 920,
			ingredients: [
				{
					name: "Oil of Tranquility",
					qty: 1
				},
				{
					name: "Clear Liquid Reagent",
					qty: 6
				},
				{
					name: "Ancient Mushroom",
					qty: 2
				},
				{
					name: "Ash Sap",
					qty: 7
				},
				{
					name: "Trace of Nature",
					qty: 2
				}
			],
			spot: "Used in Corruption Draught"
		},
		{
			id: "elixir_draining",
			name: "Elixir of Draining",
			baseExp: 1610,
			ingredients: [
				{
					name: "Oil of Fortitude",
					qty: 1
				},
				{
					name: "Clear Liquid Reagent",
					qty: 4
				},
				{
					name: "Hump Mushroom",
					qty: 3
				},
				{
					name: "Birch Sap",
					qty: 4
				},
				{
					name: "Trace of Nature",
					qty: 2
				}
			],
			spot: "Used in Corruption Draught"
		},
		{
			id: "grim_reaper_elixir",
			name: "Grim Reaper's Elixir",
			baseExp: 1610,
			ingredients: [
				{
					name: "Oil of Fortitude",
					qty: 1
				},
				{
					name: "Pure Powder Reagent",
					qty: 4
				},
				{
					name: "Sky Mushroom",
					qty: 2
				},
				{
					name: "Monk's Branch",
					qty: 2
				},
				{
					name: "Trace of Nature",
					qty: 4
				}
			],
			spot: "Used in Corruption Draught"
		},
		{
			id: "elixir_assassination",
			name: "Elixir of Assassination",
			baseExp: 1610,
			ingredients: [
				{
					name: "Oil of Regeneration",
					qty: 1
				},
				{
					name: "Pure Powder Reagent",
					qty: 5
				},
				{
					name: "Amanita Mushroom",
					qty: 4
				},
				{
					name: "Red Tree Lump",
					qty: 2
				},
				{
					name: "Trace of Nature",
					qty: 2
				}
			],
			spot: "Used in Berserk Draught"
		},
		{
			id: "elixir_detection",
			name: "Elixir of Detection",
			baseExp: 1610,
			ingredients: [
				{
					name: "Oil of Storms",
					qty: 1
				},
				{
					name: "Pure Powder Reagent",
					qty: 6
				},
				{
					name: "Truffle Mushroom",
					qty: 3
				},
				{
					name: "Old Tree Bark",
					qty: 2
				},
				{
					name: "Trace of Nature",
					qty: 3
				}
			],
			spot: "Used in Berserk Draught"
		},
		{
			id: "elixir_carnage",
			name: "Elixir of Carnage",
			baseExp: 1610,
			ingredients: [
				{
					name: "Oil of Corruption",
					qty: 1
				},
				{
					name: "Pure Powder Reagent",
					qty: 7
				},
				{
					name: "Tiger Mushroom",
					qty: 2
				},
				{
					name: "Spirit's Leaf",
					qty: 2
				},
				{
					name: "Trace of Nature",
					qty: 3
				}
			],
			spot: "Used in Berserk Draught"
		},
		{
			id: "elixir_sky",
			name: "Elixir of Sky",
			baseExp: 1610,
			ingredients: [
				{
					name: "Oil of Tranquility",
					qty: 1
				},
				{
					name: "Pure Powder Reagent",
					qty: 6
				},
				{
					name: "Emperor Mushroom",
					qty: 5
				},
				{
					name: "Bloody Tree Knot",
					qty: 2
				},
				{
					name: "Trace of Nature",
					qty: 4
				}
			],
			spot: "Used in Berserk Draught"
		},
		{
			id: "elixir_demihuman",
			name: "Elixir of Demihuman Hunt",
			baseExp: 920,
			ingredients: [
				{
					name: "Sinner's Blood",
					qty: 1
				},
				{
					name: "Arrow Mushroom",
					qty: 4
				},
				{
					name: "Fir Sap",
					qty: 4
				},
				{
					name: "Black Stone Powder",
					qty: 3
				}
			],
			spot: "Used in [Party] Harmony Draught - Demihuman"
		},
		{
			id: "elixir_will",
			name: "Elixir of Will",
			baseExp: 460,
			ingredients: [
				{
					name: "Pure Powder Reagent",
					qty: 1
				},
				{
					name: "Sunrise Herb",
					qty: 4
				},
				{
					name: "Wolf / Flamingo / Rhino / Cheetah Blood",
					qty: 6
				},
				{
					name: "Purified Water",
					qty: 3
				}
			],
			spot: "Used in Party Harmony variants"
		},
		{
			id: "elixir_edania",
			name: "Elixir of Edania",
			baseExp: 920,
			ingredients: [
				{
					name: "Sinner's Blood",
					qty: 2
				},
				{
					name: "Trace of Nature",
					qty: 4
				},
				{
					name: "Old Tree Bark",
					qty: 6
				},
				{
					name: "Clear Liquid Reagent",
					qty: 6
				},
				{
					name: "Caphras Tree Sap",
					qty: 6
				}
			],
			spot: "Used in [Party] Harmony Draught - Edania (EXP is an estimate — not listed on public EXP tables)"
		}
	],
	draughts: [
		{
			id: "fury_draught",
			name: "Fury Draught",
			baseExp: 0,
			ingredients: [
				{
					name: "Elixir of Fury",
					qty: 30
				},
				{
					name: "Elixir of Frenzy",
					qty: 30
				},
				{
					name: "Elixir of Concentration",
					qty: 30
				},
				{
					name: "Elixir of Destruction",
					qty: 30
				},
				{
					name: "Spellbound Catalyst",
					qty: 10
				}
			],
			spot: "Simple Alchemy (L) — produces 10 Fury Draughts. Higher-grade elixirs work at 1:3 ratio."
		},
		{
			id: "adaptation_draught",
			name: "Adaptation Draught",
			baseExp: 0,
			ingredients: [
				{
					name: "Defense Elixir",
					qty: 30
				},
				{
					name: "Helix Elixir",
					qty: 30
				},
				{
					name: "Elixir of Life",
					qty: 30
				},
				{
					name: "Elixir of Endurance",
					qty: 30
				},
				{
					name: "Spellbound Catalyst",
					qty: 10
				}
			],
			spot: "Simple Alchemy (L) — produces 10 Adaptation Draughts. Higher-grade elixirs work at 1:3 ratio."
		},
		{
			id: "potential_draught",
			name: "Potential Draught",
			baseExp: 0,
			ingredients: [
				{
					name: "Elixir of Wind",
					qty: 30
				},
				{
					name: "Elixir of Spells",
					qty: 30
				},
				{
					name: "Elixir of Shock",
					qty: 30
				},
				{
					name: "Elixir of Swiftness",
					qty: 30
				},
				{
					name: "Spellbound Catalyst",
					qty: 10
				}
			],
			spot: "Simple Alchemy (L) — produces 10 Potential Draughts. Higher-grade elixirs work at 1:3 ratio."
		},
		{
			id: "corruption_draught",
			name: "Corruption Draught",
			baseExp: 0,
			ingredients: [
				{
					name: "Elixir of Perforation",
					qty: 30
				},
				{
					name: "Elixir of Death",
					qty: 30
				},
				{
					name: "Elixir of Draining",
					qty: 30
				},
				{
					name: "Grim Reaper's Elixir",
					qty: 30
				},
				{
					name: "Spellbound Catalyst",
					qty: 10
				}
			],
			spot: "Simple Alchemy (L) — produces 10 Corruption Draughts. Higher-grade elixirs work at 1:3 ratio."
		},
		{
			id: "berserk_draught",
			name: "Berserk Draught",
			baseExp: 0,
			ingredients: [
				{
					name: "Elixir of Assassination",
					qty: 30
				},
				{
					name: "Elixir of Detection",
					qty: 30
				},
				{
					name: "Elixir of Carnage",
					qty: 30
				},
				{
					name: "Elixir of Sky",
					qty: 30
				},
				{
					name: "Spellbound Catalyst",
					qty: 10
				}
			],
			spot: "Simple Alchemy (L) — produces 10 Berserk Draughts. Higher-grade elixirs work at 1:3 ratio."
		}
	],
	harmony: [
		{
			id: "harmony_draught",
			name: "Harmony Draught",
			baseExp: 0,
			ingredients: [
				{
					name: "Fury Draught",
					qty: 10
				},
				{
					name: "Adaptation Draught",
					qty: 10
				},
				{
					name: "Potential Draught",
					qty: 10
				},
				{
					name: "Corruption Draught",
					qty: 10
				},
				{
					name: "Berserk Draught",
					qty: 10
				}
			],
			spot: "Simple Alchemy (L) — produces 10 Harmony Draughts"
		},
		{
			id: "harmony_edania",
			name: "[Party] Harmony Draught - Edania",
			baseExp: 0,
			ingredients: [
				{
					name: "Harmony Draught",
					qty: 1
				},
				{
					name: "Elixir of Edania",
					qty: 3
				},
				{
					name: "Elixir of Will",
					qty: 3
				},
				{
					name: "Spellbound Catalyst",
					qty: 1
				}
			],
			spot: "Simple Alchemy (L) — single craft. Use Ibellab's Essence version for x10 batch."
		},
		{
			id: "harmony_demihuman",
			name: "[Party] Harmony Draught - Demihuman",
			baseExp: 0,
			ingredients: [
				{
					name: "Harmony Draught",
					qty: 1
				},
				{
					name: "Elixir of Demihuman Hunt",
					qty: 3
				},
				{
					name: "Elixir of Will",
					qty: 3
				},
				{
					name: "Spellbound Catalyst",
					qty: 1
				}
			],
			spot: "Simple Alchemy (L) — single craft. Use Ibellab's Essence version for x10 batch."
		}
	]
};
var ALCHEMY_CHANGELOG = [
	"All 4 Oils had at least one wrong ingredient (e.g. Oil of Fortitude was missing Monk's Branch/Powder of Flame); added the 5th oil, Oil of Storms, which several elixirs require.",
	"Clown's Blood had two wrong ingredients; added Legendary Beast's Blood, which was missing entirely but is needed for Oil of Regeneration and two elixirs.",
	"Most of the 21 elixir recipes had incorrect or placeholder ingredients — all rewritten against current live recipe data.",
	"EXP values were off for every tier (Oils were 1,200 → actually 1,400; Bloods were 700 → actually 800; most elixir EXP values were also corrected).",
	"The Draught and Harmony Draught recipes (Fury/Adaptation/Potential/Corruption/Berserk → Harmony, plus the Party variants) were already correct and are unchanged.",
	"Several old \"Trace of X\" materials (Trace of Ascension, Trace of Savagery, Trace of Origin, Trace of Despair, Trace of Death, Trace of the Earth) were consolidated into \"Trace of Nature\" in a past game update — updated throughout.",
	"A couple of Fury-group EXP values (Elixir of Destruction, Elixir of Edania) aren't on public EXP tables — flagged as estimates in their card notes."
];
var STORAGE_KEY = "bdo_alchemy_planner_v1";
var DEFAULT_STATE = {
	buffs: 150,
	craftTime: 1,
	proc: 2.8,
	crafts: {}
};
function formatTime(totalSeconds) {
	if (totalSeconds >= 3600) return `${(totalSeconds / 3600).toFixed(1)}h`;
	return `${Math.floor(totalSeconds / 60)}m ${Math.floor(totalSeconds % 60)}s`;
}
function RecipeCard({ recipe, crafts, buffs, craftTime, proc, onCrafts }) {
	const totalExp = recipe.baseExp * (1 + buffs / 100) * crafts;
	const totalYield = Math.floor(crafts * proc);
	const totalSeconds = crafts * craftTime;
	const guruPercent = recipe.baseExp > 0 ? (totalExp / EXP_TO_GURU * 100).toFixed(1) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "grid gap-5 rounded-xl border border-stone bg-paper p-4 shadow-[var(--shadow-border)] transition-[border-color,box-shadow] duration-150 hover:border-teal hover:shadow-[var(--shadow-border-hover)] sm:p-5 lg:grid-cols-[minmax(0,280px)_1fr_minmax(0,280px)] lg:items-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border-2 border-teal bg-ivory shadow-[0_0_10px_rgba(32,89,92,0.18)]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemGlyph, {
						name: recipe.name,
						size: 44
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-[1.05rem] font-bold leading-snug text-ink",
							children: recipe.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-1 inline-block rounded-md border border-teal bg-teal/10 px-2 py-0.5 text-[0.72rem] font-bold text-teal",
							children: recipe.baseExp > 0 ? `${formatNumber(recipe.baseExp)} Base EXP` : "Simple Alchemy"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: `crafts-${recipe.id}`,
								className: "text-xs font-semibold text-muted",
								children: "Batch crafts"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: `crafts-${recipe.id}`,
								type: "number",
								min: 1,
								value: crafts,
								onChange: (e) => onCrafts(Math.max(1, parseInt(e.target.value, 10) || 1)),
								className: "h-9 w-[5.5rem] bg-ivory text-right font-bold tabular-nums"
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-1 gap-2 sm:grid-cols-2",
					children: recipe.ingredients.map((ing) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 rounded-lg border border-stone bg-ivory px-2.5 py-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemGlyph, {
							name: ing.name,
							size: 28
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-[0.82rem] text-ink",
								title: ing.name,
								children: ing.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[0.82rem] font-bold tabular-nums text-teal",
								children: formatNumber(ing.qty * crafts)
							})]
						})]
					}, ing.name))
				}), recipe.spot ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "rounded-r-md border-l-[3px] border-teal bg-teal/10 px-3 py-2 text-[0.8rem] text-ink",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
						className: "mr-1.5 text-teal",
						children: "Note:"
					}), recipe.spot]
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "flex flex-col gap-1.5 rounded-[10px] border border-stone bg-ivory p-3 sm:p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between gap-3 text-[0.85rem]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted",
							children: "Modified EXP"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "font-bold tabular-nums text-ink",
							children: recipe.baseExp > 0 ? formatNumber(Math.round(totalExp)) : "N/A"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between gap-3 text-[0.85rem]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted",
							children: "Estimated yields"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "font-bold tabular-nums text-teal",
							children: formatNumber(totalYield)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between gap-3 text-[0.85rem]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted",
							children: "Crafting time"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "font-bold tabular-nums text-teal",
							children: formatTime(totalSeconds)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between gap-3 text-[0.85rem]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted",
							children: "% M18 → Guru 1"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "font-bold tabular-nums text-ink",
							children: guruPercent ? `${guruPercent}%` : "—"
						})]
					})
				]
			})
		]
	});
}
function AlchemyPlanner() {
	const { value, setValue } = useLocalStorage(STORAGE_KEY, DEFAULT_STATE);
	const [tab, setTab] = (0, import_react.useState)("oils");
	const [query, setQuery] = (0, import_react.useState)("");
	const [notesOpen, setNotesOpen] = (0, import_react.useState)(false);
	const recipes = recipeData[tab];
	const filtered = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		if (!q) return recipes;
		return recipes.filter((r) => r.name.toLowerCase().includes(q));
	}, [recipes, query]);
	const patch = (partial) => setValue((prev) => ({
		...prev,
		...partial
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
				className: "rounded-[10px] border border-stone bg-paper px-4 py-3.5 text-sm text-muted shadow-[var(--shadow-border)]",
				open: notesOpen,
				onToggle: (e) => setNotesOpen(e.target.open),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", {
					className: "flex cursor-pointer list-none items-center gap-2 font-bold text-teal [&::-webkit-details-marker]:hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: cn("size-4 shrink-0 transition-transform duration-150", notesOpen ? "rotate-0" : "-rotate-90") }), "What was corrected in this recipe set"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 ml-1 flex list-disc flex-col gap-1.5 pl-5",
					children: ALCHEMY_CHANGELOG.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: line }, line))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 rounded-xl border border-stone bg-paper p-4 shadow-[var(--shadow-border)] sm:grid-cols-3 sm:px-6 sm:py-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "alchemy-buffs",
							children: "Total Life EXP Buffs (%)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "alchemy-buffs",
							type: "number",
							min: 0,
							max: 500,
							value: value.buffs,
							onChange: (e) => patch({ buffs: Math.max(0, parseFloat(e.target.value) || 0) })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "craft-time",
							children: "Crafting Speed (Seconds)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "craft-time",
							type: "number",
							min: .5,
							max: 10,
							step: .1,
							value: value.craftTime,
							onChange: (e) => patch({ craftTime: Math.max(.5, parseFloat(e.target.value) || 1) })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "mastery-proc",
							children: "Average Proc Multiplier"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							id: "mastery-proc",
							value: String(value.proc),
							onChange: (e) => patch({ proc: parseFloat(e.target.value) }),
							className: "field-select",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "2.5",
									children: "2.5× (Master standard)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "2.8",
									children: "2.8× (High Master)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "3.0",
									children: "3.0× (Guru standard)"
								})
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2 sm:gap-3",
				role: "tablist",
				"aria-label": "Recipe tiers",
				children: ALCHEMY_CATEGORIES.map((cat) => {
					const active = tab === cat.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						role: "tab",
						"aria-selected": active,
						onClick: () => {
							setTab(cat.id);
							setQuery("");
						},
						className: cn("flex min-h-12 min-w-[7.5rem] flex-1 items-center justify-center gap-2 rounded-[10px] border px-3 py-3 font-bold transition-[background-color,color,border-color,box-shadow] duration-150", active ? "border-teal bg-teal text-ivory shadow-[0_4px_14px_rgba(32,89,92,0.30)]" : "border-stone bg-paper text-muted hover:border-teal hover:text-ink"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: cat.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", {
							className: cn("hidden font-medium italic sm:inline", active ? "text-ivory/75" : "text-muted"),
							children: [
								"(",
								cat.hint,
								")"
							]
						})]
					}, cat.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "search",
					value: query,
					onChange: (e) => setQuery(e.target.value),
					placeholder: "Filter recipes on this tab by name…",
					className: "bg-paper pl-10",
					"aria-label": "Filter recipes"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-4",
				role: "tabpanel",
				children: filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "rounded-xl border border-stone bg-paper px-4 py-10 text-center text-sm text-muted",
					children: [
						"No recipes match “",
						query,
						"”."
					]
				}) : filtered.map((recipe) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecipeCard, {
					recipe,
					crafts: value.crafts[recipe.id] ?? 1e3,
					buffs: value.buffs,
					craftTime: value.craftTime,
					proc: value.proc,
					onCrafts: (n) => setValue((prev) => ({
						...prev,
						crafts: {
							...prev.crafts,
							[recipe.id]: n
						}
					}))
				}, recipe.id))
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		eyebrow: "Harmony Draught pipeline",
		title: "Alchemy planner",
		subtitle: "Batch-craft oils, bloods, elixirs and draughts. Set your EXP buffs, proc rate and batch size to see materials, yield and time to Guru.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlchemyPlanner, {})
	});
}
//#endregion
export { Home as component };
