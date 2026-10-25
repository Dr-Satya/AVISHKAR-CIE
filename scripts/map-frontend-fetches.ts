import * as fs from "fs";
import * as path from "path";

function walkDir(dir: string, callback: (filePath: string) => void) {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes(".next") && !fullPath.includes("node_modules")) {
        walkDir(fullPath, callback);
      }
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      callback(fullPath);
    }
  });
}

const apiCalls: Array<{ file: string; line: number; url: string; method: string; snippet: string }> = [];

function checkFile(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("fetch(") || line.includes("fetch(`")) {
      let snippet = line;
      for (let k = 1; k < 12 && i + k < lines.length; k++) {
        snippet += "\n" + lines[i + k];
        if (snippet.includes("})") || snippet.includes(";")) break;
      }

      const urlMatch =
        snippet.match(/fetch\(\s*["']([^"'?\s]+)/) ||
        snippet.match(/fetch\(\s*`([^`?\$\s]+)/) ||
        snippet.match(/fetch\(([^,)]+)/);
      const methodMatch = snippet.match(/method:\s*["']([A-Z]+)["']/);
      const method = methodMatch ? methodMatch[1] : "GET";
      const rawUrl = urlMatch ? urlMatch[1].trim() : "unknown";

      apiCalls.push({
        file: path.relative(process.cwd(), filePath),
        line: i + 1,
        url: rawUrl,
        method,
        snippet: snippet.split("\n").slice(0, 4).join(" ").trim(),
      });
    }
  }
}

walkDir("app", checkFile);
walkDir("components", checkFile);

console.log("=================================================================");
console.log(`📡 TOTAL FRONTEND FETCH CALLS FOUND: ${apiCalls.length}`);
console.log("=================================================================");

const endpointMap = new Map<string, Array<{ file: string; line: number }>>();

for (const call of apiCalls) {
  const key = `${call.method} ${call.url}`;
  if (!endpointMap.has(key)) {
    endpointMap.set(key, []);
  }
  endpointMap.get(key)!.push({ file: call.file, line: call.line });
}

const sortedKeys = Array.from(endpointMap.keys()).sort();
for (const key of sortedKeys) {
  const callers = endpointMap.get(key)!;
  console.log(`${key.padEnd(45)} [${callers.length} caller(s)]`);
  for (const c of callers.slice(0, 3)) {
    console.log(`    ↳ ${c.file}:${c.line}`);
  }
  if (callers.length > 3) {
    console.log(`    ↳ ... and ${callers.length - 3} more`);
  }
}
