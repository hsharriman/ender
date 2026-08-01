Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.

Section EnderGeometry.

Context `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}.

Definition TriangleCongruent A B C A' B' C' : Prop :=
  Cong A B A' B' /\ Cong B C B' C' /\ Cong C A C' A' /\
  CongA B A C B' A' C' /\ CongA A B C A' B' C' /\
  CongA A C B A' C' B'.

Lemma triangle_congruent_cpctc A B C A' B' C' :
  TriangleCongruent A B C A' B' C' ->
  Cong A B A' B' /\ Cong B C B' C' /\ Cong C A C' A' /\
  CongA B A C B' A' C' /\ CongA A B C A' B' C' /\
  CongA A C B A' C' B'.
Proof. trivial. Qed.

Lemma triangle_congruent_rotate A B C A' B' C' :
  TriangleCongruent A B C A' B' C' -> TriangleCongruent B C A B' C' A'.
Proof.
  unfold TriangleCongruent. intros [HAB [HBC [HCA [HangA [HangB HangC]]]]].
  split; [exact HBC|].
  split; [exact HCA|].
  split; [exact HAB|].
  split; [now apply conga_comm|].
  split; [now apply conga_comm|exact HangA].
Qed.

Lemma triangle_congruent_rotate_back A B C A' B' C' :
  TriangleCongruent B C A B' C' A' -> TriangleCongruent A B C A' B' C'.
Proof.
  intros H. apply triangle_congruent_rotate in H.
  apply triangle_congruent_rotate in H. exact H.
Qed.

(** SAS with the included angle at the first listed vertex. *)
Lemma ender_sas A B C A' B' C' :
  ~ Col A B C ->
  Cong A B A' B' -> CongA B A C B' A' C' -> Cong A C A' C' ->
  TriangleCongruent A B C A' B' C'.
Proof.
  intros Hncol HAB Hang HAC.
  destruct (l11_49 B A C B' A' C') as [HBC [HangB HangC]]; Cong; CongA.
  { apply not_col_distincts in Hncol. spliter. assumption. }
  assert (HCA : Cong C A C' A') by Cong.
  unfold TriangleCongruent. tauto.
Qed.

(** SSS in the ordered correspondence A↔A', B↔B', C↔C'. *)
Lemma ender_sss A B C A' B' C' :
  ~ Col A B C ->
  Cong A B A' B' -> Cong B C B' C' -> Cong C A C' A' ->
  TriangleCongruent A B C A' B' C'.
Proof.
  intros Hncol HAB HBC HCA. apply not_col_distincts in Hncol. spliter.
  destruct (l11_51 A B C A' B' C') as [HangA [HangB HangC]]; Cong.
  assert (HangC' : CongA A C B A' C' B') by (apply conga_comm; exact HangC).
  unfold TriangleCongruent. tauto.
Qed.

(** ASA with the two angles at the first and second vertices. *)
Lemma ender_asa A B C A' B' C' :
  ~ Col A B C ->
  CongA B A C B' A' C' -> Cong A B A' B' ->
  CongA A B C A' B' C' ->
  TriangleCongruent A B C A' B' C'.
Proof.
  intros Hncol HangA HAB HangB.
  destruct (l11_50_1 A B C A' B' C') as [HAC [HBC HangC]]; auto.
  assert (HCA : Cong C A C' A') by Cong.
  unfold TriangleCongruent. tauto.
Qed.

(** AAS with angles at the second and third vertices and side AB. *)
Lemma ender_aas A B C A' B' C' :
  ~ Col A B C ->
  CongA B C A B' C' A' -> CongA A B C A' B' C' ->
  Cong A B A' B' ->
  TriangleCongruent A B C A' B' C'.
Proof.
  intros Hncol HangC HangB HAB.
  destruct (l11_50_2 A B C A' B' C') as [HAC [HBC HangA]]; auto.
  assert (HCA : Cong C A C' A') by Cong.
  assert (HangA' : CongA B A C B' A' C') by (apply conga_comm; exact HangA).
  assert (HangC' : CongA A C B A' C' B') by (apply conga_comm; exact HangC).
  unfold TriangleCongruent. tauto.
Qed.

End EnderGeometry.
