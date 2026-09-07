import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as Compass, d as BookOpen, l as ChevronDown, u as Check } from "../_libs/lucide-react.mjs";
import { i as useLocalStorage, n as cn, t as AppShell } from "./app-shell-C2sGcISJ.mjs";
import { t as Progress } from "./progress-DEcPW9jT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/voyage-CocL9XQa.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function RichText({ text, className }) {
	const parts = text.split(/(\*\*[^*]+\*\*)/g);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className,
		children: parts.map((part, i) => {
			if (part.startsWith("**") && part.endsWith("**")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: part.slice(2, -2) }, i);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: part }, i);
		})
	});
}
var CAPTAIN_NOTES = [
	"Take the timed 180-minute deliveries (Croix, Rovinia, Dario) last at each stop, right before you sail — not first.",
	"Choosing Adult sea monsters (Candidum / Nineshark / Black Rust) pays Crow Coins or Black Stones; choosing 5× Young pays Carrack materials instead. You can't do both of the same type.",
	"A Sailies platoon (World Chat or the Sailing Discord) speeds up the Margoria hunting leg a lot — most platoons only do the Adult versions.",
	"Keep a stash of Coral Pieces and a Level 1 barter good in your inventory so Curio's and Baori/Maonil's quests are instant hand-ins.",
	"50 Oquilla Coins can be exchanged with Herrad Romsen on Oquilla's Eye for ship-upgrade materials."
];
var STOPS = [
	{
		id: "velia-docks",
		title: "Velia Docks",
		loc: "NPCs: Croix & Rovinia",
		quests: [
			{
				id: "v1",
				text: "Wanted: Hekaru or Wanted: Ocean Stalker — defeat 1×"
			},
			{
				id: "v2",
				text: "Looming Threats from the Ocean — defeat 1× Goldmont Large Battleship"
			},
			{
				id: "v3",
				text: "Ocean Predators — defeat 3× Goldmont Small Battleships"
			},
			{
				id: "v4",
				text: "Supplies Delivery: Iliya Island (Croix) — timed 180 min",
				tag: "Pick up last"
			},
			{
				id: "v5",
				text: "Supplies Delivery: Tinberra Island (Rovinia) — timed 180 min",
				tag: "Pick up last"
			}
		],
		rewards: "Sailing EXP · Crow Coins · Origin of Wind"
	},
	{
		id: "velia-inn",
		title: "Dancing Marlin Inn, Velia",
		loc: "NPCs: Miya & Proix",
		heading: "Same dock, walk into the inn — no sailing yet.",
		quests: [
			{
				id: "i1",
				text: "Delivering Goods — pick **Tinberra Island** so it lines up with this route (Baremi/Narvo also offered)"
			},
			{
				id: "i2",
				text: "Wanted: Hungry Sea Creatures — 3× Hungry Hekaru + 3× Hungry Ocean Stalker"
			},
			{
				id: "i3",
				text: "Wanted: Cox Scouts in Disguise — kill 20× Cox Pirates"
			},
			{
				id: "i4",
				text: "How to Recover Sailors — cook & hand in Chowder ×3",
				optional: true,
				tag: "Optional · needs residence + cooking"
			}
		],
		rewards: "Sailing EXP · Crow Coins"
	},
	{
		id: "iliya-out",
		title: "Iliya Island",
		loc: "NPCs: Dario, Villager, Baori & Maonil",
		heading: "Sail north from Velia to Weita Island first — clear Cox Pirates there for the 20-kill quest — then continue north to Iliya.",
		quests: [
			{
				id: "il1",
				text: "Hand in Supplies Delivery: Iliya Island to Dario (if chosen at Velia)"
			},
			{
				id: "il2",
				text: "Supplies Delivery: Oquilla's Eye (Dario) — timed 180 min",
				tag: "Pick up last"
			},
			{
				id: "il3",
				text: "Lively Iliya Island I–III — barter 3 / 5 / 10 / 15 times total"
			},
			{
				id: "il4",
				text: "Barter Goods Support I & II (Baori & Maonil) — hand in 1× Level 1 barter good each"
			},
			{
				id: "il5",
				text: "Sailing to a Wider World (Dario) — 20 barters, rewards Explorer's Compass parts",
				optional: true,
				tag: "Optional"
			}
		],
		rewards: "Crow Coins · Sailing/Barter EXP · Contribution EXP"
	},
	{
		id: "tinberra",
		title: "Tinberra Island",
		loc: "Turn-ins: Mulicia & Shanjo",
		heading: "Continue north from Iliya toward Tinberra — kill Hungry Ocean Stalkers ×3 on the way if you haven't already.",
		quests: [
			{
				id: "t1",
				text: "Hand in Delivering Goods to Mulicia (if Tinberra chosen at Velia)"
			},
			{
				id: "t2",
				text: "Hand in Supplies Delivery: Tinberra Island to Shanjo (Rovinia's quest)"
			},
			{
				id: "t3",
				text: "Finish Hungry Ocean Stalkers ×3 if not already done en route"
			}
		],
		rewards: "Sailing EXP · Crow Coins"
	},
	{
		id: "oe-out",
		title: "Oquilla's Eye",
		loc: "NPCs: Ravikel, Soldier, Si Huram & Curio",
		heading: "Head north-west from Tinberra to Oquilla's Eye — clear any Small Goldmont Battleships between the islands on the way.",
		quests: [
			{
				id: "o1",
				label: "Old Moon Guild's Candidum Hunter — choose difficulty",
				choice: [{
					id: "adult",
					text: "1× Candidum (adult)",
					tag: "Crow Coins or Black Stones"
				}, {
					id: "young",
					text: "5× Young Candidum",
					tag: "Carrack materials instead"
				}]
			},
			{
				id: "o2",
				label: "Old Moon Guild's Nineshark Hunter — choose difficulty",
				choice: [{
					id: "adult",
					text: "1× Nineshark (adult)",
					tag: "Crow Coins or Black Stones"
				}, {
					id: "young",
					text: "5× Young Nineshark",
					tag: "Carrack materials instead"
				}]
			},
			{
				id: "o3",
				label: "Old Moon Guild's Black Rust Hunter — choose difficulty",
				choice: [{
					id: "adult",
					text: "1× Black Rust (adult)",
					tag: "Crow Coins or Black Stones"
				}, {
					id: "young",
					text: "5× Young Black Rust",
					tag: "Carrack materials instead"
				}]
			},
			{
				id: "o4",
				text: "Weekly Old Moon Hunter trio (Thursday reset) — Adult only, extra Crow Coins/Black Stones",
				optional: true,
				tag: "Weekly"
			},
			{
				id: "o5",
				text: "Do You Have What It Takes? — kill 1× Hekaru (Soldier)"
			},
			{
				id: "o6",
				text: "Win-win Situation — kill 1× Ocean Stalker (Soldier)"
			},
			{
				id: "o7",
				text: "Our Guild is not a Charity Group — kill 2× Young Sea Monsters (Soldier)"
			},
			{
				id: "o8",
				text: "Through the Rough Tides (Si Huram) — pick the **Velia** delivery so you turn it in on the way home"
			},
			{
				id: "o9",
				text: "Precious Coral Piece (Curio) — hand in 10× Coral Piece"
			},
			{
				id: "o10",
				text: "For the Young Otter Merchants (Curio) — hand in 1× Iridescent Coral Piece (gathered with a hoe)"
			}
		],
		rewards: "Oquilla Coins · Crow Coins · Carrack materials"
	},
	{
		id: "margoria",
		title: "Margoria Hunting Grounds",
		loc: "Ross Sea sea-monster spawns",
		heading: "Leave Oquilla's Eye heading west — this leg is a loop, follow the waypoints below in order.",
		quests: [
			{
				id: "m1",
				heading: "West of Oquilla's Eye — Ocean Stalker habitat",
				text: "Kill 1× Ocean Stalker (adult) + 2× Young Ocean Stalker"
			},
			{
				id: "m2",
				heading: "Continue west — Hekaru habitat",
				text: "Kill 1× Hekaru (adult)"
			},
			{
				id: "m3",
				heading: "Continue west — Predator of Vadabin (Black Rust habitat)",
				label: "Choose difficulty",
				choice: [{
					id: "adult",
					text: "1× Black Rust (adult)",
					tag: "Crow Coins or Black Stones"
				}, {
					id: "young",
					text: "5× Young Black Rust",
					tag: "Carrack materials instead"
				}]
			},
			{
				id: "m4",
				heading: "Head north-east — Cholace Chico's Pirate Union (Goldmont Pirate Territory)",
				text: "Kill 1× Goldmont Large Battleship"
			},
			{
				id: "m5",
				heading: "Continue — Shipwrecked Haran's Cargo Ship",
				label: "Choose difficulty",
				choice: [{
					id: "adult",
					text: "1× Nineshark (adult)",
					tag: "Crow Coins or Black Stones"
				}, {
					id: "young",
					text: "5× Young Nineshark",
					tag: "Carrack materials instead"
				}]
			},
			{
				id: "m6",
				heading: "Continue same direction — Pakio's Combat Raft",
				label: "Choose difficulty",
				choice: [{
					id: "adult",
					text: "1× Candidum (adult)",
					tag: "Crow Coins or Black Stones"
				}, {
					id: "young",
					text: "5× Young Candidum",
					tag: "Carrack materials instead"
				}]
			},
			{
				id: "m7",
				text: "Clear any Goldmont Small Battleships you pass along the loop",
				optional: true,
				tag: "Optional"
			}
		],
		note: "Match whatever your Old Moon Hunter choice was at Oquilla's Eye (Stop 5) for m3/m5/m6 — adult and young count toward different quests. Joining a Sailies platoon here is the biggest time-saver in the whole route.",
		rewards: "Clears Ravikel + Soldier quests"
	},
	{
		id: "oe-return",
		title: "Oquilla's Eye — return",
		loc: "Turn-ins: Ravikel, Soldier & Curio",
		heading: "From Pakio's Combat Raft, head south-east back to Oquilla's Eye.",
		quests: [
			{
				id: "r1",
				text: "Turn in all Ravikel sea-monster quests"
			},
			{
				id: "r2",
				text: "Turn in Soldier's 3 quests"
			},
			{
				id: "r3",
				text: "Hand in both Curio coral quests"
			}
		],
		note: "Keep hold of the Old Moon Trade Item — it's turned in at Velia on the way home.",
		rewards: "Oquilla Coins · Crow Coins · Carrack materials"
	},
	{
		id: "iliya-return",
		title: "Iliya Island — return",
		loc: "Finish bartering & turn-ins",
		heading: "Sail south from Oquilla's Eye back down to Iliya.",
		quests: [
			{
				id: "ir1",
				text: "Finish remaining active barters (aim for 15+ total)"
			},
			{
				id: "ir2",
				text: "Turn in Lively Iliya Island tiers to the Villager"
			},
			{
				id: "ir3",
				text: "Turn in Barter Goods Support to Baori & Maonil"
			}
		],
		rewards: "Sailing/Barter EXP · Contribution EXP · Crow Coins"
	},
	{
		id: "velia-final",
		title: "Velia — final turn-ins",
		loc: "Croix, Rovinia, Miya & Proix",
		heading: "Head south past Lema Island — clear Hungry Hekaru ×3 you pass — then dock at Velia.",
		quests: [
			{
				id: "f1",
				text: "Turn in Croix's & Rovinia's quests"
			},
			{
				id: "f2",
				text: "Turn in Miya's & Proix's quests"
			},
			{
				id: "f3",
				text: "Hand in the Old Moon Trade Item to Robert (Velia Guild Wharf Manager) if you picked Velia"
			},
			{
				id: "f4",
				text: "Store goods, feed sailors, dock ship"
			}
		],
		rewards: "Daily Sailing EXP + Crow Coins secured"
	}
];
var VOYAGE_STORAGE_KEY = "bdo_voyage_log_v1";
var DEFAULT_STATE = {
	checks: {},
	open: null
};
function isStopDone(stop, checks) {
	return stop.quests.filter((q) => !q.optional).every((q) => !!checks[q.id]);
}
function VoyageLog() {
	const { value, setValue } = useLocalStorage(VOYAGE_STORAGE_KEY, DEFAULT_STATE);
	const [notesOpen, setNotesOpen] = (0, import_react.useState)(false);
	const [confirmReset, setConfirmReset] = (0, import_react.useState)(false);
	const currentId = (0, import_react.useMemo)(() => {
		return STOPS.find((s) => !isStopDone(s, value.checks))?.id ?? STOPS[STOPS.length - 1].id;
	}, [value.checks]);
	const doneCount = STOPS.filter((s) => isStopDone(s, value.checks)).length;
	const pct = Math.round(doneCount / STOPS.length * 100);
	const currentIdx = STOPS.findIndex((s) => s.id === currentId);
	const openId = value.open ?? currentId;
	const toggleOpen = (id) => {
		setValue((prev) => ({
			...prev,
			open: prev.open === id ? null : id
		}));
	};
	const setCheck = (id, next) => {
		setValue((prev) => {
			const checks = { ...prev.checks };
			if (next === false || next === "") delete checks[id];
			else checks[id] = next;
			return {
				...prev,
				checks
			};
		});
	};
	const reset = () => {
		setValue({
			checks: {},
			open: STOPS[0].id
		});
		setConfirmReset(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-2 z-20 mb-4 rounded-xl border border-stone bg-paper/95 p-4 shadow-[var(--shadow-border)] backdrop-blur-md",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2 flex items-baseline justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium text-ink",
						children: doneCount === STOPS.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["Voyage complete ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-normal text-muted",
							children: "· all stops turned in"
						})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							"Stop ",
							currentIdx + 1,
							" of ",
							STOPS.length,
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-normal text-muted",
								children: ["· ", STOPS[currentIdx]?.title]
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "shrink-0 font-semibold tabular-nums text-teal",
						children: [
							doneCount,
							"/",
							STOPS.length,
							" stops"
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, { value: pct })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setNotesOpen((o) => !o),
					className: "inline-flex min-h-11 items-center gap-2 text-sm text-muted underline decoration-stone underline-offset-[3px] hover:text-ink",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, {
						className: "size-4",
						strokeWidth: 1.75
					}), "Captain's notes"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setConfirmReset(true),
					className: "inline-flex min-h-11 items-center text-sm text-danger underline decoration-danger/40 underline-offset-[3px] hover:text-danger",
					children: "Reset voyage"
				})]
			}),
			notesOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-5 rounded-xl border border-stone bg-paper p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "mb-2 font-semibold text-teal",
					children: "Captain's notes"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "flex flex-col gap-1.5 text-sm text-muted",
					children: CAPTAIN_NOTES.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "relative pl-3.5 before:absolute before:left-0 before:text-muted before:content-['—']",
						children: n
					}, n))
				})]
			}) : null,
			confirmReset ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-5 rounded-xl border border-danger/30 bg-paper p-4 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-ink",
					children: "Reset all progress for this voyage?"
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative",
				children: STOPS.map((stop, idx) => {
					const done = isStopDone(stop, value.checks);
					const isCurrent = stop.id === currentId;
					const isOpen = stop.id === openId;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-3.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex w-7 shrink-0 flex-col items-center sm:w-[30px]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: cn("relative z-[1] flex size-7 items-center justify-center rounded-full border-2 bg-ivory font-semibold transition-[border-color,background-color,color,box-shadow] duration-300 sm:size-[30px] sm:text-sm", done && "border-teal bg-teal text-ivory", !done && isCurrent && "border-teal text-teal shadow-[0_0_0_4px_rgba(32,89,92,0.18)]", !done && !isCurrent && "border-stone text-muted"),
								children: done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
									className: "size-3.5",
									strokeWidth: 3
								}) : idx + 1
							}), idx < STOPS.length - 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("my-0.5 w-0.5 min-h-3.5 flex-1", done ? "bg-teal" : "bg-stone") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
							className: cn("mb-3.5 min-w-0 flex-1 overflow-hidden rounded-xl border transition-[border-color,background-color,opacity] duration-200", done && "border-stone bg-paper opacity-60", !done && isCurrent && "border-teal/40 bg-paper", !done && !isCurrent && "border-stone bg-paper"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => toggleOpen(stop.id),
								className: "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left",
								"aria-expanded": isOpen,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-semibold text-ink",
									children: stop.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-0.5 block text-[0.78rem] text-muted",
									children: stop.loc
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: cn("size-4 shrink-0 text-muted transition-transform duration-200", isOpen && "rotate-180") })]
							}), isOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "px-4 pb-4",
								children: [
									stop.heading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mb-2 flex gap-1.5 border-b border-stone pb-2.5 text-[0.78rem] text-muted",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compass, {
											className: "mt-0.5 size-3.5 shrink-0 text-teal",
											strokeWidth: 1.75
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: stop.heading })]
									}) : null,
									stop.quests.map((q) => {
										if (q.choice) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "border-t border-stone py-2.5 first:border-t-0",
											children: [
												q.heading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mb-2 border-t border-dashed border-stone pt-2 text-[0.74rem] text-teal first:border-t-0 first:pt-0",
													children: q.heading
												}) : null,
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "mb-2 inline-block rounded px-1.5 py-0.5 text-[0.68rem] font-semibold tracking-wide text-ivory bg-teal",
													children: q.label || "Choose one"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "flex flex-col gap-1",
													children: q.choice.map((opt) => {
														const rid = `r-${q.id}-${opt.id}`;
														const checked = value.checks[q.id] === opt.id;
														return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
															htmlFor: rid,
															className: "flex min-h-11 cursor-pointer items-start gap-2.5 py-1 pl-1",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
																type: "radio",
																id: rid,
																name: q.id,
																className: "radio-dot",
																checked,
																onChange: () => setCheck(q.id, opt.id)
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "text-[0.87rem] text-ink",
																children: [opt.text, opt.tag ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "mt-0.5 block text-[0.75rem] text-muted",
																	children: opt.tag
																}) : null]
															})]
														}, opt.id);
													})
												})
											]
										}, q.id);
										const checked = !!value.checks[q.id];
										const cbId = `cb-${q.id}`;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [q.heading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2.5 border-t border-dashed border-stone pt-2 text-[0.74rem] text-teal",
											children: q.heading
										}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											htmlFor: cbId,
											className: cn("flex min-h-11 cursor-pointer items-start gap-2.5 border-t border-stone py-2 first:border-t-0", q.optional && "text-muted"),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "relative mt-0.5 shrink-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "checkbox",
													id: cbId,
													checked,
													onChange: (e) => setCheck(q.id, e.target.checked),
													className: "peer size-[19px] appearance-none rounded-[5px] border-2 border-muted checked:border-teal checked:bg-teal"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
													className: "pointer-events-none absolute inset-0 m-auto hidden size-3 text-ivory peer-checked:block",
													strokeWidth: 3
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: cn("text-[0.88rem]", checked ? "text-muted line-through" : q.optional ? "text-muted" : "text-ink"),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RichText, { text: q.text || "" }), q.tag ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "ml-1.5 inline-block rounded border border-teal/35 px-1.5 py-px align-middle text-[0.68rem] text-teal",
													children: q.tag
												}) : null]
											})]
										})] }, q.id);
									}),
									stop.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2.5 rounded-lg border-l-2 border-stone bg-ivory px-2.5 py-2 text-[0.8rem] text-muted",
										children: stop.note
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2.5 inline-block rounded-md bg-teal/10 px-2.5 py-1.5 text-[0.78rem] text-teal",
										children: stop.rewards
									})
								]
							}) : null]
						})]
					}, stop.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-center text-[0.78rem] text-muted",
				children: "Progress saves automatically in this browser."
			})
		]
	});
}
function VoyagePage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		eyebrow: "Daily Sailies & bartering",
		title: "Voyage log",
		subtitle: "Velia → Iliya → Oquilla's Eye → Margoria → home. Check off each stop; progress saves in this browser.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VoyageLog, {})
	});
}
//#endregion
export { VoyagePage as component };
