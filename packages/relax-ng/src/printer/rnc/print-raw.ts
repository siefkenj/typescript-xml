import {
    AnnotationAttribute,
    DocumentationLine,
    Literal,
    NameClass,
    Param,
    TopLevel,
} from "../../parser/grammars/relax-ng-compact-types";

type Node =
    | TopLevel
    | TopLevel["content"][number]
    | NameClass
    | NameClass["content"][number]
    | Literal
    | Literal["parts"][number]
    | DocumentationLine
    | AnnotationAttribute
    | Param;

/**
 * Whether the content of `node` needs wrapping in parenthesis when an operation is applied to it.
 * E.g. `foo` needs no wrapping, but `foo | bar` needs wrapping.
 */
function needsParentheses(node: Node): boolean {
    switch (node.type) {
        case "group":
        case "choice":
        case "interleave":
            return true;

        case "nameclassList":
            return node.content.length > 1;
    }
    return false;
}


/**
 * Print the RNC AST to a string with as little formatting as possible.
 */
export function printRaw(node: Node | string): string {
    if (typeof node === "string") {
        return node;
    }
    const type = node.type;
    switch (type) {
        case "annotated": {
            let annotations = "";
            const content = printRaw(node.content);
            if (node.annotations.length > 0) {
                annotations = node.annotations.map(printRaw).join("\n");
            }
            if (annotations.length > 0 && !annotations.endsWith("\n")) {
                annotations += "\n";
            }
            let followAnnotations = "";
            if (
                Array.isArray(node.followAnnotations) &&
                node.followAnnotations.length > 0
            ) {
                followAnnotations =
                    " >> " + node.followAnnotations.map(printRaw).join(" >> ");
            }
            return `${annotations}${content}${followAnnotations}`;
        }
        case "annotation": {
            const content = node.content.map(printRaw).join(" ");
            if (content.length === 0) {
                return "[]";
            }
            return `[ ${content} ]`;
        }
        case "param":
        // Fallthrough on purpose
        case "annotationAttribute": {
            return `${node.name}=${printRaw(node.value)}`;
        }
        case "annotationElement": {
            let content = node.content.map(printRaw).join(" ");
            if (content.length === 0) {
                content = "[]";
            } else {
                content = ` [ ${content} ]`;
            }

            return `${node.name}${content}`;
        }
        case "attribute": {
            const name = printRaw(node.name);
            let content = printRaw(node.content);
            if (content.length > 0) {
                content = ` ${content} `;
            }
            return `attribute ${name} {${content}}`;
        }
        case "choice": {
            const content = node.content.map(printRaw).join(" | ");
            return content;
        }
        case "datatype": {
            const content = printRaw(node.content);
            if (node.name) {
                return `${node.name} ${content}`;
            }
            return content;
        }
        case "datatypeExcept": {
            let params = "";
            if (node.params.length > 0) {
                params = ` { ${node.params.map(printRaw).join(" ")} }`;
            }
            let except = "";
            if (node.except) {
                let pattern = printRaw(node.except.content);
                if (needsParentheses(node.except.content)) {
                    pattern = `(${pattern})`;
                }
                except = ` - ${pattern}`;
            }
            return `${node.name}${params}${except}`;
        }
        case "declaration": {
            const content = printRaw(node.content);
            const name = node.name ? node.name + " " : "";
            switch (node.declarationType) {
                case "datatypes":
                    return `datatypes ${name}= ${content}`;
                case "defaultNamespace":
                    return `default namespace ${name}= ${content}`;
                case "namespace":
                    return `namespace ${name}= ${content}`;
            }
        }
        case "define": {
            const content = printRaw(node.content);
            return `${node.name} = ${content}`;
        }
        case "div": {
            const content = node.content.map(printRaw).join("\n");
            return `div { ${content} }`;
        }
        case "documentationLine": {
            return `## ${node.content}`;
        }
        case "element": {
            const name = printRaw(node.name);
            let content = printRaw(node.content);
            if (content.length > 0) {
                content = ` ${content} `;
            }
            return `element ${name} {${content}}`;
        }
        case "empty": {
            return "empty";
        }
        case "external": {
            const content = printRaw(node.content);
            if (node.inherit != null) {
                return `external ${content} inherit = ${node.inherit}`;
            }
            return `external ${content}`;
        }
        case "grammar": {
            const content = node.content.map(printRaw).join("\n");
            return `grammar { ${content} }`;
        }
        case "group": {
            const content = node.content.map(printRaw).join(", ");
            return content;
        }
        case "include": {
            const content = node.content.map(printRaw).join("\n");
            const uri = printRaw(node.uri);
            const inherit =
                node.inherit != null ? ` inherit = ${node.inherit}` : "";
            if (content.length === 0) {
                return `include ${uri}${inherit}`;
            }
            return `include ${uri}${inherit} { ${content} }`;
        }
        case "interleave": {
            const content = node.content.map(printRaw).join(" & ");
            return content;
        }
        case "list": {
            const content = printRaw(node.content);
            return `list { ${content} }`;
        }
        case "mixed": {
            let content = printRaw(node.content);
            if (content.length > 0) {
                content = ` ${content} `;
            }
            return `mixed {${content}}`;
        }
        case "notAllowed":
            return "notAllowed";
        case "parentRef": {
            return `parent ${node.name}`;
        }
        case "ref": {
            return node.name;
        }
        case "repeat": {
            const content = printRaw(node.content);
            if (needsParentheses(node.content)) {
                return `(${content})${node.operation}`;
            }
            return `${content}${node.operation}`;
        }
        case "root": {
            return node.content.map(printRaw).join("\n");
        }
        case "start": {
            const content = printRaw(node.content);
            return `start ${node.operation} ${content}`;
        }
        case "text": {
            return "text";
        }
        case "nameclassList": {
            return node.content.map(printRaw).join(" | ");
        }
        case "nameclass": {
            return node.name;
        }
        case "nameclassExcept": {
            if (!node.except) {
                return node.name;
            }
            let except = printRaw(node.except);
            if (needsParentheses(node.except)) {
                except = `(${except})`;
            }
            return `${node.name} - ${except}`;
        }
        case "literal": {
            return node.parts.map(printRaw).join(" ~ ");
        }
        case "literalSegment": {
            return `${node.escape}${node.value}${node.escape}`;
        }
        default: {
            const unhandledType: never = type;
            console.warn(`Unhandled type: ${unhandledType}`);
        }
    }

    return "";
}
