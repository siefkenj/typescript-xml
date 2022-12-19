import * as lezerXml from "@lezer/xml";
import { lezerNodeToXastNode } from "./lezer-to-xast";

/**
 * Parse the xml string `source` into a XAST ast via the lezer parser.
 * If you have already parsed via lezer and you wish to convert lezer's `Tree`
 * into a XAST format, use `lezerNodeToXastNode` instead.
 */
export function lezerToXast(source: string) {
    const tree = lezerXml.parser.parse(source);
    const topNode = tree.topNode;
    return lezerNodeToXastNode(topNode, source);
}

export { lezerNodeToXastNode, lezerXml };
