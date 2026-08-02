From Coq Require Import Extraction ExtrOcamlBasic ExtrOcamlString ExtrOcamlNatInt.
Require Import Ender.CertifiedAPI.

Extraction Language OCaml.
Extraction "extracted/EnderChecker.ml"
  CertifiedAPI.parseProblem CertifiedAPI.check CertifiedAPI.checker.
