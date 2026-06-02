const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const source = path.join(repoRoot, "artifacts", "dental-clinic", "dist", "public");
const target = path.join(repoRoot, "public");

if (!fs.existsSync(source)) {
  console.error(`Expected build output was not found: ${source}`);
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });
