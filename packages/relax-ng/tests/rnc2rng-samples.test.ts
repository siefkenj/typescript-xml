import { glob } from "glob";
import fs from "node:fs/promises";
import path from "node:path";
import util from "util";
import { parseRnc } from "../src/parser/parsers";

/* eslint-env jest */

// Make console.log pretty-print by default
const origLog = console.log;
console.log = (...args) => {
    origLog(...args.map((x) => util.inspect(x, false, 10, true)));
};

describe.only("Relax-ng Compact samples from rnc2rng", async () => {
    // Get all the fragment files
    const sampleFiles = glob.sync(
        new URL("./rnc2rng/*.rnc", import.meta.url).pathname
    );

    for (const [file, samplePromise] of sampleFiles.map((file) => [
        file,
        fs.readFile(file, { encoding: "utf-8" }),
    ])) {
        const fileName = path.basename(await file);
        const fragment = await samplePromise;
        it(`Can parse ${fileName}`, () => {
            parseRnc(fragment);
        });
    }
});
