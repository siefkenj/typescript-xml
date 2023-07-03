// Grammar for RELAX-NG Compact syntax
//X=datatype

topLevel
    = _
        start:(d:decl _ { return d; })*
        _
        rest:(_ x:(grammarContent / pattern / annotation) { return x; })*
        _ {
            return {
                type: "root",
                content: start.concat(rest) as [
                    ...typeof start,
                    ...typeof rest
                ],
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
            };
        }
    / "datatypes" WS name:identifierOrKeyword _ "=" _ content:literal {
            return {
                type: "declaration",
                declarationType: "datatypes",
                name,
                content,
            };
        }

pattern "pattern"
    = start:annotatedPatternPrimary rest:(_ "," _ x:pattern { return x; })+ {
            return { type: "group", content: [start].concat(rest) };
        }
    / start:annotatedPatternPrimary rest:(_ "&" _ x:pattern { return x; })+ {
            return { type: "interleave", content: [start].concat(rest) };
        }
    / start:annotatedPatternPrimary rest:(_ "|" _ x:pattern { return x; })+ {
            return { type: "choice", content: [start].concat(rest) };
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
                  }
                : content;
        }

patternSecondary
    = content:patternPrimary _ operation:("?" / "*" / "+") {
            return { type: "repeat", operation, content };
        }
    / patternPrimary

patternPrimary
    = "element" WS name:nameClass _ "{" _ content:pattern _ "}" {
            return { type: "element", name, content };
        }
    / "attribute" WS name:nameClass _ "{" _ content:pattern _ "}" {
            return { type: "attribute", name, content };
        }
    / "list" _ "{" _ content:pattern _ "}" {
            return { type: "list", name, content };
        }
    / "mixed" _ "{" _ content:pattern _ "}" {
            return { type: "mixed", name, content };
        }
    / "parent" WS name:identifier { return { type: "parentRef", name }; }
    / "empty" { return { type: "empty" }; }
    / "text" { return { type: "text" }; }
    / datatype
    / identifier
    / "notAllowed" { return { type: "notAllowed" }; }
    / "external" WS anyURILiteral _ inherit?
    / "grammar" _ "{" _ grammarContent* _ "}"
    / "(" _ p:pattern _ ")" { return p; }

datatype
    = name:datatypeName? _ content:datatypeValue {
            return { type: "datatype", name, content };
        }
    / name:datatypeName
        params:(_ "{" _ p:param* _ "}" { return p; })?
        _
        except:exceptPattern? {
            return { type: "datatype", name, params: params || [], except };
        }

param
    = a:annotations _ content:paramBase {
            return a.length > 0
                ? { type: "annotated", content, annotations: a }
                : content;
        }

paramBase "param" = identifierOrKeyword _ "=" _ literal

exceptPattern "exceptPattern"
    = "-" _ content:pattern { return { type: "except", content }; }

grammarContent
    = a:annotations _ content:grammarContentBase {
            return a.length > 0
                ? { type: "annotated", content, annotations: a }
                : content;
        }

grammarContentBase "grammarContent"
    = start
    / define
    / "div" _ "{" _ content:grammarContent* _ "}" {
            return { type: "div", content };
        }
    / "include"
        _
        uri:anyURILiteral
        _
        inherit:inherit?
        content:("{" _ x:includeContent* _ "}" { return x; })? {
            return { type: "include", uri, inherit, content: content || [] };
        }
    / annotationElement

includeContent
    = a:annotations _ content:includeContentBase {
            return a.length > 0
                ? { type: "annotated", content, annotations: a }
                : content;
        }

includeContentBase "includeContent"
    = define
    / start
    / "div" _ "{" _ content:includeContent* _ "}" {
            return { type: "div", content };
        }
    / annotationElement

start "start"
    = "start" _ operation:assignMethod _ content:pattern {
            return { type: "start", operation, content };
        }

define "define"
    = name:identifier _ operation:assignMethod _ content:pattern {
            return { type: "define", name, operation, content };
        }

assignMethod
    = "="
    / "|="
    / "&="

nameClass
    = start:annotatedNameClass
        rest:(_ "|" _ x:annotatedNameClass { return x; })* {
            return { type: "nameclassList", content: [start].concat(rest) };
        }

annotatedNameClass
    = a:annotations _ content:nameClassPrimary _ fa:followAnnotations? {
            return a.length > 0 || fa
                ? {
                      type: "annotated",
                      content,
                      annotations: a,
                      followAnnotations: fa || [],
                  }
                : content;
        }

nameClassPrimary
    = a:annotations _ content:nameClassPrimaryBase {
            return a.length > 0
                ? { type: "annotated", content, annotations: a }
                : content;
        }

nameClassPrimaryBase
    = name:anyName _ except:exceptNameClass? {
            return { type: "nameclass", name, except };
        }
    / name:nsName _ except:exceptNameClass? {
            return { type: "nameclass", name, except };
        }
    / name:name { return { type: "nameclass", name }; }
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

inherit "inherit" = "inherit" _ "=" _ identifierOrKeyword

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
            return { type: "literal", parts: [head].concat(rest) };
        }

literalSegment
    = "\"\"\"" value:$(!"\"\"\"" .)* "\"\"\"" {
            return { type: "literalSegment", escape: '"""', value };
        }
    / "'''" value:$(!"'''" .)* "'''" {
            return { type: "literalSegment", escape: "'''", value };
        }
    / "\"" value:$[^"\n]* "\"" {
            return { type: "literalSegment", escape: '"', value };
        }
    / "'" value:$[^'\n]* "'" {
            return { type: "literalSegment", escape: '"', value };
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

_ "whitespace" = [ \t\n\r]*

WS "whitespace" = [ \t\n\r]+

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
