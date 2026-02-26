import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
const cleanRoutes = {
  "/services": "/services.html",
  "/services/": "/services.html",
  "/gallery": "/gallery.html",
  "/gallery/": "/gallery.html",
  "/work-with-us": "/work-with-us.html",
  "/work-with-us/": "/work-with-us.html",
  "/contact": "/contact.html",
  "/contact/": "/contact.html"
};

function cleanRoutePlugin() {
  const rewriteRequest = (url = "") => {
    const [pathname, query = ""] = String(url).split("?");
    if (!Object.prototype.hasOwnProperty.call(cleanRoutes, pathname)) return null;
    return `${cleanRoutes[pathname]}${query ? `?${query}` : ""}`;
  };

  const middleware = (req, _res, next) => {
    const rewritten = rewriteRequest(req.url || "");
    if (rewritten) req.url = rewritten;
    next();
  };

  return {
    name: "clean-routes",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    }
  };
}

export default defineConfig({
  plugins: [cleanRoutePlugin()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(rootDir, "index.html"),
        services: resolve(rootDir, "services.html"),
        gallery: resolve(rootDir, "gallery.html"),
        workWithUs: resolve(rootDir, "work-with-us.html"),
        contact: resolve(rootDir, "contact.html"),
        altIndex: resolve(rootDir, "alt-index.html"),
        altServices: resolve(rootDir, "alt-services.html"),
        altGallery: resolve(rootDir, "alt-gallery.html"),
        altWorkWithUs: resolve(rootDir, "alt-work-with-us.html"),
        altContact: resolve(rootDir, "alt-contact.html")
      }
    }
  }
});
