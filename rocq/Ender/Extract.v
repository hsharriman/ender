From Coq Require Import Extraction ExtrOcamlBasic ExtrOcamlString ExtrOcamlNatInt.
Require Import Ender.Parser.

Extraction Language OCaml.
Extraction "extracted/EnderChecker.ml" check_source.
