import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit", cwd: __dirname });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const protoDir = path.join(__dirname, "proto");

run("pbjs", [
  "-t", "static-module",
  "-w", "es6",
  "-o", "src/proto.js",
  "--force-bigint",
  "--null-semantics",
  "--no-verify",
  "--no-delimited",
  "--no-service",
  path.join(protoDir, "core.proto"),
]);

run("pbts", ["-o", "src/proto.d.ts", "src/proto.js"]);

// protobufjs emits a CJS-style import that breaks ESM.
const protoSrc = "src/proto.js";
const fixed = fs
  .readFileSync(protoSrc, "utf8")
  .replace(
    /^import \* as \$protobuf from ["']@tanglechat\/protobufjs\/minimal["'];/m,
    'import $protobuf from "@tanglechat/protobufjs/minimal.js";'
  );
fs.writeFileSync(protoSrc, fixed);

console.log("Proto compiled successfully.");