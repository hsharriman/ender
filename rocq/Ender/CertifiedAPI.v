(** Concrete binding certificate for the human-readable contract in [Audit.v].
    This file intentionally contains no checker logic.  Every public operation
    and theorem is a transparent alias of the implementation that is compiled
    and extracted. *)
From Coq Require Import String.
Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Require Import Ender.Audit Ender.CompleteChecker.

Module FA := Audit.FinalAudit.

Module CertifiedChecker <: FA.COMPLETE_VERIFIED_CHECKER.
  Definition parseProblem := CompleteVerifiedChecker.parseProblem.
  Definition parsePresentation := CompleteVerifiedChecker.parsePresentation.
  Definition check := CompleteVerifiedChecker.check.
  Definition checker := CompleteVerifiedChecker.checker.
  Definition parser_sound := CompleteVerifiedChecker.parser_sound.
  Definition parser_complete := CompleteVerifiedChecker.parser_complete.
  Definition meaning
      `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}
      (source : string) : option Prop :=
    @CompleteVerifiedChecker.meaning Tn TnEQD source.
  Definition checker_sound := CompleteVerifiedChecker.checker_sound.
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

Print Assumptions parser_sound.
Print Assumptions parser_complete.
Print Assumptions checker_sound.
