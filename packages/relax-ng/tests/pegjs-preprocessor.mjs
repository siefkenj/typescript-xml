/* eslint-env node */

/*
 * This preprocessor allows .pegjs to be imported into Jest
 * tests.
 */

import peg from "peggy";
import * as esbuild from "esbuild";
let allowedStartRules = [
    "NCName",
    "CName",
    "literal",
    "literalSegment",
    "annotationAttributes",
    "annotationElement",
    "annotationContent",
    "followAnnotations",
    "documentationLine",
    "documentation",
    "nameClass",
    "param",
    "pattern",
    "datatypeName",
];

function removeTypescriptTypes(source) {
    const ret = esbuild.transformSync(source, { loader: "ts", target: "node16" });
    return ret.code;
}

export default {
    process: (src) => {
        const parser = removeTypescriptTypes(
            peg.generate(src, {
                output: "source",
                format: "umd",
                allowedStartRules,
            })
        );
        return { code: parser };
    },
};
