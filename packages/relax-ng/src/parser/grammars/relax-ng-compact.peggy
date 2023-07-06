// Grammar for RELAX-NG Compact syntax

{
    const comments: {
        type: "comment";
        content: string;
        position: ReturnType<typeof location>;
    }[] = [];
    const includedComments = new Set<string>();
}

topLevel
    = _
        start:(d:decl _ { return d; })*
        _
        rest:(_ x:(grammarContent / pattern / annotation) { return x; })*
        _ {
            return {
                type: "root",
                content: start.concat(rest) as (
                    | (typeof start)[number]
                    | (typeof rest)[number]
                )[],
                comments,
                position: location(),
            };
        }

decl
    = "namespace"
        WS
        name:identifierOrKeyword
        _
        "="
        _
        content:namespaceURILiteral {
            return {
                type: "declaration",
                declarationType: "namespace",
                name,
                content,
                position: location(),
            };
        }
    / "default"
        WS
        "namespace"
        name:(WS x:identifierOrKeyword { return x; })?
        _
        "="
        _
        content:namespaceURILiteral {
            return {
                type: "declaration",
                declarationType: "defaultNamespace",
                name,
                content,
                position: location(),
            };
        }
    / "datatypes" WS name:identifierOrKeyword _ "=" _ content:literal {
            return {
                type: "declaration",
                declarationType: "datatypes",
                name,
                content,
                position: location(),
            };
        }

pattern "pattern"
    = start:annotatedPatternPrimary rest:(_ "," _ x:pattern { return x; })+ {
            return {
                type: "group",
                content: [start].concat(rest),
                position: location(),
            };
        }
    / start:annotatedPatternPrimary rest:(_ "&" _ x:pattern { return x; })+ {
            return {
                type: "interleave",
                content: [start].concat(rest),
                position: location(),
            };
        }
    / start:annotatedPatternPrimary rest:(_ "|" _ x:pattern { return x; })+ {
            return {
                type: "choice",
                content: [start].concat(rest),
                position: location(),
            };
        }
    / annotatedPatternPrimary

annotatedPatternPrimary
    = a:annotations _ content:patternSecondary _ fa:followAnnotations? {
            return a.length > 0 || fa
                ? {
                      type: "annotated",
                      content,
                      annotations: a,
                      followAnnotations: fa || [],
                      position: location(),
                  }
                : content;
        }

patternSecondary
    = content:patternPrimary _ operation:("?" / "*" / "+") {
            return { type: "repeat", operation, content, position: location() };
        }
    / patternPrimary

patternPrimary
    = "element" WS name:nameClass _ "{" _ content:pattern _ "}" {
            return { type: "element", name, content, position: location() };
        }
    / "attribute" WS name:nameClass _ "{" _ content:pattern _ "}" {
            return { type: "attribute", name, content, position: location() };
        }
    / "list" _ "{" _ content:pattern _ "}" {
            return { type: "list", content, position: location() };
        }
    / "mixed" _ "{" _ content:pattern _ "}" {
            return { type: "mixed", content, position: location() };
        }
    / "parent" WS name:identifier {
            return { type: "parentRef", name, position: location() };
        }
    / "empty" { return { type: "empty", position: location() }; }
    / "text" { return { type: "text", position: location() }; }
    / datatype
    / name:identifier { return { type: "ref", name, position: location() }; }
    / "notAllowed" { return { type: "notAllowed", position: location() }; }
    / "external" WS url:anyURILiteral _ inherit:inherit? {
            return {
                type: "external",
                content: url,
                inherit,
                position: location(),
            };
        }
    / "grammar" _ "{" _ content:grammarContent* _ "}" {
            return { type: "grammar", content, position: location() };
        }
    / "(" _ p:pattern _ ")" { return p; }

datatype
    = name:datatypeName? _ content:datatypeValue {
            return { type: "datatype", name, content, position: location() };
        }
    / name:datatypeName
        params:(_ "{" _ p:param* _ "}" { return p; })?
        _
        except:exceptPattern? {
            return {
                type: "datatypeExcept",
                name,
                params: params || [],
                except,
                position: location(),
            };
        }

