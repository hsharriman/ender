import * as fs from "fs";
import * as path from "path";
import {
  premisesProofTextFromFile,
  priorSolveStatusFromLog,
  provedLogPathForProof,
  shouldProveFixture,
} from "./provePremisesFromProofs";

test("premisesProofTextFromFile extracts premises and empty steps", () => {
  const sample = `// pass
title: "S1C1"
premises:
pt: A (0, 0, b)
-> con_seg(AB, AB)

steps:
[01] reflex_s() -> con_seg(AB, AB)`;
  const text = premisesProofTextFromFile(sample);
  expect(text).toContain('title: "S1C1"');
  expect(text).toContain("-> con_seg(AB, AB)");
  expect(text.trimEnd()).toMatch(/steps:\s*$/);
  expect(text).not.toContain("reflex_s");
});

test("priorSolveStatusFromLog reads status column from proved log", () => {
  const tutorialLog = provedLogPathForProof("tutorial.txt");
  if (!fs.existsSync(tutorialLog)) return;
  expect(priorSolveStatusFromLog(tutorialLog)).toBe("solved");
});

test("shouldProveFixture skips solved logs when unsolvedOnly", () => {
  const tutorialLog = provedLogPathForProof("tutorial.txt");
  if (!fs.existsSync(tutorialLog)) return;
  expect(shouldProveFixture("tutorial.txt", { unsolvedOnly: true })).toBe(false);
  expect(shouldProveFixture("missing-fixture.txt", { unsolvedOnly: true })).toBe(
    true,
  );
});

test("provePremisesFromProofs writes proved logs when run", () => {
  const provedDir = path.join(__dirname, "proved");
  const logs = fs.existsSync(provedDir)
    ? fs.readdirSync(provedDir).filter((n) => n.endsWith(".log"))
    : [];
  if (!logs.length) return;
  const body = fs.readFileSync(path.join(provedDir, logs[0]!), "utf8");
  expect(body).toContain("backward_reasons_tried");
  expect(body).toContain("reason_chain;dependency_slots;conclusion");
});
