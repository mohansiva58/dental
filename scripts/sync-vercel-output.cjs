const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const source = path.join(repoRoot, "artifacts", "dental-clinic", "dist", "public");
const targets = [
  path.join(repoRoot, "public"),
  path.join(process.cwd(), "public"),
  path.join(repoRoot, "artifacts", "api-server", "public"),
];

if (!fs.existsSync(source)) {
  console.error(`Expected build output was not found: ${source}`);
  process.exit(1);
}

for (const target of new Set(targets)) {
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true });
}
