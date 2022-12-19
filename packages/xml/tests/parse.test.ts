import util from "util";
import * as lezerXml from "@lezer/xml";
import { fromXml } from "xast-util-from-xml";
import * as fs from "node:fs/promises";
import { DocumentCstNode, parse as xmlToolsParse } from "@xml-tools/parser";
import { buildAst } from "@xml-tools/ast";
import { getSuggestions } from "@xml-tools/content-assist";
import { lezerNodeToXastNode, lezerToXast } from "../src/lezer/lezer-to-xast";
import { lezerParsingDiagnosticsForString } from "../src/lezer/lezer-diagnostics";

/* eslint-env jest */

// Make console.log pretty-print by default
const origLog = console.log;
console.log = (...args) => {
    origLog(...args.map((x) => util.inspect(x, false, 10, true)));
};

describe("XML Parse", () => {
    it("Passes hello world", async () => {
        let source: string;
        source = `<?xml?>< foo baz="bo&amp;o"><a>b</a>foo&amp;bar</foo>`;
        source = `<?xml-stylesheet type="text/xsl" href="style&amp;.xsl"?>
            <!-- comme -->
            <foo baz="bar">
            <![CDATA[<sender>John Smith</sender>]]>x&amp;y</foo>`;
        //source = `<!DOCTYPE HTML PUBLIC '-//W3C//DTD HTML 4.0 Transitional//EN' 'http://www.w3.org/TR/REC-html40/loose.dtd'>`;
        //source = `<!DOCTYPE root-element PUBLIC "/quotedFPI/" "/quotedURI/"
        //    >`;
        //source = await fs.readFile(
        //    "/home/albert/programming/pretext/pretext-react-compiled-article/tmp/pretext/examples/sample-article/sample-article.xml",
        //    "utf-8"
        //);
        source = `<foo>a<b</foo>`;
        //source = `<foo><>bar</></foo>`

        lezerParsingDiagnosticsForString(source);
        console.log(lezerToXast(source))

        //console.time("lezer");
        //lezerToXast(source);
        //console.timeEnd("lezer");
        //console.time("lezer-only");
        //const tree = lezerXml.parser.parse(source);
        //const topNode = tree.topNode;
        //console.timeEnd("lezer-only");
        //console.time("lezer-to-ast");
        //lezerNodeToXastNode(topNode, source);
        //console.timeEnd("lezer-to-ast");

        //  console.time("xast")
        //       console.log("lezer", lezerToXast(source))
        // console.log("xast",  fromXml(source))
        //  console.timeEnd("xast")
        //  console.time("lezer parse only")
        //  lezerXml.parser.parse(source)
        //  console.timeEnd("lezer parse only")
        //  console.time("xml tools")
        //  xmlToolsParse(source)
        //  console.timeEnd("xml tools")

        //const { cst, tokenVector } = xmlToolsParse(source);
        //const ast = buildAst(cst as DocumentCstNode, tokenVector);
        //console.log("xml tools", ast);
        //console.log("converted",xmlToolsParseToXast(source));
        //console.log("xast", fromXml(source));
        //console.log(newBuildAst(cst as DocumentCstNode, tokenVector));
    });
});