param
    = a:annotations _ content:paramBase {
            return a.length > 0
                ? {
                      type: "annotated",
                      content,
                      annotations: a,
                      position: location(),
                  }
                : content;
        }

paramBase "param"
    = name:identifierOrKeyword _ "=" _ value:literal {
            return {
                type: "param",
                name,
                value,
                position: location(),
            };
        }

exceptPattern "exceptPattern"
    = "-" _ content:pattern {
            return { type: "except", content, position: location() };
        }

grammarContent
    = a:annotations _ content:grammarContentBase {
            return a.length > 0
                ? {
                      type: "annotated",
                      content,
                      annotations: a,
                      position: location(),
                  }
                : content;
        }

grammarContentBase "grammarContent"
    = start
    / define
    / "div" _ "{" _ content:grammarContent* _ "}" {
            return { type: "div", content, position: location() };
        }
    / "include"
        _
        uri:anyURILiteral
        _
        inherit:inherit?
        _
        content:("{" _ x:includeContent* _ "}" { return x; })? {
            return {
                type: "include",
                uri,
                inherit,
                content: content || [],
                position: location(),
            };
        }
    / annotationElement

includeContent
    = a:annotations _ content:includeContentBase {
            return a.length > 0
                ? {
                      type: "annotated",
                      content,
                      annotations: a,
                      position: location(),
                  }
                : content;
        }

includeContentBase "includeContent"
    = define
    / start
    / "div" _ "{" _ content:includeContent* _ "}" {
            return { type: "div", content, position: location() };
        }
    / annotationElement

start "start"
    = "start" _ operation:assignMethod _ content:pattern {
            return { type: "start", operation, content, position: location() };
        }

define "define"
    = name:identifier _ operation:assignMethod _ content:pattern {
            return {
                type: "define",
                name,
                operation,
                content,
                position: location(),
            };
        }

assignMethod
    = "="
    / "|="
    / "&="

nameClass
    = start:annotatedNameClass
        rest:(_ "|" _ x:annotatedNameClass { return x; })* {
            return {
                type: "nameclassList",
                content: [start].concat(rest),
                position: location(),
            };
        }

annotatedNameClass
    = a:annotations _ content:nameClassPrimary _ fa:followAnnotations? {
            return a.length > 0 || fa
                ? {
                      type: "annotated",
                      content,
                      annotations: a,
                      followAnnotations: fa || [],
                      position: location(),
                  }
                : content;
        }

nameClassPrimary
    = a:annotations _ content:nameClassPrimaryBase {
            return a.length > 0
                ? {
                      type: "annotated",
                      content,
                      annotations: a,
                      position: location(),
                  }
                : content;
        }

nameClassPrimaryBase
    = name:anyName _ except:exceptNameClass? {
            return {
                type: "nameclassExcept",
                name,
                except,
                position: location(),
            };
        }
    / name:nsName _ except:exceptNameClass? {
            return {
                type: "nameclassExcept",
                name,
                except,
                position: location(),
            };
        }
    / name:name { return { type: "nameclass", name, position: location() }; }
    / "(" _ x:nameClass _ ")" { return x; }

name
    = CName
    / identifierOrKeyword

exceptNameClass = "-" _ x:nameClassPrimary { return x; }

datatypeName "datatypeName"
    = CName
    / "string"
    / "token"

datatypeValue "datatypeValue" = literal

anyURILiteral "anyURILiteral" = literal

namespaceURILiteral "namespaceURILiteral"
    = literal
    / "inherit"

inherit "inherit" = "inherit" _ "=" _ @identifierOrKeyword

identifierOrKeyword "identifierOrKeyword"
    = identifier
    / keyword

identifier
    = $("\\" NCName)
    / $(&(keyword NCNameChar) NCName)
    / $(!keyword NCName)

CName = $(NCName ":" NCName)

nsName = $(NCName ":*")

anyName = "*"

literal "literal"
    = head:literalSegment rest:(_ "~" _ v:literal { return v; })* {
            return {
                type: "literal",
                parts: [head].concat(rest),
                position: location(),
            };
        }

