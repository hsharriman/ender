/**
 * The reason catalog as a list.  Like the catalog itself, this is interface
 * metadata, not checking.
 */
import { REASONS_DEFS } from "./defs/reasons.defs";

/** One reason's catalog entry. */
export type ReasonDef = {
  name: string;
  title: string;
  body: string;
  /** The diagram premises the reason reads, if any. */
  diagramDependencies?: readonly string[];
  /** The statement each citation should be, in citation order. */
  dependencies: readonly string[];
  /** The statements the reason can conclude. */
  conclusions: readonly string[];
};

export const REASONS: readonly ReasonDef[] = Object.values(REASONS_DEFS);

const BY_NAME = new Map(REASONS.map((r) => [r.name, r]));

/** The catalog entry of a reason, if it has one. */
export const reasonDef = (name: string): ReasonDef | undefined =>
  BY_NAME.get(name);
