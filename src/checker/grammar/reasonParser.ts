import { ReasonDefinition } from "../types/checkerTypes";
import { REASONS_DEFS } from "./defs/reasons.defs";

/** Loads reason defs from bundled `reasons.defs.ts` (source of truth). */
export const loadReasonDefinitions = (): Map<string, ReasonDefinition> => {
  return new Map<string, ReasonDefinition>(
    Object.entries(REASONS_DEFS).map(([k, v]) => [
      k,
      v as unknown as ReasonDefinition,
    ]),
  );
};

/** Special-cased in validators / reasonApplication (refs premises `[g_nn]`). */
export const GIVEN_REASON_DEFINITION: ReasonDefinition = {
  name: "given",
  dependencies: ["__given_premise__"],
  conclusion: "__any__",
};

export const loadReasonDefinitionsWithBuiltins = (): Map<
  string,
  ReasonDefinition
> => {
  const reasons = loadReasonDefinitions();
  if (!reasons.has("given")) reasons.set("given", GIVEN_REASON_DEFINITION);
  return reasons;
};
