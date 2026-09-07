import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as cn } from "./app-shell-C2sGcISJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/progress-DEcPW9jT.js
var import_jsx_runtime = require_jsx_runtime();
function Progress({ value, className }) {
	const pct = Math.max(0, Math.min(100, value));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("h-3 overflow-hidden rounded-full bg-stone", className),
		role: "progressbar",
		"aria-valuenow": Math.round(pct),
		"aria-valuemin": 0,
		"aria-valuemax": 100,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-full rounded-full bg-teal transition-[width] duration-300 ease-[var(--ease-out-smooth)]",
			style: { width: `${pct}%` }
		})
	});
}
//#endregion
export { Progress as t };
