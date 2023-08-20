import { PluginOption } from "vite";
import { defineConfig } from "vitest/config";
import peggy from "peggy";
import * as esbuild from "esbuild";

export default defineConfig({
    plugins: [peggyTransformer()],
    test: {
        globals: true,
    },
});

function peggyTransformer(): PluginOption {
    return {
        name: "rollup-plugin-peggy",
        transform: async (code, id, options) => {
            if (!id.match(/\.(peggy|pegjs)$/)) {
                return;
            }
            const parserSource = peggy.generate(code, {
                output: "source",
                format: "es",
                allowedStartRules: ["*"],
            });
            // strip away any typescript types.
            const retCode = esbuild.transformSync(parserSource, {
                loader: "ts",
            }).code;
            return { code: retCode };
        },
    };
}
