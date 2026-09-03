import * as esbuild from "esbuild";

const mode = process.argv[2] ?? "dev";
const prod = mode === "production";

await esbuild.build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  format: "cjs",
  platform: "browser",
  target: "es2018",
  outfile: "main.js",
  external: ["obsidian"],
  minify: prod,
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  logLevel: "info"
});
