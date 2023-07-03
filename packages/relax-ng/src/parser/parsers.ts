// This file needs to be here because typescript does not know how to use babel's transpiler
// to directly load Pegjs grammars.
// @ts-nocheck
import { TopLevel } from "./grammars/relax-ng-compact-types";
import * as _RelaxNgCompactPegParser from "./grammars/relax-ng-compact.peggy";
import { allowedStartRules } from "./relax-ng-compact-allowed-start-rules";

type RelaxNgCompactParser = {
    parse: (
        input: string | unknown[],
        options?: { startRule: (typeof allowedStartRules)[number] }
    ) => TopLevel;
    SyntaxError: (
        message: string,
        expected: string,
        found: unknown,
        location: unknown
    ) => unknown;
};

const RelaxNgCompactPegParser =
    _RelaxNgCompactPegParser as RelaxNgCompactParser;

export { RelaxNgCompactPegParser };
