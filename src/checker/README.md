# Verified Ender checker integration

Proof source is parsed and checked by Rocq code extracted to native OCaml and
WebAssembly. There is no TypeScript proof-checking backend.

- `verified/` loads the extracted checker and adapts its presentation AST for
  the existing TypeScript renderer.
- `proofCheckerCli.ts` and `server.ts` are thin hosts for the extracted API.
- `types/checkerTypes.ts` contains presentation/layout types despite its legacy
  filename; none of these types determine proof acceptance.
- `grammar/defs/` contains untrusted human-readable metadata used by the
  theorem browser and solver prompt.
- `proofs/` is the compatibility corpus.

Run commands inside the reproducible environment:

```sh
nix develop
npm run checkProof -- src/checker/proofs/examples/tutorial.txt
npm test -- --runInBand
```

The audited contract is [`rocq/Ender/Audit.v`](../../rocq/Ender/Audit.v); see
[`docs/verified-checker.md`](../../docs/verified-checker.md) for its scope and
trusted-computing boundary.