literalSegment
    = "\"\"\"" value:$(!"\"\"\"" .)* "\"\"\"" {
            return {
                type: "literalSegment",
                escape: '"""',
                value,
                position: location(),
            };
        }
    / "'''" value:$(!"'''" .)* "'''" {
            return {
                type: "literalSegment",
                escape: "'''",
                value,
                position: location(),
            };
        }
    / "\"" value:$[^"\n]* "\"" {
            return {
                type: "literalSegment",
                escape: '"',
                value,
                position: location(),
            };
        }
    / "'" value:$[^'\n]* "'" {
            return {
                type: "literalSegment",
                escape: '"',
                value,
                position: location(),
            };
        }

followAnnotations
    = ">>"
        _
        head:annotationElement
        tail:(_ v:followAnnotations { return v; })* {
            return [head].concat(tail).flat();
        }

annotationAttributes
    = head:annotationAttribute rest:(_ v:annotationAttribute { return v; })* {
            return [head].concat(rest);
        }

annotationAttribute
    = n:name _ "=" _ v:literal {
            return {
                type: "annotationAttribute",
                name: n,
                value: v,
                position: location(),
            };
        }

annotationElement "annotationElement"
    = n:name
        _
        "["
        _
        c:(
            head:annotationContent
                tail:(WS+ v:annotationContent { return v; })* {
                    return [head].concat(tail);
                }
        )?
        _
        "]" {
            return {
                type: "annotationElement",
                name: n,
                content: c || [],
                position: location(),
            };
        }

annotation "annotation"
    = "["
        _
        c:(
            head:annotationContent
                tail:(
                    WS+ v:(annotationAttribute / annotationElement) {
                            return v;
                        }
                )* { return [head].concat(tail); }
        )?
        _
        "]" {
            return {
                type: "annotation",
                content: c || [],
                position: location(),
            };
        }

annotationContent
    = annotationAttribute
    / annotationElement
    / literal

annotations "annotations" = v:(documentation / annotation)* { return v.flat(); }

documentation
    = head:documentationLine
        tail:(
            [\n\r] _ t:(WS* v:documentationLine { return v; })* { return t; }
        )? { return [head].concat(tail || []); }

documentationLine
    = "##" "#"* [ \t]* v:$[^\n\r]* {
            return {
                type: "documentationLine",
                content: v,
                position: location(),
            };
        }

keyword
    = "attribute"
    / "default"
    / "datatypes"
    / "div"
    / "element"
    / "empty"
    / "external"
    / "grammar"
    / "include"
    / "inherit"
    / "list"
    / "mixed"
    / "namespace"
    / "notAllowed"
    / "parent"
    / "start"
    / "string"
    / "text"
    / "token"

separator
    = WS
    / "#" ([^\n\r#] [^\n\r]*)?

newline = [\n\r]+

_ "whitespace"
    = comment _
    / [ \t\n\r]*

WS "whitespace"
    = comment _
    / [ \t\n\r]+

comment
    = "#" &([^#] / EOL) c:$[^\n\r]* ([\n\r]+ / EOL) {
            const comment = {
                type: "comment",
                content: c,
                position: location(),
            };
            // Comments could be added multiple times as the tree is parsed. We only add
            // a comment one time. Even if a comment was added spuriously, it is still a comment
            // so it will be added by a successful parse.
            const commentHash = JSON.stringify(comment.position);
            if (!includedComments.has(commentHash)) {
                comments.push(comment);
                includedComments.add(commentHash);
            }
            return comment;
        }

EOL "EOL" = !.

// From https://github.com/FontoXML/fontoxpath
// MIT License
// Copyright (c) 2017 Fonto Group BV
// 235 Note: https://www.w3.org/TR/REC-xml-names/#NT-NCName
NCName = $(NCNameStartChar NCNameChar*)

NCNameStartChar "NCNameStartChar"
    = [A-Z_a-z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]
    / [\uD800-\uDB7F] [\uDC00-\uDFFF]

NCNameChar "NCNameChar"
    = NCNameStartChar
    / [\-\.0-9\xB7\u0300-\u036F\u203F\u2040]

// 237 Note: https://www.w3.org/TR/REC-xml/#NT-Char
Char
    = [\t\n\r -\uD7FF\uE000\uFFFD]
    / [\uD800-\uDBFF]
        [\uDC00-\uDFFF] /* any Unicode character, excluding the surrogate blocks, FFFE, and FFFF. */
