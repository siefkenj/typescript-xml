import util from "util";
import { RelaxNgCompactPegParser } from "../src/parser/parsers";
import { allowedStartRules } from "../src/parser/relax-ng-compact-allowed-start-rules";

/* eslint-env jest */

// Make console.log pretty-print by default
const origLog = console.log;
console.log = (...args) => {
    origLog(...args.map((x) => util.inspect(x, false, 10, true)));
};

const parse = RelaxNgCompactPegParser.parse;

type ParseTestSample = Record<
    typeof allowedStartRules[number],
    {
        pass: string[];
        fail: string[];
    }
>;

function runBasicParseTests(samples: ParseTestSample) {
    for (const [key, val] of Object.entries(samples)) {
        describe(`Can parse "${key}"`, () => {
            for (const str of val.pass) {
                it(`Parses \`${str}\``, () => {
                    parse(str, { startRule: key });
                });
            }
            for (const str of val.fail) {
                it(`Fails to parse ${JSON.stringify(str)}`, () => {
                    expect(() => parse(str, { startRule: key })).toThrow();
                });
            }
        });
    }
}

describe.only("Relax-ng Compact", () => {
    runBasicParseTests({
        CName: { pass: ["foo:bar"], fail: ["foo"] },
        NCName: { pass: ["foo123-dsf"], fail: ["foo:bar"] },
        literalSegment: {
            pass: [
                `"hi there!"`,
                `"""some "quoted" things"""`,
                `"""some \n things"""`,
                `'mixed " quotes'`,
            ],
            fail: [`"""`, `"foo\nbar"`],
        },
        literal: {
            pass: [
                `"hi there!"`,
                `"hi there!"~'foo'`,
                `"hi there!" ~ 'foo'`,
                `"hi there!" ~\n'foo'`,
                `"hi there!" ~ 'foo' ~ 'baz'`,
            ],
            fail: [`"foo"~`, `"beef" `],
        },
        annotationAttributes: {
            pass: [
                `foo:bar="bee"`,
                `foo:bar="baz"~"bong"`,
                `foo:bar="baz" me:boo="haz"`,
                `foo:bar="bee"`,
                `foo="baz"~"bong"`,
                `foo="baz" me="haz"`,
                `foo:bar="baz"me:boo="haz"`,
                `foo="baz"me="haz"`,
            ],
            fail: [],
        },
        annotationElement: {
            pass: [
                `ham [mo="vaz"]`,
                `foo[]`,
                `foo["bar"~"baz"]`,
                `ham [mo="vaz" ma="zz"]`,
                `foo["bar" noo [x="y"]]`,
            ],
            fail: [],
        },
        followAnnotations: {
            pass: [
                `>> ham:b [mo="vaz"]`,
                `>>ham:b[]`,
                `>>ham:b[]>>sam:c[]`,
                `>>ham:b[] >>sam:c[]`,
            ],
            fail: [],
        },
        documentationLine: {
            pass: ["##foo", "## bar", "##", "###comment"],
            fail: ["#comment"],
        },
        documentation: {
            pass: ["##foo", "## bar\n##baz", "##", "###comment"],
            fail: ["#comment"],
        },
        nameClass: {
            pass: [
                // simple
                "foo-x",
                "foo:bar",
                "foo:*",
                "*",
                `foo`,
                `foo:zz`,
                `foo|bar`,
                `(foo)`,
                `(foo|bar)`,
                `foo|(*-zzz)`,
                // choice
                `x|y`,
                `bar>>baz[]|z`,
                // annotated
                `##foo\nbar>>baz[]`,
                `bar>>baz[]`,
                `bar`,
                // annotated except

                `*-foo`,
                `* - foo`,
                `*-(foo|bar)`,
                `##ann\n*-foo`,
                `*-##ann\nfoo`,
            ],
            fail: ["foo:"],
        },
        param: {
            pass: [`foo="bar"`, `##xxx\nfoo="bar"`],
            fail: [],
        },
        datatypeName: {
            pass: [`foo:x`, `string`, `token`, `stringX:y`, `string:x`],
            fail: [],
        },
        pattern: {
            pass: [
                `x|y`,
                `x,(y|z)`,
                `x&y`,
                `x:x - y`,
                `x`,
                // annotatedDataExcept
                `x:x - y`,
                `x:x -y`,
                `string -y`,
                `##comment\nx:x -y`,
                `x:x -y>>foo[]`,
                // particleChoice
                `x|y`,
                `x|y|z`,
                `x|y>>baz[]|z`,
                // datatype
                `foo:x`,
                //`foo:x bar="baz"`,  // Not sure if this is valid...
                `foo:x "bam"`,
                `token "x"`,
            ],
            fail: [],
        },
    });
});
