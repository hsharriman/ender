import { useMemo, useState } from "react";
import {
  SolutionTreeJson,
  SolverFactJson,
  SolverResult,
} from "../../../solver/solverTypes";

/**
 * Floating panel showing solver metadata: phase timings and cost counters,
 * the AND-OR solution tree rooted at the goal (facts as boxes, each
 * derivation as a labeled reason pill fanning out to its dependencies), and
 * the extracted verified solutions.
 */

interface SolverPanelProps {
  result: SolverResult | null;
  running: boolean;
  onClose: () => void;
}

const FACT_W = 168;
const FACT_H = 36;
const H_GAP = 26;
const LEVEL_H = 108;
const MARGIN = 24;

interface TreeLayout {
  factPos: Map<string, { x: number; y: number }>;
  pills: Array<{
    id: string;
    x: number;
    y: number;
    reason: string;
    factId: string;
    deps: string[];
    diagramRefs: string[];
  }>;
  width: number;
  height: number;
  facts: SolverFactJson[];
}

/** Layered layout: goal on top, dependencies below their consumers. */
const layoutTree = (tree: SolutionTreeJson): TreeLayout | null => {
  const byId = new Map(tree.facts.map((f) => [f.id, f]));
  const shown = tree.facts.filter((f) => f.inGoalCone);
  if (shown.length === 0 || !tree.goalFactId) return null;

  // Longest-path level assignment over the cone (derivations form a DAG).
  const level = new Map<string, number>();
  const assign = (id: string, lv: number) => {
    if ((level.get(id) ?? -1) >= lv) return;
    level.set(id, lv);
    const fact = byId.get(id);
    fact?.derivations.forEach((d) =>
      d.deps.forEach((dep) => assign(dep, lv + 1)),
    );
  };
  assign(tree.goalFactId, 0);

  // Order facts inside each level by first-visit (DFS) order.
  const byLevel = new Map<number, string[]>();
  const seen = new Set<string>();
  const dfs = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    const lv = level.get(id) ?? 0;
    const row = byLevel.get(lv);
    if (row) row.push(id);
    else byLevel.set(lv, [id]);
    byId.get(id)?.derivations.forEach((d) => d.deps.forEach(dfs));
  };
  dfs(tree.goalFactId);

  const maxLevel = Math.max(...[...byLevel.keys()]);
  const maxRow = Math.max(...[...byLevel.values()].map((r) => r.length));
  const width = Math.max(maxRow * (FACT_W + H_GAP) + 2 * MARGIN, 480);
  const height = (maxLevel + 1) * LEVEL_H + FACT_H + 2 * MARGIN;

  const factPos = new Map<string, { x: number; y: number }>();
  byLevel.forEach((row, lv) => {
    const rowWidth = row.length * (FACT_W + H_GAP) - H_GAP;
    const startX = (width - rowWidth) / 2;
    row.forEach((id, i) => {
      factPos.set(id, {
        x: startX + i * (FACT_W + H_GAP),
        y: MARGIN + lv * LEVEL_H,
      });
    });
  });

  const pills: TreeLayout["pills"] = [];
  for (const id of seen) {
    const fact = byId.get(id);
    const pos = factPos.get(id);
    if (!fact || !pos) continue;
    const n = fact.derivations.length;
    fact.derivations.forEach((d, di) => {
      const depXs = d.deps
        .map((dep) => factPos.get(dep))
        .filter((p): p is { x: number; y: number } => Boolean(p))
        .map((p) => p.x + FACT_W / 2);
      const anchorX =
        depXs.length > 0
          ? depXs.reduce((a, b) => a + b, 0) / depXs.length
          : pos.x + FACT_W / 2;
      const spread = (di - (n - 1) / 2) * 64;
      pills.push({
        id: `${id}-${di}`,
        x: (pos.x + FACT_W / 2 + anchorX) / 2 + spread,
        y: pos.y + FACT_H + (LEVEL_H - FACT_H) / 2,
        reason: d.reason,
        factId: id,
        deps: d.deps,
        diagramRefs: d.diagramRefs,
      });
    });
  }

  return {
    factPos,
    pills,
    width,
    height,
    facts: shown.filter((f) => seen.has(f.id)),
  };
};

const factFill = (f: SolverFactJson): string =>
  f.source === "given"
    ? "fill-emerald-50 stroke-emerald-500"
    : f.source === "existing"
      ? "fill-sky-50 stroke-sky-500"
      : "fill-white stroke-slate-400";

