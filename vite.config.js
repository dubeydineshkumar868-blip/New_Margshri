import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Speed: split the big libraries into their own files. They rarely change, so phones
// keep them cached; after each Margshri update only the small app file is downloaded.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@firebase/firestore") || id.includes("firebase/firestore")) return "firebase-firestore";
          if (id.includes("@firebase/auth") || id.includes("firebase/auth")) return "firebase-auth";
          if (id.includes("firebase") || id.includes("@firebase")) return "firebase-core";
          if (id.includes("react-dom") || id.includes("/react/") || id.includes("scheduler")) return "react";
          if (id.includes("lucide-react")) return "icons";
          return "vendor";
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
});
