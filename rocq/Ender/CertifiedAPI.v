(** Concrete binding certificate for the human-readable contract in [Audit.v].
    This file intentionally contains no checker logic.  Every public operation
    and theorem is a transparent alias of the implementation that is compiled
    and extracted. *)
From Stdlib Require Import String.
Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Require Import Ender.Audit Ender.CompleteChecker.


Module CertifiedChecker <: Audit.COMPLETE_VERIFIED_CHECKER.
  Definition parseProblem := CompleteVerifiedChecker.parseProblem.
  Definition parsePresentation := CompleteVerifiedChecker.parsePresentation.
  Definition check := CompleteVerifiedChecker.check.
  Definition checker := CompleteVerifiedChecker.checker.
  Definition parser_sound := CompleteVerifiedChecker.parser_sound.
  Definition parser_complete := CompleteVerifiedChecker.parser_complete.
  Definition checker_sound := CompleteVerifiedChecker.checker_sound.
  Definition euclidean_plane_exists :=
    CompleteVerifiedChecker.euclidean_plane_exists.
End CertifiedChecker.

(** These are the only executable roots exported by [Extract.v]. *)
Definition parseProblem := CertifiedChecker.parseProblem.
Definition parsePresentation := CertifiedChecker.parsePresentation.
Definition check := CertifiedChecker.check.
Definition checker := CertifiedChecker.checker.

(** Named proof bindings make it easy to inspect assumptions in CI or with
    [Print Assumptions], without knowing the implementation module layout. *)
Definition parser_sound := CertifiedChecker.parser_sound.
Definition parser_complete := CertifiedChecker.parser_complete.
Definition checker_sound := CertifiedChecker.checker_sound.
Definition euclidean_plane_exists := CertifiedChecker.euclidean_plane_exists.

Print Assumptions parser_sound.
Print Assumptions parser_complete.
Print Assumptions checker_sound.
Print Assumptions euclidean_plane_exists.
