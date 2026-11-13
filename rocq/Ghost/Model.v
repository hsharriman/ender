(** A concrete Euclidean plane satisfying every geometry hypothesis that
    [Audit.checker_sound] quantifies over: the plane over the real algebraic
    numbers, obtained by instantiating GeoCoq's algebraic model construction
    at [{realclosure rat}] in dimension two.

    Nothing here is asserted; the plane is what [CompleteChecker.v] hands to
    [Audit.euclidean_plane_exists], the contract's demand that the geometry
    soundness quantifies over be inhabited.  This file is separate only
    because it is written in MathComp, whose [ssreflect] would displace the
    [rewrite] the implementation's own proofs use.  [Tests.v] runs
    [Print Assumptions] on the discharged obligation, and the build fails on
    any axiom, so the witness cannot quietly decay into one. *)

From mathcomp Require Import ssreflect ssrbool ssrfun eqtype ssralg ssrnum matrix.
From mathcomp Require Import realalg.
Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Require Import GeoCoq.Algebraic.POF_to_Tarski.

(** The real algebraic numbers: a real closed field, which is what GeoCoq's
    construction needs to build segment construction out of square roots. *)
Definition RA : rcfType := realalg.

Definition PlaneTn : Tarski_neutral_dimensionless := @Rcf_to_T RA 0.
Definition PlanePED :
  Tarski_neutral_dimensionless_with_decidable_point_equality PlaneTn :=
  @Rcf_to_T_PED RA 0.
Definition Plane2D : @Tarski_2D PlaneTn PlanePED := @Rcf_to_T2D RA.
Definition PlaneEuclid : @Tarski_euclidean PlaneTn PlanePED :=
  @Rcf_to_T_euclidean RA 0.

#[global] Existing Instance PlaneTn.
#[global] Existing Instance PlanePED.
#[global] Existing Instance Plane2D.
#[global] Existing Instance PlaneEuclid.

(** The points really are the plane: row vectors of length two over [RA]. *)
Lemma Plane_carrier : @Tpoint PlaneTn = 'rV[RA]_2.
Proof. reflexivity. Qed.
