async function handler(_req, res) {
  res.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    message: "Hello World!"
  });
}

export { handler as h };
