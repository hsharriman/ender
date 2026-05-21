import { ProofContent } from "../../geometry-object";
import { altint } from "../checker/reasonChecks/lineChecks";
import { ProofObj, Stmt } from "../types/checkerTypes";

/** Parent reason + dependency slot while backward-planning a child subgoal. */
export type ParentSlotContext = {
  reasonName: string;
  /** Statement function the parent rule will conclude (e.g. `para`, `con_ang`). */
  conclusionFn: string;
  /** Dependency slot type at this index (e.g. `con_ang`, `congruent_angs`). */
  depKey: string;
  /** Proof goal (used when the parent check relates a dep to the goal, e.g. `altint_conv`). */
  goal: Stmt;
};

export type ParentDepSlotCheck = (
  row: Stmt,
  parent: ParentSlotContext,
  proof: ProofObj,
  ctx: ProofContent,
) => boolean;

const diagramTransversals = (proof: ProofObj) =>
  proof.premises.diagramStatements.filter(
    (d) => d.statement.function === "transversal",
  );

/**
 * Geometry checks mirroring `checkReasonApplication` for “does this existing row
 * fill this dependency slot for the parent rule?” Register parent+dep keys here
 * when type-matching rows are not enough (wrong geometric instance).
 */
const PARENT_DEP_SLOT_CHECKS: Record<
  string,
  Partial<Record<string, ParentDepSlotCheck>>
> = {
  altint_conv: {
    con_ang: (row, parent, proof, ctx) =>
      diagramTransversals(proof).some((d) =>
        altint(row, d.statement, parent.goal, ctx),
      ),
  },
};

export const getParentDepSlotCheck = (
  reasonName: string,
  depKey: string,
): ParentDepSlotCheck | undefined =>
  PARENT_DEP_SLOT_CHECKS[reasonName]?.[depKey];

export const proofRowSatisfiesParentSlot = (
  row: Stmt,
  parent: ParentSlotContext,
  proof: ProofObj,
  ctx: ProofContent,
): boolean => {
  const check = getParentDepSlotCheck(parent.reasonName, parent.depKey);
  if (!check) return false;
  return check(row, parent, proof, ctx);
};
