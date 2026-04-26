import { v as Link$1, j as jsxRuntimeExports } from "./vendor-Bhi5WPns.js";
import "./preload-DNrUkv91.js";
const Link = Link$1;
function NotFoundPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center", style: { background: "linear-gradient(to bottom right, hsl(var(--primary)), hsl(var(--secondary)))" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto px-4 max-w-2xl text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-6xl font-bold text-white/90", children: "404" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-semibold text-white/90", children: "Page Not Found" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white/90", children: "Sorry, the page you're looking for doesn't exist or has been moved." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "px-8 py-3 bg-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105", style: { color: "hsl(var(--primary))" }, children: "🏠 Go Home" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "px-8 py-3 bg-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105", style: { color: "hsl(var(--primary))" }, onClick: () => window.history.back(), children: "← Go Back" })
    ] })
  ] }) }) });
}
export {
  NotFoundPage as default
};