const SolutionTreeSvg = ({ tree }: { tree: SolutionTreeJson }) => {
  const layout = useMemo(() => layoutTree(tree), [tree]);
  if (!layout) {
    return (
      <div className="text-xs text-slate-500 italic">
        No derivation tree (the goal was not reached).
      </div>
    );
  }
  const byId = new Map(layout.facts.map((f) => [f.id, f]));
  return (
    <div className="overflow-auto border border-slate-200 rounded bg-slate-50">
      <svg width={layout.width} height={layout.height}>
        {/* edges: fact -> pill -> deps */}
        {layout.pills.map((pill) => {
          const from = layout.factPos.get(pill.factId)!;
          return (
            <g key={`e-${pill.id}`} className="stroke-slate-300">
              <line
                x1={from.x + FACT_W / 2}
                y1={from.y + FACT_H}
                x2={pill.x}
                y2={pill.y}
              />
              {pill.deps.map((dep) => {
                const to = layout.factPos.get(dep);
                if (!to) return null;
                return (
                  <line
                    key={`e-${pill.id}-${dep}`}
                    x1={pill.x}
                    y1={pill.y}
                    x2={to.x + FACT_W / 2}
                    y2={to.y}
                  />
                );
              })}
            </g>
          );
        })}
        {/* reason pills */}
        {layout.pills.map((pill) => (
          <g key={pill.id}>
            <rect
              x={pill.x - 44}
              y={pill.y - 10}
              width={88}
              height={20}
              rx={10}
              className="fill-amber-100 stroke-amber-400"
            />
            <text
              x={pill.x}
              y={pill.y + 4}
              textAnchor="middle"
              className="fill-amber-900 text-[10px] font-mono"
            >
              {pill.reason.length > 14
                ? `${pill.reason.slice(0, 13)}…`
                : pill.reason}
            </text>
            <title>
              {`${pill.reason}${
                pill.diagramRefs.length > 0
                  ? ` (diagram: ${pill.diagramRefs.join(", ")})`
                  : ""
              }`}
            </title>
          </g>
        ))}
        {/* fact boxes */}
        {layout.facts.map((f) => {
          const pos = layout.factPos.get(f.id);
          if (!pos) return null;
          const isGoal = f.id === tree.goalFactId;
          return (
            <g key={f.id}>
              <rect
                x={pos.x}
                y={pos.y}
                width={FACT_W}
                height={FACT_H}
                rx={6}
                strokeWidth={isGoal ? 2.5 : 1.2}
                className={
                  isGoal ? "fill-violet-50 stroke-violet-600" : factFill(f)
                }
              />
              <text
                x={pos.x + FACT_W / 2}
                y={pos.y + 16}
                textAnchor="middle"
                className="fill-slate-900 text-[10px] font-mono"
              >
                {f.text.length > 26 ? `${f.text.slice(0, 25)}…` : f.text}
              </text>
              <text
                x={pos.x + FACT_W / 2}
                y={pos.y + 29}
                textAnchor="middle"
                className="fill-slate-500 text-[9px]"
              >
                {f.source === "given"
                  ? `given ${f.givenRef ?? ""}`
                  : f.source}
                {f.derivations.length > 1
                  ? ` · ${f.derivations.length} ways`
                  : ""}
              </text>
              <title>{f.text}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const StatTile = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded border border-slate-200 bg-white px-2 py-1">
    <div className="text-[10px] uppercase tracking-wide text-slate-500">
      {label}
    </div>
    <div className="text-sm font-semibold text-slate-900">{value}</div>
  </div>
);

export const SolverPanel = ({ result, running, onClose }: SolverPanelProps) => {
  const [solutionIdx, setSolutionIdx] = useState(0);

  const solution = result?.solutions[solutionIdx];
  return (
    <div className="fixed top-20 left-6 right-6 bottom-6 bg-white border border-slate-300 rounded-lg shadow-xl z-40 p-4 flex flex-col gap-3 overflow-auto">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-sm">
          Proof Solver
          {result?.goalText ? (
            <span className="ml-2 font-mono text-xs text-slate-600">
              goal: {result.goalText}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1 rounded-md bg-slate-700 text-white text-sm"
        >
          Close
        </button>
      </div>

      {running && (
        <div className="text-sm text-slate-600 animate-pulse">Solving…</div>
      )}

      {!running && result && (
        <>
          {result.error && (
            <div className="text-sm text-red-700">{result.error}</div>
          )}
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            <StatTile label="Total" value={`${result.stats.totalMs} ms`} />
            <StatTile
              label="Tree build"
              value={`${result.stats.searchMs} ms`}
            />
            <StatTile label="Verify" value={`${result.stats.verifyMs} ms`} />
            <StatTile
              label="Step checks"
              value={String(result.stats.checkerCalls)}
            />
            <StatTile
              label="Full checks"
              value={String(result.stats.fullCheckerRuns)}
            />
            <StatTile label="Facts" value={String(result.stats.factsCreated)} />
            <StatTile
              label="Derivations"
              value={String(result.stats.derivationsRecorded)}
            />
            <StatTile
              label="Solutions"
              value={`${result.stats.solutionsVerified}/${result.stats.solutionsExtracted}`}
            />
          </div>
          <div className="text-xs text-slate-500">
            Seeded {result.seed.givens} givens, {result.seed.diagramPremises}{" "}
            diagram premises, {result.seed.existingStepsSeeded} existing steps
            {result.seed.droppedInvalidSteps.length > 0
              ? `; dropped invalid steps: ${result.seed.droppedInvalidSteps.join(", ")}`
              : ""}
            {result.stats.budgetExhausted ? "; budget exhausted" : ""}
          </div>

          <div className="font-semibold text-xs text-slate-700">
            Solution tree{" "}
            <span className="font-normal text-slate-500">
              (goal cone; green = given, blue = existing step, white = derived,
              violet = goal; each amber pill is one way to derive its fact)
            </span>
          </div>
          <SolutionTreeSvg tree={result.tree} />

          {result.solutions.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="font-semibold text-xs text-slate-700">
                  Solutions
                </div>
                {result.solutions.map((s, i) => (
                  <button
                    key={`sol-${i}`}
                    type="button"
                    onClick={() => setSolutionIdx(i)}
                    className={`px-2 py-0.5 rounded text-xs border ${
                      i === solutionIdx
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-white text-slate-700 border-slate-300"
                    }`}
                  >
                    #{i + 1} {s.verified ? "✓" : "✗"}
                  </button>
                ))}
              </div>
              {solution && (
                <div className="border border-slate-200 rounded p-2 bg-slate-50">
                  <div
                    className={`text-xs mb-1 ${
                      solution.verified ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {solution.verified
                      ? "Verified by the full proof checker."
                      : `Rejected: ${solution.issues.join("; ")}`}
                  </div>
                  <pre className="text-xs font-mono whitespace-pre-wrap m-0">
                    {solution.steps.map((s) => s.text).join("\n")}
                  </pre>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
