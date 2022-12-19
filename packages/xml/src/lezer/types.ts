import * as Xast from "xast";

export type LezerSyntaxNodeName =
    | "Document"
    | "DoctypeDecl"
    | "Text"
    | "EntityReference"
    | "CharacterReference"
    | "Cdata"
    | "Element"
    | "Comment"
    | "ProcessingInst"
    | "MismatchedCloseTag"
    | "Element"
    | "OpenTag"
    | "SelfClosingTag"
    | "CloseTag"
    | "MismatchedCloseTag"
    | "MissingCloseTag"
    | "Attribute"
    | "AttributeValue"
    | "AttributeName"
    | "Comment"
    | "EndTag"
    | "SelfCloseEndTag"
    | "TagName"
    | "Is"
    | "StartTag"
    | "Text"
    | "⚠";

export type XastNode =
    | Xast.Attributes
    | Xast.Cdata
    | Xast.Comment
    | Xast.Doctype
    | Xast.Element
    | Xast.Instruction
    | Xast.Root
    | Xast.Text;
export type Position = Xast.Node["position"] & {};
