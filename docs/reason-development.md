# Implementing a verified Ender reason

This is the handoff workflow for bringing the Rocq checker toward historical
TypeScript parity. Unsupported reasons must continue to fail closed throughout
an incremental change.

## Historical evidence

The last commit containing the complete legacy TypeScript checker is
[`9f43e10`](https://github.com/hsharriman/ender/commit/9f43e10). In a local clone,
inspect it without restoring executable production code:

```sh
git show 9f43e10:src/checker/checker/reasonApplication.ts
git show 9f43e10:src/checker/grammar/defs/stmts.defs.ts
git show 9f43e10:src/checker/grammar/defs/reasons.defs.ts
```

Use that implementation and the bundled fixtures as behavioral evidence only.
Neither is trusted: the old checker had known fail-open and underspecified
behavior. Never turn an accidental historical acceptance into a theorem merely
to obtain parity.

## One-reason workflow

1. Select the next reason from [`reason-coverage.json`](reason-coverage.json),
   starting with priority 1 unless it exposes a semantic ambiguity.
2. Read its catalog entry, every listed fixture, the corresponding public
   statement meanings in `Audit.v`, and relevant GeoCoq theorems.
3. State the rule's exact dependency/conclusion schema and side conditions.
   If more than one reasonable rule fits the evidence, document the decision
   and defer implementation rather than guessing silently.
4. Add the reason constructor and parser support in `Syntax.v` and `Parser.v`.
5. Add a Boolean rule in `Checker.v`. Unknown forms and every failed side
   condition must return false.
6. Prove the rule sound in `Checker.v`, preferably against the weakest GeoCoq
   typeclass context that supports it. Strengthen the global assumptions only
   when the mathematics requires it.
7. Extend `CompleteChecker.v` only as needed to bridge the public audited
   statement representation to the internal kernel. Do not weaken the theorem
   in `Audit.v`.
8. Populate step diagnostics/graph fields when the new rule can report them;
   they are observable via `ender-checker --report` and `enderCheckReport`.
9. Add at least one accepted fixture and one rejected fixture. Include failures
   for wrong dependency type/order, wrong conclusion correspondence, missing
   side conditions, and degenerate objects when relevant.
10. Mark the manifest override, regenerate it, and run all checks below.

## Required checks

```sh
nix develop
npm run reasonCoverage -- --write
npm test -- --runInBand
npm run build
nix flake check -L
```

Also inspect the reason's live classifications:

```sh
node scripts/reason-coverage.mjs --json \
  | jq '.parity[] | select(.reasons | index("REASON_NAME"))'
```

## Definition of done

A reason is `verified` only when it is parsed, executable, fail-closed, covered
by positive and negative tests, included in the kernel soundness proof, and
reachable through the concrete extracted API. A parser constructor or an
unconnected lemma by itself is not coverage.

`reflex` demonstrates `partial`: segment reflexivity is verified, whereas angle
reflexivity remains rejected pending explicit nondegenerate-ray support.
