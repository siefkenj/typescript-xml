import util from "util";
import { TopLevel } from "../src/parser/grammars/relax-ng-compact-types";
import { parseRnc } from "../src/parser/parsers";
import { printRaw } from "../src/printer/rnc/print-raw";

/* eslint-env jest */

// Make console.log pretty-print by default
const origLog = console.log;
console.log = (...args) => {
    origLog(...args.map((x) => util.inspect(x, false, 10, true)));
};

describe.only("Relax-ng Compact printRaw tests", async () => {
    let ast: TopLevel;

    const samples = {
        element: [
            [`element foo { text }`, `element foo { text }`],
            [`element foo { empty }`, `element foo { empty }`],
        ],
        elementWithAttribute: [
            [
                `element foo { attribute bar { text } }`,
                `element foo { attribute bar { text } }`,
            ],
            [
                `element wine-catalog {    attribute xml:base{text}?,         wine*      }`,
                `element wine-catalog { attribute xml:base { text }?, wine* }`,
            ],
        ],
        elementWithRepeat: [
            [`element foo { (a | b)*  }`, `element foo { (a | b)* }`],
            [`element foo { (a | b)?  }`, `element foo { (a | b)? }`],
            [
                `element foo { "A" ~ "b" | "B" | "C" }`,
                `element foo { "A" ~ "b" | "B" | "C" }`,
            ],
        ],
        declaration: [
            [
                `propertyAttr = attribute * - (local:* | rdf:RDF | xml:*) { string }`,
                `propertyAttr = attribute * - (local:* | rdf:RDF | xml:*) { string }`,
            ],
            [
                `any = mixed { element * { attribute * { text }*, any }* }`,
                `any = mixed { element * { attribute * { text }*, any }* }`,
            ],
        ],
        namespaces: [
            [
                `namespace local = ""
                default namespace rdf = "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
                datatypes xsd = "http://www.w3.org/2001/XMLSchema-datatypes"
                namespace ab = inherit`,
                `namespace local = ""\ndefault namespace rdf = "http://www.w3.org/1999/02/22-rdf-syntax-ns#"\ndatatypes xsd = "http://www.w3.org/2001/XMLSchema-datatypes"\nnamespace ab = inherit`,
            ],
        ],
        annotations: [
            [
                `## Represents an\n## address book.\nelement addressBook { text }`,
                `## Represents an\n## address book.\nelement addressBook { text }`,
            ],
            [
                `[
                        a:documentation [
                          "Represents an " ~
                          "address book."
                        ]
                      ]
                    element addressBook { text }`,
                `[ a:documentation [ "Represents an " ~ "address book." ] ]\nelement addressBook { text }`,
            ],
            [
                `x:entity [ name="picture" systemId="picture.jpeg" notation="jpeg" ]`,
                `x:entity [ name="picture" systemId="picture.jpeg" notation="jpeg" ]`,
            ],
        ],
        trailingAnnotations: [
            [
                `element foo {
                text >> x[] >> y[]
              }`,
                `element foo { text >> x[] >> y[] }`,
            ],
        ],
        div: [
            [
                `[ m:name = "block" ]
                    div {
                      p = pattern
                      em =pattern
                    }`,
                `[ m:name="block" ]\ndiv { p = pattern\nem = pattern }`,
            ],
        ],
        external: [
            [
                `external "address.rnc" inherit = a`,
                `external "address.rnc" inherit = a`,
            ],
            [`external "address.rnc"`, `external "address.rnc"`],
        ],
        start: [[`start = \\element`, `start = \\element`]],
        grammar: [[`grammar {start = foo}`, `grammar { start = foo }`]],
        include: [
            [`include "inline.rnc"`, `include "inline.rnc"`],
            [
                `include "inline.rnc" { foo = bar }`,
                `include "inline.rnc" { foo = bar }`,
            ],
            [
                `include "inline.rnc" inherit = ns`,
                `include "inline.rnc" inherit = ns`,
            ],
            [
                `include "inline.rnc" inherit = ns { foo = bar }`,
                `include "inline.rnc" inherit = ns { foo = bar }`,
            ],
        ],
        list: [
            [
                `element foo { list { xsd:double+ } }`,
                `element foo { list { xsd:double+ } }`,
            ],
        ],
        notAllowed: [
            [`inline.extra = notAllowed`, `inline.extra = notAllowed`],
        ],
        parentRef: [[`parent foo`, `parent foo`]],
        datatype: [[`string "foo"`, `string "foo"`]],
        datatypeExcept: [
            [
                `string {foo="bar" baz="bang"}`,
                `string { foo="bar" baz="bang" }`,
            ],
            [`string {foo="bar"} - baz`, `string { foo="bar" } - baz`],
            [
                `string {foo="bar"} - (baz | bean)`, `string { foo="bar" } - (baz | bean)`
            ]
        ],
        comments: [
            [`# foo\nx=y`, `# foo\nx = y`],
            [`# foo\n# bar\nx=y`, `# foo\n# bar\nx = y`],
            [`# foo\na=b# bar\nx=y`, `# foo\na = b\n# bar\nx = y`],
            [`# foo\na=b# bar`, `# foo\na = b\n# bar`],
        ]
    };

    for (const [name, specs] of Object.entries(samples)) {
        it(`Can printRaw ${name} samples`, () => {
            for (const [input, expected] of specs) {
                ast = parseRnc(input);
                expect(printRaw(ast)).toEqual(expected);
            }
        });
    }

    //it("Can printRaw samples", () => {
    //    ast = parseRnc(`# foo\na=b#bar\n`, {
    //    });
    //    console.log(ast);
    //    expect(printRaw(ast)).toEqual(`# foo\na = b\n#bar`);
    //});
});
