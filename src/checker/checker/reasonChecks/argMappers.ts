import { getGeometricObject } from "checker/utils/utils";
import { ProofContent } from "geometry-object";
import { Stmt } from "../../types/checkerTypes";

// Resolves every argument of a statement through getGeometricObject,
// returning an ordered list matching the statement's argument positions.
export const stmtMapper = (stmt: Stmt, ctx: ProofContent) =>
  stmt.arguments.map((arg) => getGeometricObject(arg, ctx));
