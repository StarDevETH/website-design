import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(fileURLToPath(new URL(".", import.meta.url)));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(rootDir, "index.html"),
        altIndex: resolve(rootDir, "alt-index.html"),
        services: resolve(rootDir, "services.html"),
        altServices: resolve(rootDir, "alt-services.html"),
        gallery: resolve(rootDir, "gallery.html"),
        altGallery: resolve(rootDir, "alt-gallery.html"),
        workWithUs: resolve(rootDir, "work-with-us.html"),
        altWorkWithUs: resolve(rootDir, "alt-work-with-us.html"),
        contact: resolve(rootDir, "contact.html"),
        altContact: resolve(rootDir, "alt-contact.html")
      }
    }
  }
});
