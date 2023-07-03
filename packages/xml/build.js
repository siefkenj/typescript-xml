import esbuild from "esbuild";
import fs from "node:fs/promises";
//import {pegjsLoader} from "./scripts/esbuild-pegjs-loader.mjs";

(async () => {
    const packageJson = JSON.parse(
        await fs.readFile(new URL("./package.json", import.meta.url))
    );

    // We want to externalize modules that are explicitly installed as a dependency
    const explicitDeps = Object.keys(packageJson.dependencies || {});

    const commonConfig = {
        entryPoints: ["./src/index.ts"],
        outfile: "./dist/index.js",
        bundle: true,
        minify: false,
        sourcemap: true,
        format: "esm",
        target: "node16",
        platform: "node",
        external: [...explicitDeps],
    };

    // Build the ESM
    esbuild.build(commonConfig).catch(() => process.exit(1));

    // Build a CommonJS version as well
    esbuild
        .build({
            ...commonConfig,
            outfile: "./dist/index.cjs",
            format: "cjs",
        })
        .catch(() => process.exit(1));
})();
