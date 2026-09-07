import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, d as useRouterState, v as Link, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as Anchor, n as Ship, s as FlaskConical } from "../_libs/lucide-react.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app-shell-C2sGcISJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function formatNumber(n) {
	return n.toLocaleString("en-US");
}
function readStorage(key, fallback) {
	if (typeof window === "undefined") return fallback;
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return fallback;
		return JSON.parse(raw);
	} catch {
		return fallback;
	}
}
function writeStorage(key, value) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {}
}
function useLocalStorage(key, initial) {
	const [value, setValue] = (0, import_react.useState)(initial);
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setValue(readStorage(key, initial));
		setHydrated(true);
	}, [key]);
	return {
		value,
		setValue: (0, import_react.useCallback)((next) => {
			setValue((prev) => {
				const resolved = typeof next === "function" ? next(prev) : next;
				writeStorage(key, resolved);
				return resolved;
			});
		}, [key]),
		hydrated
	};
}
var NAV = [
	{
		to: "/",
		label: "Alchemy",
		hint: "Harmony pipeline",
		icon: FlaskConical,
		exact: true
	},
	{
		to: "/voyage",
		label: "Voyage",
		hint: "Sailies & barter",
		icon: Anchor,
		exact: false
	},
	{
		to: "/ships",
		label: "Carrack",
		hint: "Upgrade tracker",
		icon: Ship,
		exact: false
	}
];
function AppShell({ children, eyebrow, title, subtitle }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-ivory pb-16 text-ink",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "bg-teal text-ivory",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-center text-[0.7rem] font-medium uppercase tracking-[0.35em] text-stone sm:tracking-[0.45em]",
						children: "Black Desert Online"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 text-center font-medium uppercase tracking-[0.28em] text-balance text-[1.65rem] text-ivory sm:text-[2.1rem] sm:tracking-[0.42em]",
						children: "The Alchemist"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-center text-xs tracking-[0.18em] text-stone uppercase",
						children: "Alchemy · Sailies · Carrack"
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					"aria-label": "Tools",
					className: "mb-6 grid grid-cols-3 gap-2 sm:gap-3",
					children: NAV.map((item) => {
						const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
						const Icon = item.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.to,
							"aria-current": active ? "page" : void 0,
							className: cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-[10px] border px-2 py-3 text-center transition-[background-color,color,border-color,box-shadow] duration-150 sm:flex-row sm:gap-2.5 sm:px-4", active ? "border-teal bg-teal text-ivory shadow-[0_4px_14px_rgba(32,89,92,0.30)]" : "border-stone bg-paper text-muted hover:border-teal hover:text-ink"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
									className: "size-4 shrink-0",
									strokeWidth: 1.75,
									"aria-hidden": true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm font-bold sm:text-base",
									children: item.label
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("hidden text-xs font-medium italic sm:inline", active ? "text-ivory/75" : "text-muted"),
									children: item.hint
								})
							]
						}, item.to);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-6",
					children: [
						eyebrow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-1 text-xs font-bold uppercase tracking-wider text-teal",
							children: eyebrow
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl font-semibold text-ink sm:text-2xl",
							children: title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 max-w-3xl text-sm text-muted",
							children: subtitle
						})
					]
				}),
				children
			]
		})]
	});
}
//#endregion
export { useLocalStorage as i, cn as n, formatNumber as r, AppShell as t };
