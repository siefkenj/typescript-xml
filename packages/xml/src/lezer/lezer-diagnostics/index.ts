import { Tree, SyntaxNode } from "@lezer/common";
import * as lezerXml from "@lezer/xml";
import { Element } from "xast";
import { extractContent } from "../lezer-to-xast/lezer-to-xast-utils";
import { lezerNodeToXastNodeWithoutChildren } from "../lezer-to-xast/lezer-to-xast-without-children";

/**
 * Get any parsing errors/warnings that come from lezer.
 */
export function lezerParsingDiagnosticsForString(source: string) {
    const tree = lezerXml.parser.parse(source);
    return lezerParsingDiagnostics(tree, source);
}

/**
 * Get any parsing errors/warnings that are stored in `tree`.
 */
export function lezerParsingDiagnostics(tree: Tree, source: string) {
    let cursor = tree.cursor();
    do {
        if (cursor.type.isError || cursor.name === "MissingCloseTag") {
            const node = cursor.node;

            console.log(
                "Found error",
                node.name,
                "" + node,
                "" + node.parent,
                node.from,
                node.to,
                describeError(node, source)
            );
        }
    } while (cursor.next());
}

function describeError(errorNode: SyntaxNode, source: string) {
    if (errorNode.name === "MissingCloseTag") {
        let message = "Missing closing tag";
        if (errorNode.parent) {
            // Parent must be an Element if we have a missing closing tag.
            const xastParent = lezerNodeToXastNodeWithoutChildren(
                errorNode.parent,
                source
            ) as Element;
            if (xastParent) {
                message = `Tag \`<${xastParent.name} ...>\` is missing a closing tag. Is it supposed to be self-closing? \`<${xastParent.name} ... />\``;
            }
        }
        return message;
    }
    if (errorNode.name === "⚠") {
        let message = "Syntax error";
        if (extractContent(errorNode, source) === "<") {
            // Something is here that doesn't define a node.
            const remainingSource = source.slice(errorNode.from);
            if (remainingSource.startsWith("<!ENTITY")) {
                message = "SGML `<!ENTITY ... >` declarations are not allowed.";
            } else if (remainingSource.startsWith("<!")) {
                message = "Invalid `<!...` declaration";
            }
        }
        if (errorNode.parent) {
            switch (errorNode.parent.name) {
                case "AttributeValue": {
                    // In this case, we have something like `<foo bar=baz ...`
                    // where the attribute value is not quoted correctly.
                    message = "Invalid attribute value";
                    const attributeValue = errorNode.parent;
                    const attribute = errorNode.parent.parent;
                    if (!attribute) {
                        console.warn("Could not find attribute parent");
                        return message;
                    }
                    const validationMessage = validateAttributeValue(
                        extractContent(attributeValue, source)
                    );
                    if (validationMessage) {
                        message = validationMessage;
                    }
                    return message;
                }
                case "Attribute": {
                    // In this case, we have something like `<foo bar"baz" ... />` or `<foo bar />`
                    // where the attribute is not assigned a value.
                    message = "Attribute not assigned a value";
                    const attribute = errorNode.parent;
                    const attributeString = extractContent(attribute, source);
                    if (attributeString) {
                        message = `The attribute \`${attributeString}\` is not assigned a value`;
                    }
                    return message;
                }
                case "OpenTag": {
                    // `a < b`. The user probably was trying to type `&lt;` instead of `<`
                    const openTag = errorNode.parent;
                    if (openTag.getChild("StartTag")) {
                        const tag = openTag.getChild("TagName");
                        if (tag) {
                            message = `Incomplete tag \`<${extractContent(
                                tag,
                                source
                            )} ...\`. `;
                        } else {
                            message = "Incomplete tag. ";
                        }
                        message +=
                            "Did you forget to close it? Or did you mean to use `&lt;` to get the `<` symbol?";
                        return message;
                    }
                }
            }
        }
        return message;
    }
}

function validateAttributeValue(value: string): string {
    if (!value.startsWith('"') || !value.endsWith('"')) {
        return `The attribute value \`${value}\` must start and end with a quote`;
    }
    return "";
}
