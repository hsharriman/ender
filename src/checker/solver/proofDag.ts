import { Obj, ParseObj } from "../../geometry-object";
import { stmtToString } from "../proofToString";
import { ProofObj, Stmt } from "../types/checkerTypes";

/** Stable id for merging logically equivalent statements in the DAG. */
export type FactId = string;

/** Diagram premise only; named text premises (g_n) are used only via `given(g_n)` inferences. */
export type PremiseIncoming = { kind: "premise"; ref: string };

export type InferenceIncoming = {
  kind: "inference";
  stepRef: string;
  reasonFn: string;
  reasonArgs: string[];
  /** Canonical ids of dependency facts (from cited steps / premises). */
  dependencyFactIds: FactId[];
};

export type IncomingEdge = PremiseIncoming | InferenceIncoming;

export type FactNode = {
  id: FactId;
  statement: Stmt;
  /** Human-readable statement (DSL-style). */
  display: string;
  /** Incoming edges: diagram premises and/or proof inferences. */
  incoming: IncomingEdge[];
};

export type ProofDag = {
  nodes: Map<FactId, FactNode>;
  /** Canonical id of the goal statement, if present. */
  goalFactId?: FactId;
};

const orderedChars = (value: string) =>
  value
    .split("")
    .sort((left, right) => left.localeCompare(right))
    .join("");

const angleKey = (value: string) =>
  value.length >= 3
    ? `${value[1]}:${orderedChars(`${value[0]}${value[value.length - 1]}`)}`
    : value;

const argKey = (arg: ParseObj) => {
  if (arg.type === Obj.Segment || arg.type === Obj.Triangle) {
    return `${arg.type}:${orderedChars(arg.v)}`;
  }
  if (arg.type === Obj.Angle) return `${arg.type}:${angleKey(arg.v)}`;
  return `${arg.type}:${arg.v}`;
};

/** Maps equivalent statements (incl. symmetric binary pairs) to one id. */
export const canonicalFactId = (stmt: Stmt): FactId => {
  const fn = stmt.function;
  const args = stmt.arguments ?? [];
  if (
    args.length === 2 &&
    args[0].type === args[1].type &&
    argKey(args[0]) !== argKey(args[1])
  ) {
    const left = argKey(args[0]);
    const right = argKey(args[1]);
    const pair = left < right ? `${left};${right}` : `${right};${left}`;
    return `${fn}::${pair}`;
  }
  return `${fn}::${args.map(argKey).join(";")}`;
};

const ensureNode = (
  nodes: Map<FactId, FactNode>,
  id: FactId,
  stmt: Stmt,
): FactNode => {
  let node = nodes.get(id);
  if (!node) {
    node = {
      id,
      statement: stmt,
      display: stmtToString(stmt),
      incoming: [],
    };
    nodes.set(id, node);
  }
  return node;
};

const premiseIncomingExists = (node: FactNode, ref: string) =>
  node.incoming.some((e) => e.kind === "premise" && e.ref === ref);

const collectRefToStmt = (proof: ProofObj): Map<string, Stmt> => {
  const refToStmt = new Map<string, Stmt>();
  for (const step of proof.steps) {
    if (step.statement && step.stepNumber)
      refToStmt.set(step.stepNumber, step.statement);
  }
  for (const diag of proof.premises.diagramStatements) {
    refToStmt.set(diag.stepNumber, diag.statement);
  }
  return refToStmt;
};

const depFactIds = (
  reasonArgs: string[],
  refToStmt: Map<string, Stmt>,
): FactId[] => {
  const out: FactId[] = [];
  for (const ref of reasonArgs) {
    const depStmt = refToStmt.get(ref);
    if (depStmt) out.push(canonicalFactId(depStmt));
  }
  return out;
};

/**
 * Builds a proof DAG: one node per canonical fact, with all incoming edges.
 * Text premises (g_n) are not modeled as incoming edges; they appear only as
 * citations on `given(g_n)` inference steps. Diagram premises (d_n) get `premise` edges.
 */
