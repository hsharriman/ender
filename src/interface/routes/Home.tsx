import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import ender from "../assets/ender.png";

interface TreeProof {
  name: string;
  path: string;
  hasFeedback: boolean;
}

interface TreeDir {
  name: string;
  path: string;
  dirs: TreeDir[];
  proofs: TreeProof[];
}

const ProofLink = ({ proof, label }: { proof: TreeProof; label?: string }) => (
  <NavLink
    to={`/ender/dataset/${proof.path}`}
    className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700"
  >
    <span className="truncate">{label ?? proof.name}</span>
    {proof.hasFeedback && (
      <span className="shrink-0 text-[10px] uppercase tracking-wide bg-emerald-100 text-emerald-700 rounded px-1.5 py-0.5">
        feedback
      </span>
    )}
  </NavLink>
);

const countProofs = (dir: TreeDir): number =>
  dir.proofs.length + dir.dirs.reduce((n, sub) => n + countProofs(sub), 0);

const DirNode = ({ dir, depth }: { dir: TreeDir; depth: number }) => {
  // A directory holding a single proof and nothing else (the wrong_proofs
  // layout) reads better as a plain proof link than a one-item folder.
  if (dir.dirs.length === 0 && dir.proofs.length === 1) {
    return <ProofLink proof={dir.proofs[0]} label={dir.name} />;
  }
  const proofCount = countProofs(dir);
  return (
    <details open={depth === 0} className="w-full">
      <summary className="cursor-pointer select-none px-2 py-1.5 rounded-md text-sm font-semibold text-slate-800 hover:bg-slate-100">
        {dir.name}
        <span className="ml-2 text-xs font-normal text-slate-400">
          {proofCount}
        </span>
      </summary>
      <div className="ml-4 border-l border-slate-200 pl-2">
        {dir.dirs.map((sub) => (
          <DirNode key={sub.path} dir={sub} depth={depth + 1} />
        ))}
        {dir.proofs.map((proof) => (
          <ProofLink key={proof.path} proof={proof} />
        ))}
      </div>
    </details>
  );
};

export const Home = () => {
  const [tree, setTree] = useState<TreeDir | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dataset/tree")
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
        return data;
      })
      .then((data) => {
        if (!cancelled) setTree(data);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div
        className="sticky top-0 left-0 p-3 h-16 z-30 flex items-center justify-between bg-gradient-to-r from-violet-500 via-30% via-blue-500"
        id="header"
      >
        <div className="flex items-center">
          <NavLink to={"/ender"} className="px-3 text-sm h-8">
            <img src={ender} alt="Ender logo" className="h-12 w-auto shadow-sm" />
          </NavLink>
          <div className="text-white italic tracking-widest">Ender</div>
        </div>
        <div className="flex items-center gap-3 pr-3">
          <NavLink
            to="/ender/examples"
            className="py-1.5 px-4 text-sm bg-blue-700 rounded-lg text-white"
          >
            Examples
          </NavLink>
          <NavLink
            to="/ender/harness"
            className="py-1.5 px-4 text-sm bg-violet-700 rounded-lg text-white"
          >
            ProofObj Harness
          </NavLink>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-xl font-bold text-slate-800 mb-1">Proof Dataset</h1>
        <p className="text-sm text-slate-500 mb-6">
          Proofs from the geo-proof-dataset volume. Select one to render it in
          the harness.
        </p>
        {error && (
          <div className="rounded-md border border-amber-300 bg-amber-50 text-amber-800 text-sm p-4">
            Could not load the proof dataset: {error}
            <div className="mt-1 text-xs text-amber-700">
              Is the backend running with the proof_data volume mounted? (docker
              compose up in geo-proof-dataset, then in ender)
            </div>
          </div>
        )}
        {!error && !tree && (
          <div className="text-sm text-slate-500">Loading proofs...</div>
        )}
        {tree && (
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            {tree.dirs.map((dir) => (
              <DirNode key={dir.path} dir={dir} depth={0} />
            ))}
            {tree.proofs.map((proof) => (
              <ProofLink key={proof.path} proof={proof} />
            ))}
            {tree.dirs.length === 0 && tree.proofs.length === 0 && (
              <div className="text-sm text-slate-500 p-2">
                No proofs found in the dataset volume.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
