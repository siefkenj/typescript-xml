import util from "util";
import { fromXml } from "xast-util-from-xml";
import * as fs from "node:fs/promises";
import * as glob from "glob";
import { lezerToXast } from "../src/lezer/lezer-to-xast";

/* eslint-env jest */

// Make console.log pretty-print by default
const origLog = console.log;
console.log = (...args) => {
    origLog(...args.map((x) => util.inspect(x, false, 10, true)));
};

describe("XML Parse via Lezer", () => {
    describe("XAST test suite", () => {
        const xmlFiles = glob.glob.sync(
            "./tests/xast-util-from-xml-samples/**/*.xml"
        );
        const tests = xmlFiles.map((f) => {
            const xmlFilePath = f;
            const jsonFilePath =
                "." +
                String(
                    new URL(
                        "./index.json",
                        String(new URL(xmlFilePath, "file:///"))
                    )
                ).slice(7);
            let dirName = "<unknown>";
            const match = xmlFilePath.match(/\/([^/]+)\/index/);
            if (match) {
                dirName = match[1] || "<unknown>";
            }
            return {
                xmlFilePath,
                jsonFilePath,
                dirName,
            };
        });

        for (const test of tests) {
            const testFunc = async () => {
                const source = await fs.readFile(test.xmlFilePath, "utf-8");
                const json = JSON.parse(
                    await fs.readFile(test.jsonFilePath, "utf-8")
                );
                const ast = lezerToXast(source);
                expect(ast).toEqual(json);
            };
            if (test.dirName.endsWith(".skip")) {
                it.skip(`XAST test in directory "${test.dirName}"`, testFunc);
            } else {
                it(`XAST test in directory "${test.dirName}"`, testFunc);
            }
        }
    });
});
