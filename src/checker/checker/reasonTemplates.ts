import { ReasonDefinition } from "../types/checkerTypes";

// TODO file is heavily vibe coded, needs to be checked and cleaned.

// A slot describes one required input for a reason, either from cited dependencies
// or from diagram-derived dependencies.
export interface ReasonTemplateSlot {
  id: string;
  expectedType: string;
  source: "dependency" | "diagram";
}

// Template representation used by ways-to-prove enumeration.
export interface ReasonTemplate {
  id: string;
  slots: ReasonTemplateSlot[];
}

// Converts reason definitions into normalized slots so downstream code can enumerate
// candidate dependency combinations without special-casing each reason.
const toReasonTemplateSlots = (
  definition: ReasonDefinition,
): ReasonTemplateSlot[] => {
  const depSlots = definition.dependencies.map((dep, idx) => ({
    id: `dep_${idx}`,
    expectedType: typeof dep === "string" ? dep : dep.name,
    source: "dependency" as const,
  }));
  const diagramSlots = (definition.diagramDependencies ?? []).map(
    (dep, idx) => ({
      id: `diagram_${idx}`,
      expectedType: typeof dep === "string" ? dep : dep.name,
      source: "diagram" as const,
    }),
  );
  return [...depSlots, ...diagramSlots];
};

// Builds a template map keyed by reason function name.
export const buildReasonTemplateMap = (
  reasonDefs: Map<string, ReasonDefinition>,
): Map<string, ReasonTemplate> => {
  const templates = new Map<string, ReasonTemplate>();
  reasonDefs.forEach((definition, fn) => {
    templates.set(fn, {
      id: fn,
      slots: toReasonTemplateSlots(definition),
    });
  });
  return templates;
};
