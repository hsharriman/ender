import { ProofContent } from "geometry-object";
import { Stmt } from "../../types/checkerTypes";
import {
  canonicalArgsKey,
  canonicalKey,
  canonicalObjLabels,
} from "./canonical";

/** One known statement, indexed under a citation ref (step number or fact id). */
export interface FactRecord {
  ref: string;
  stmt: Stmt;
  /** Full canonical key (`fn(args)`). */
  key: string;
  /** Canonical args-only key, for cross-function matches. */
  argsKey: string;
}

/**
 * Semantic lookup index over proven statements.
 *
 * Lookups run on canonical keys, so any spelling of a fact (`con_seg(BA,DC)`)
 * hits the record stored under another spelling (`con_seg(AB,CD)`). Facts are
 * additionally indexed by function and by (function, object label) to support
 * join-style dependency derivation (transitivity, congruent supplements).
 */
export class FactIndex {
  private byKey = new Map<string, FactRecord>();
  private byFn = new Map<string, FactRecord[]>();
  private byFnArgs = new Map<string, FactRecord>();
  private byFnObj = new Map<string, FactRecord[]>();

  constructor(private ctx: ProofContent) {}

  /**
   * Index a statement under `ref`. Returns the new record, or the existing
   * record when a semantically identical fact is already known (the caller
   * decides whether that is a duplicate-step situation or fine).
   */
  add(ref: string, stmt: Stmt): { record: FactRecord; added: boolean } {
    const key = canonicalKey(stmt, this.ctx);
    const existing = this.byKey.get(key);
    if (existing) return { record: existing, added: false };

    const record: FactRecord = {
      ref,
      stmt,
      key,
      argsKey: canonicalArgsKey(stmt, this.ctx),
    };
    this.byKey.set(key, record);

    const fnList = this.byFn.get(stmt.function);
    if (fnList) fnList.push(record);
    else this.byFn.set(stmt.function, [record]);

    this.byFnArgs.set(`${stmt.function}|${record.argsKey}`, record);

    for (const obj of canonicalObjLabels(stmt, this.ctx)) {
      const k = `${stmt.function}|${obj}`;
      const list = this.byFnObj.get(k);
      if (list) list.push(record);
      else this.byFnObj.set(k, [record]);
    }
    return { record, added: true };
  }

  hasKey(key: string): boolean {
    return this.byKey.has(key);
  }

  getByKey(key: string): FactRecord | undefined {
    return this.byKey.get(key);
  }

  /** All facts whose function is one of `fns`. */
  byFunction(fns: readonly string[]): FactRecord[] {
    return fns.flatMap((fn) => this.byFn.get(fn) ?? []);
  }

  /** Facts whose function is in `fns` and that mention the object label. */
  byFunctionAndObject(fns: readonly string[], objLabel: string): FactRecord[] {
    return fns.flatMap((fn) => this.byFnObj.get(`${fn}|${objLabel}`) ?? []);
  }

  /**
   * Find a fact stating `stmt` (canonically), allowing any of `fns` as the
   * stored statement function. Used to resolve a dependency slot whose
   * expected type is a group (e.g. `con_ang_ref_allow` matches a stored
   * `con_right` fact with the same arguments).
   */
  findMatching(stmt: Stmt, fns: readonly string[]): FactRecord | undefined {
    const argsKey = canonicalArgsKey(stmt, this.ctx);
    for (const fn of fns) {
      const hit = this.byFnArgs.get(`${fn}|${argsKey}`);
      if (hit) return hit;
    }
    return undefined;
  }

  size(): number {
    return this.byKey.size;
  }

  all(): FactRecord[] {
    return [...this.byKey.values()];
  }
}
