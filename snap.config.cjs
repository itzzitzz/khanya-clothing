module.exports = {
  // Routes to pre-render
  include: [
    "/",
    "/view-order-bales",
    "/brand",
    "/contact",
    "/location",
    "/track-order",
    "/faq",
    "/blog",
    "/terms-of-service",
    "/reviews",
  ],
  // Wait for network to be idle before capturing
  puppeteerArgs: ["--no-sandbox", "--disable-setuid-sandbox"],
  // Inline critical CSS
  inlineCss: true,
  // Remove script tags for faster initial load (React will hydrate)
  removeScriptTags: false,
  // Fix localhost URLs
  fixWebpackChunksIssue: true,
  // Wait for React to render
  waitFor: 2000,
  // Skip external links
  externalLinksPolicy: "skip",
};
