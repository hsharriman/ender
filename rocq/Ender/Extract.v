From Coq Require Import Extraction ExtrOcamlBasic ExtrOcamlString ExtrOcamlNatInt.
Require Import Ender.CompleteChecker.

Extraction Language OCaml.
Extraction "extracted/EnderChecker.ml" complete_checker.
