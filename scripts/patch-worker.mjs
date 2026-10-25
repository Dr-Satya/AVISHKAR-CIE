import fs from "node:fs";
import path from "node:path";

const workerPath = path.resolve(".open-next/worker.js");
if (fs.existsSync(workerPath)) {
  let content = fs.readFileSync(workerPath, "utf-8");
  if (!content.includes("async scheduled(")) {
    const target = "return handler(request, env, ctx);\n        });\n    },";
    const replacement = `return handler(request, env, ctx);
        });
    },
    async scheduled(event, env, ctx) {
        // Keeps worker isolate warm & prevents cold starts during peak registration
        console.log("[WARMUP] Edge worker cron warmup triggered at:", new Date(event.scheduledTime).toISOString());
    },`;
    if (content.includes(target)) {
      content = content.replace(target, replacement);
      fs.writeFileSync(workerPath, content, "utf-8");
      console.log("✓ Patched .open-next/worker.js with scheduled warmup handler");
    } else {
      content = content.replace(
        /export default\s*{([\s\S]*?)};/,
        (match, p1) => `export default {${p1}
    async scheduled(event, env, ctx) {
        console.log("[WARMUP] Edge worker cron warmup triggered at:", new Date(event.scheduledTime).toISOString());
    },
};`
      );
      fs.writeFileSync(workerPath, content, "utf-8");
      console.log("✓ Patched .open-next/worker.js with scheduled handler (fallback)");
    }
  }
}
