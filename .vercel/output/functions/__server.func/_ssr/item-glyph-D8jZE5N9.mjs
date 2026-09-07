import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as cn } from "./app-shell-C2sGcISJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/item-glyph-D8jZE5N9.js
var import_jsx_runtime = require_jsx_runtime();
var PALETTE = [
	"#20595C",
	"#163E40",
	"#4A7A6E",
	"#5C6B6B",
	"#8C4A44",
	"#6B4A3A"
];
function hashName(name) {
	let h = 0;
	for (let i = 0; i < name.length; i++) h = h * 31 + name.charCodeAt(i) | 0;
	return Math.abs(h);
}
function letterFor(name) {
	return (name.replace(/[^A-Za-z]/g, "")[0] || "?").toUpperCase();
}
function colorFor(name) {
	if (/^Oil of /.test(name)) return "#20595C";
	if (/Blood/.test(name)) return "#8C4A44";
	if (/Elixir|Draught/.test(name)) return "#20595C";
	return PALETTE[hashName(name) % PALETTE.length];
}
function ItemGlyph({ name, size = 44, className }) {
	const letter = letterFor(name);
	const color = colorFor(name);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: size,
		height: size,
		viewBox: "0 0 64 64",
		"aria-hidden": true,
		className: cn("shrink-0", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: "64",
				height: "64",
				rx: "10",
				fill: "#F3EEE4"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "32",
				cy: "32",
				r: "22",
				fill: "none",
				stroke: color,
				strokeWidth: "4"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
				x: "32",
				y: "40",
				fontFamily: "Lora, Georgia, serif",
				fontSize: "22",
				fontWeight: "700",
				fill: color,
				textAnchor: "middle",
				children: letter
			})
		]
	});
}
//#endregion
export { ItemGlyph as t };
