import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// @ts-ignore - no types available for this plugin
import prerender from "vite-plugin-prerender";

// Routes to pre-render for SEO
const routesToPrerender = [
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
];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'production' && prerender({
      routes: routesToPrerender,
      renderer: "@prerenderer/renderer-puppeteer",
      rendererOptions: {
        maxConcurrentRoutes: 4,
        renderAfterDocumentEvent: "render-event",
      },
      postProcess(renderedRoute: { html: string; route: string }) {
        // Ensure proper meta tags are in the output
        renderedRoute.html = renderedRoute.html
          .replace(/<script type="module"[^>]*><\/script>/g, (match: string) => match)
          .replace(/http:\/\/localhost:\d+/g, "https://khanya.store");
        return renderedRoute;
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