export const buildProofDag = (proof: ProofObj): ProofDag => {
  const nodes = new Map<FactId, FactNode>();
  const refToStmt = collectRefToStmt(proof);

  for (const diag of proof.premises.diagramStatements) {
    const id = canonicalFactId(diag.statement);
    const node = ensureNode(nodes, id, diag.statement);
    if (!premiseIncomingExists(node, diag.stepNumber)) {
      node.incoming.push({ kind: "premise", ref: diag.stepNumber });
    }
  }

  for (const step of proof.steps) {
    if (step.type !== "proof" || !step.statement || !step.stepNumber) continue;
    if (!step.reason) continue;

    const id = canonicalFactId(step.statement);
    const node = ensureNode(nodes, id, step.statement);
    const reasonArgs = step.reason.arguments ?? [];
    node.incoming.push({
      kind: "inference",
      stepRef: step.stepNumber,
      reasonFn: step.reason.function,
      reasonArgs: [...reasonArgs],
      dependencyFactIds: depFactIds(reasonArgs, refToStmt),
    });
  }

  const goalStmt =
    proof.steps.find((s) => s.type === "goal" && s.statement)?.statement ??
    proof.goal;
  const goalFactId = goalStmt ? canonicalFactId(goalStmt) : undefined;
  if (goalFactId && !nodes.has(goalFactId) && goalStmt) {
    ensureNode(nodes, goalFactId, goalStmt);
  }

  return { nodes, goalFactId };
};

const yamlStr = (s: string) => JSON.stringify(s);

/** LLM-oriented DAG dump: explicit keys, stable order, ASCII-only. */
export const prettyPrintProofDag = (dag: ProofDag): string => {
  const out: string[] = [];
  const push = (...lines: string[]) => out.push(...lines);

  push(
    "# proof_dag structured_text_v1 (YAML-like; safe to parse line-by-line)",
  );
  push("# Schema: top-level goal_fact_id, node_count, then facts[] each with");
  push(
    "#   id, statement, is_goal, incoming[] (diagram premise | inference).",
  );
  push(
    "# Inference edges include cited_step_refs, dependency_fact_ids, and when lengths",
  );
  push(
    "# match, citation_map pairs each step ref to the canonical fact id of that step.",
  );
  push(`goal_fact_id: ${dag.goalFactId ? yamlStr(dag.goalFactId) : "null"}`);
  push(`node_count: ${dag.nodes.size}`);
  push("");

  const nodes = [...dag.nodes.values()];
  const goalId = dag.goalFactId;
  nodes.sort((left, right) => {
    if (goalId) {
      const lg = left.id === goalId ? 0 : 1;
      const rg = right.id === goalId ? 0 : 1;
      if (lg !== rg) return lg - rg;
    }
    return left.id.localeCompare(right.id);
  });

  push("facts:");
  for (const node of nodes) {
    push("  -");
    push(`    id: ${yamlStr(node.id)}`);
    push(`    statement: ${yamlStr(node.display)}`);
    push(`    is_goal: ${goalId === node.id}`);
    push(`    incoming_count: ${node.incoming.length}`);
    push("    incoming:");

    if (node.incoming.length === 0) {
      push("      []");
      push("");
      continue;
    }

    let edgeIdx = 0;
    for (const edge of node.incoming) {
      push("      -");
      push(`        edge_index: ${edgeIdx++}`);
      if (edge.kind === "premise") {
        push(`        kind: premise`);
        push(`        premise_label: ${yamlStr(edge.ref)}`);
        continue;
      }

      push(`        kind: inference`);
      push(`        proof_step: ${yamlStr(edge.stepRef)}`);
      push(`        reason: ${yamlStr(edge.reasonFn)}`);
      push("        cited_step_refs:");
      if (edge.reasonArgs.length === 0) {
        push("          []");
        push(
          '        note: "no numbered step arguments; checker may use diagram premises only."',
        );
      } else {
        for (const ref of edge.reasonArgs) {
          push(`          - ${yamlStr(ref)}`);
        }
      }

      push("        dependency_fact_ids:");
      if (edge.dependencyFactIds.length === 0) {
        push("          []");
      } else {
        for (const depId of edge.dependencyFactIds) {
          push(`          - ${yamlStr(depId)}`);
        }
      }

      if (
        edge.reasonArgs.length > 0 &&
        edge.reasonArgs.length === edge.dependencyFactIds.length
      ) {
        push("        citation_map:");
        for (let i = 0; i < edge.reasonArgs.length; i++) {
          push("          -");
          push(`            step_ref: ${yamlStr(edge.reasonArgs[i])}`);
          push(`            fact_id: ${yamlStr(edge.dependencyFactIds[i])}`);
        }
      }
    }
    push("");
  }

  return out.join("\n").replace(/\n+$/, "\n");
};
