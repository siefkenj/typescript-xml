type HasPosition = { content?: HasPosition[] | unknown; position?: any };

/**
 * Remove the position property from all nodes in the AST.
 */
export function stripPosition<T extends HasPosition>(obj: T) {
    if (typeof obj !== "object" || obj === null) {
        return;
    }
    delete obj.position;
    for (const key in obj) {
        if (Array.isArray(obj[key])) {
            (obj[key] as any).map(stripPosition);
        } else if (typeof obj[key] === "object") {
            stripPosition(obj[key] as any);
        }
    }
}
