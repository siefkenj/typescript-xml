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
type Comment = TopLevel["comments"][number];

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
 * Print the RNC AST to a string with as little formatting as possible. If `comments` is provided
 * and the nodes have `position` information, comments will be inserted. The supplied `comments` array will be mutated.
 */
export function printRaw(node: Node | string, comments?: Comment[]): string {
    const printRawBound = (node: Node | string) => {
        // Find all comments that are before the current node
        let leadingComments: string[] = [];
        if (
            Array.isArray(comments) &&
            comments.length > 0 &&
            comments[0].position &&
            typeof node !== "string"
        ) {
            const nodePosition = node.position;
            const commentsBefore: Comment[] = [];
            while (
                comments.length > 0 &&
                comments[0].position.end.offset <= nodePosition.start.offset
            ) {
                commentsBefore.push(comments.shift()!);
            }
            leadingComments = commentsBefore.map((x) => `#${x.content}\n`);
        }
        let printedNodes = printRaw(node, comments);
        return `${leadingComments.join("")}${printedNodes}`;
    };

    if (typeof node === "string") {
        return node;
    }
    const type = node.type;
    switch (type) {
        case "annotated": {
            let annotations = "";
            const content = printRawBound(node.content);
            if (node.annotations.length > 0) {
                annotations = node.annotations.map(printRawBound).join("\n");
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
                    " >> " +
                    node.followAnnotations.map(printRawBound).join(" >> ");
            }
            return `${annotations}${content}${followAnnotations}`;
        }
        case "annotation": {
            const content = node.content.map(printRawBound).join(" ");
            if (content.length === 0) {
                return "[]";
            }
            return `[ ${content} ]`;
        }
        case "param":
        // Fallthrough on purpose
        case "annotationAttribute": {
            return `${node.name}=${printRawBound(node.value)}`;
        }
        case "annotationElement": {
            let content = node.content.map(printRawBound).join(" ");
            if (content.length === 0) {
                content = "[]";
            } else {
                content = ` [ ${content} ]`;
            }

            return `${node.name}${content}`;
        }
        case "attribute": {
            const name = printRawBound(node.name);
            let content = printRawBound(node.content);
            if (content.length > 0) {
                content = ` ${content} `;
            }
            return `attribute ${name} {${content}}`;
        }
        case "choice": {
            const content = node.content.map(printRawBound).join(" | ");
            return content;
        }
        case "datatype": {
            const content = printRawBound(node.content);
            if (node.name) {
                return `${node.name} ${content}`;
            }
            return content;
        }
        case "datatypeExcept": {
            let params = "";
            if (node.params.length > 0) {
                params = ` { ${node.params.map(printRawBound).join(" ")} }`;
            }
            let except = "";
            if (node.except) {
                let pattern = printRawBound(node.except.content);
                if (needsParentheses(node.except.content)) {
                    pattern = `(${pattern})`;
                }
                except = ` - ${pattern}`;
            }
            return `${node.name}${params}${except}`;
        }
        case "declaration": {
            const content = printRawBound(node.content);
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
            const content = printRawBound(node.content);
            return `${node.name} = ${content}`;
        }
        case "div": {
            const content = node.content.map(printRawBound).join("\n");
            return `div { ${content} }`;
        }
        case "documentationLine": {
            return `## ${node.content}`;
        }
        case "element": {
            const name = printRawBound(node.name);
            let content = printRawBound(node.content);
            if (content.length > 0) {
                content = ` ${content} `;
            }
            return `element ${name} {${content}}`;
        }
        case "empty": {
            return "empty";
        }
        case "external": {
            const content = printRawBound(node.content);
            if (node.inherit != null) {
                return `external ${content} inherit = ${node.inherit}`;
            }
            return `external ${content}`;
        }
        case "grammar": {
            const content = node.content.map(printRawBound).join("\n");
            return `grammar { ${content} }`;
        }
        case "group": {
            const content = node.content.map(printRawBound).join(", ");
            return content;
        }
        case "include": {
            const content = node.content.map(printRawBound).join("\n");
            const uri = printRawBound(node.uri);
            const inherit =
                node.inherit != null ? ` inherit = ${node.inherit}` : "";
            if (content.length === 0) {
                return `include ${uri}${inherit}`;
            }
            return `include ${uri}${inherit} { ${content} }`;
        }
        case "interleave": {
            const content = node.content.map(printRawBound).join(" & ");
            return content;
        }
        case "list": {
            const content = printRawBound(node.content);
            return `list { ${content} }`;
        }
        case "mixed": {
            let content = printRawBound(node.content);
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
            const content = printRawBound(node.content);
            if (needsParentheses(node.content)) {
                return `(${content})${node.operation}`;
            }
            return `${content}${node.operation}`;
        }
        case "root": {
            // The comments array will be mutated, so we make a copy
            comments = [...node.comments];
            // `printRawBound` already references the `comments` variable like it's a global,
            // so we don't need to pass it in and instead can use `printRawBound` directly.
            let ret = node.content.map(printRawBound).join("\n");
            // By now all comments that occur before a node have been printed, but we
            // need to handle comments that occur after the last node.
            let trailingComments = comments
                .map((x) => `\n#${x.content}`)
                .join("");
            return ret + trailingComments;
        }
        case "start": {
            const content = printRawBound(node.content);
            return `start ${node.operation} ${content}`;
        }
        case "text": {
            return "text";
        }
        case "nameclassList": {
            return node.content.map(printRawBound).join(" | ");
        }
        case "nameclass": {
            return node.name;
        }
        case "nameclassExcept": {
            if (!node.except) {
                return node.name;
            }
            let except = printRawBound(node.except);
            if (needsParentheses(node.except)) {
                except = `(${except})`;
            }
            return `${node.name} - ${except}`;
        }
        case "literal": {
            return node.parts.map(printRawBound).join(" ~ ");
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
