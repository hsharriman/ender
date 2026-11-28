From Stdlib Require Import Extraction ExtrOcamlBasic ExtrOcamlString ExtrOcamlNatInt.
Require Import Ghost.CertifiedAPI.

Extraction Language OCaml.
Extraction "extracted/GhostChecker.ml"
  CertifiedAPI.parseProblem CertifiedAPI.parsePresentation
  CertifiedAPI.check CertifiedAPI.checker
  CertifiedAPI.openSession CertifiedAPI.sessionAccepts
  CertifiedAPI.sessionNeeds CertifiedAPI.sessionMatches
  CertifiedAPI.rayRepresentatives.
