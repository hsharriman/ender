Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Require Import GeoCoq.Axioms.parallel_postulates.
Require Import GeoCoq.Main.Annexes.suma.
Require Import GeoCoq.Main.Meta_theory.Parallel_postulates.tarski_playfair.
Require Import GeoCoq.Main.Meta_theory.Parallel_postulates.playfair_par_trans.
Require Import GeoCoq.Main.Meta_theory.Parallel_postulates.playfair_alternate_interior_angles.
Require Import GeoCoq.Main.Meta_theory.Parallel_postulates.alternate_interior_angles_consecutive_interior_angles.
Require Import GeoCoq.Main.Annexes.quadrilaterals.
Require Import GeoCoq.Main.Annexes.quadrilaterals_inter_dec.
Require Import GeoCoq.Main.Meta_theory.Parallel_postulates.playfair_alternate_interior_angles.
Require Import GeoCoq.Main.Meta_theory.Parallel_postulates.alternate_interior_angles_triangle.
Require Import GeoCoq.Main.Meta_theory.Parallel_postulates.existential_triangle_rah.
Require Import GeoCoq.Main.Meta_theory.Parallel_postulates.rah_thales_postulate.

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

Lemma triangle_congruent_sym A B C A' B' C' :
  TriangleCongruent A B C A' B' C' -> TriangleCongruent A' B' C' A B C.
Proof.
  unfold TriangleCongruent. intros [HAB [HBC [HCA [HangA [HangB HangC]]]]].
  split; [now apply cong_symmetry|].
  split; [now apply cong_symmetry|].
  split; [now apply cong_symmetry|].
  split; [now apply conga_sym|].
  split; [now apply conga_sym|now apply conga_sym].
Qed.

Lemma triangle_congruent_trans A B C A' B' C' A'' B'' C'' :
  TriangleCongruent A B C A' B' C' -> TriangleCongruent A' B' C' A'' B'' C'' ->
  TriangleCongruent A B C A'' B'' C''.
Proof.
  unfold TriangleCongruent.
  intros [HAB [HBC [HCA [HangA [HangB HangC]]]]].
  intros [HAB' [HBC' [HCA' [HangA' [HangB' HangC']]]]].
  split; [eapply cong_transitivity; eassumption|].
  split; [eapply cong_transitivity; eassumption|].
  split; [eapply cong_transitivity; eassumption|].
  split; [eapply conga_trans; eassumption|].
  split; [eapply conga_trans; eassumption|eapply conga_trans; eassumption].
Qed.

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

(** Reversing both vertex lists describes the same correspondence read
    backwards, so it preserves congruence. *)
Lemma triangle_congruent_reverse A B C A' B' C' :
  TriangleCongruent C B A C' B' A' -> TriangleCongruent A B C A' B' C'.
Proof.
  unfold TriangleCongruent. intros [HCB [HBA [HAC [HangC [HangB HangA]]]]].
  split; [Cong|].
  split; [Cong|].
  split; [Cong|].
  split; [now apply conga_comm|].
  split; [now apply conga_comm|now apply conga_comm].
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

(** Pons asinorum, stated with the apex first.  Both directions hold in
    neutral geometry. *)
Lemma ender_base_angle A B C :
  ~ Col A B C -> Cong A B A C -> CongA A B C A C B.
Proof.
  intros Hncol Hcong. apply (proj2 (l11_44_1 B A C ltac:(Col))). exact Hcong.
Qed.

Lemma ender_base_angle_conv A B C :
  ~ Col A B C -> CongA A B C A C B -> Cong A B A C.
Proof.
  intros Hncol Hang. apply (proj1 (l11_44_1 B A C ltac:(Col))). exact Hang.
Qed.

(** Equilateral and equiangular coincide, by applying pons asinorum at two
    different apexes. *)
Lemma ender_equilateral_equiangular A B C :
  ~ Col A B C -> Cong A B B C -> Cong B C C A ->
  CongA C A B A B C /\ CongA A B C B C A.
Proof.
  intros Hncol Hab Hbc. split.
  - assert (Hapex : Cong C A C B) by Cong.
    assert (Hbase : CongA C A B C B A)
      by (apply ender_base_angle; [Col|exact Hapex]).
    CongA.
  - assert (Hapex : Cong A B A C) by (apply cong_transitivity with B C; Cong).
    assert (Hbase : CongA A B C A C B)
      by (apply ender_base_angle; [Col|exact Hapex]).
    CongA.
Qed.

Lemma ender_equiangular_equilateral A B C :
  ~ Col A B C -> CongA C A B A B C -> CongA A B C B C A ->
  Cong A B B C /\ Cong B C C A.
Proof.
  intros Hncol HangA HangB.
  assert (Hca : Cong C A C B).
  { apply ender_base_angle_conv; [Col|CongA]. }
  assert (Hab : Cong A B A C).
  { apply ender_base_angle_conv; [Col|CongA]. }
  split; [|Cong].
  apply cong_transitivity with A C; [exact Hab|Cong].
Qed.

(** In a well-formed quadrilateral, the crossing diagonals promote the single
    audited [~ Col A B C] to no three vertices collinear: a line through
    three vertices would have to meet a segment that leaves it at one of the
    endpoints [BetS] forbids. *)
Lemma ender_quad_no_three_collinear : forall A B C D X,
  ~ Col A B C -> BetS A X C -> BetS B X D ->
  ~ Col B C D /\ ~ Col C D A /\ ~ Col D A B.
Proof.
  intros A B C D X Hncol [HbetAC [HAX HXC]] [HbetBD [HBX HXD]].
  assert (HcolAXC : Col A X C) by Col.
  assert (HcolBXD : Col B X D) by Col.
  assert (HAC : A <> C).
  { intro Heq. subst C. apply HAX, between_identity. assumption. }
  assert (HBD : B <> D).
  { intro Heq. subst D. apply HBX, between_identity. assumption. }
  assert (HCX : C <> X) by (intro Heq; apply HXC; auto).
  split; [|split].
  - intro Hcol.
    assert (HcolBXC : Col B X C)
      by (apply (col_transitivity_1 B D X C HBD); Col).
    assert (Hfinal : Col C B A)
      by (apply (col_transitivity_1 C X B A HCX); Col).
    apply Hncol. Col.
  - intro Hcol.
    assert (HcolAXD : Col A X D)
      by (apply (col_transitivity_1 A C X D HAC); Col).
    assert (HcolXAB : Col X A B)
      by (apply (col_transitivity_1 X D A B HXD); Col).
    assert (Hfinal : Col A B C)
      by (apply (col_transitivity_1 A X B C HAX); Col).
    apply Hncol. Col.
  - intro Hcol.
    assert (HcolBXA : Col B X A)
      by (apply (col_transitivity_1 B D X A HBD); Col).
    assert (Hfinal : Col A B C)
      by (apply (col_transitivity_1 A X B C HAX); Col).
    apply Hncol. Col.
Qed.

(** The two-sides facts of a transversal figure, from the configuration
    alone: the flanking points of each line are on opposite sides of the
    transversal, and with [A] and [C] sharing a side, the alternate pairs
    [(A, D)] and [(B, C)] are separated. *)
Lemma ender_transversal_sides : forall I1 I2 A B C D,
  BetS A I1 B -> BetS C I2 D -> OS I1 I2 A C ->
  TS I1 I2 A D /\ TS I1 I2 B C.
Proof.
  intros I1 I2 A B C D Hab Hcd Hos.
  destruct Hab as [HbetAB [HneAI1 HneI1B]].
  destruct Hcd as [HbetCD [HneCI2 HneI2D]].
  assert (HncolA : ~ Col I1 I2 A) by (apply one_side_not_col123 with C; auto).
  assert (HncolC : ~ Col I1 I2 C)
    by (apply one_side_not_col123 with A; auto using one_side_symmetry).
  assert (HcolAB1 : Col A B I1) by (apply bet_col in HbetAB; Col).
  assert (HcolCD2 : Col C D I2) by (apply bet_col in HbetCD; Col).
  assert (HncolB : ~ Col I1 I2 B).
  { intro Hcol.
    assert (Hstep : Col I1 A I2)
      by (apply (col_transitivity_1 I1 B A I2 HneI1B); Col).
    apply HncolA. Col. }
  assert (HncolD : ~ Col I1 I2 D).
  { intro Hcol.
    assert (Hstep : Col I2 C I1)
      by (apply (col_transitivity_1 I2 D C I1 HneI2D); Col).
    apply HncolC. Col. }
  assert (HtsAB : TS I1 I2 A B).
  { repeat split; [intro; apply HncolA; Col|intro; apply HncolB; Col|].
    exists I1. split; [Col|assumption]. }
  assert (HtsCD : TS I1 I2 C D).
  { repeat split; [intro; apply HncolC; Col|intro; apply HncolD; Col|].
    exists I2. split; [Col|assumption]. }
  split.
  - apply l9_8_2 with C; [exact HtsCD|now apply one_side_symmetry].
  - apply l9_2. apply l9_8_2 with A; assumption.
Qed.

(** The vertical angles of the transversal figure, from the configuration
    alone. *)
Lemma ender_transversal_verticals : forall T1 I1 I2 T2 A B C D,
  BetS T1 I1 I2 -> BetS I1 I2 T2 -> BetS A I1 B -> BetS C I2 D ->
  CongA T1 I1 A I2 I1 B /\ CongA T1 I1 B I2 I1 A /\
  CongA I1 I2 C T2 I2 D /\ CongA I1 I2 D T2 I2 C.
Proof.
  intros T1 I1 I2 T2 A B C D Ht1 Ht2 Hab Hcd.
  destruct Ht1 as [HbetT1 [HneT1I1 HneI1I2]].
  destruct Ht2 as [HbetT2 [HneI1I2' HneI2T2]].
  destruct Hab as [HbetAB [HneAI1 HneI1B]].
  destruct Hcd as [HbetCD [HneCI2 HneI2D]].
  assert (HneI2I1 : I2 <> I1) by (intro Heq; apply HneI1I2; auto).
  assert (HneI1A : I1 <> A) by (intro Heq; apply HneAI1; auto).
  assert (HneT2I2 : T2 <> I2) by (intro Heq; apply HneI2T2; auto).
  assert (HneI2C : I2 <> C) by (intro Heq; apply HneCI2; auto).
  assert (HbetBA : Bet B I1 A) by (apply between_symmetry; assumption).
  assert (HbetDC : Bet D I2 C) by (apply between_symmetry; assumption).
  split; [apply l11_14; assumption|].
  split; [apply l11_14; assumption|].
  split; apply l11_14; assumption.
Qed.

(** The converse master: either alternate interior congruence forces the
    lines parallel.  Purely neutral, through GeoCoq's [l12_21_b]. *)
Lemma ender_transversal_master_conv : forall I1 I2 A B C D,
  BetS A I1 B -> BetS C I2 D -> OS I1 I2 A C ->
  CongA A I1 I2 D I2 I1 \/ CongA B I1 I2 C I2 I1 ->
  Par A B C D.
Proof.
  intros I1 I2 A B C D Hab Hcd Hos Hconga.
  destruct (ender_transversal_sides I1 I2 A B C D Hab Hcd Hos) as [HtsAD HtsBC].
  destruct Hab as [HbetAB [HneAI1 HneI1B]].
  destruct Hcd as [HbetCD [HneCI2 HneI2D]].
  assert (HneAB : A <> B).
  { intro Heq. subst B. apply HneAI1, between_identity. assumption. }
  assert (HneCD : C <> D).
  { intro Heq. subst D. apply HneCI2, between_identity. assumption. }
  assert (HcolAB1 : Col A B I1) by (apply bet_col in HbetAB; Col).
  assert (HcolCD2 : Col C D I2) by (apply bet_col in HbetCD; Col).
  destruct Hconga as [Hm|Hm].
  - assert (Hpar : Par I1 A I2 D) by (apply l12_21_b; assumption).
    assert (Hstep : Par I1 A C D)
      by (apply (par_col2_par I1 A I2 D C D HneCD Hpar); Col).
    apply par_symmetry.
    apply (par_col2_par C D I1 A A B HneAB); [now apply par_symmetry|Col|Col].
  - assert (Hpar : Par I1 B I2 C) by (apply l12_21_b; assumption).
    assert (Hstep : Par I1 B C D)
      by (apply (par_col2_par I1 B I2 C C D HneCD Hpar); Col).
    apply par_symmetry.
    apply (par_col2_par C D I1 B A B HneAB); [now apply par_symmetry|Col|Col].
Qed.

(** Family reductions to the converse master.  Each named angle relation of
    the figure pins an alternate interior congruence through vertical angles
    and linear pairs; all of it is neutral, so the converse parallel-line
    rules need no parallel postulate. *)
Lemma ender_transversal_altext_conv : forall T1 I1 I2 T2 A B C D,
  BetS T1 I1 I2 -> BetS I1 I2 T2 -> BetS A I1 B -> BetS C I2 D ->
  OS I1 I2 A C ->
  CongA T1 I1 A T2 I2 D \/ CongA T1 I1 B T2 I2 C ->
  Par A B C D.
Proof.
  intros T1 I1 I2 T2 A B C D Ht1 Ht2 Hab Hcd Hos Hconga.
  destruct (ender_transversal_verticals T1 I1 I2 T2 A B C D Ht1 Ht2 Hab Hcd)
    as [Hv1 [Hv1' [Hv2 Hv2']]].
  apply (ender_transversal_master_conv I1 I2 A B C D Hab Hcd Hos).
  destruct Hconga as [Hin|Hin].
  - right. apply conga_comm.
    apply conga_trans with T1 I1 A; [apply conga_sym; exact Hv1|].
    apply conga_trans with T2 I2 D; [exact Hin|].
    apply conga_sym. exact Hv2.
  - left. apply conga_comm.
    apply conga_trans with T1 I1 B; [apply conga_sym; exact Hv1'|].
    apply conga_trans with T2 I2 C; [exact Hin|].
    apply conga_sym. exact Hv2'.
Qed.

Lemma ender_transversal_corresp_conv : forall T1 I1 I2 T2 A B C D,
  BetS T1 I1 I2 -> BetS I1 I2 T2 -> BetS A I1 B -> BetS C I2 D ->
  OS I1 I2 A C ->
  CongA I2 I1 B T2 I2 D \/ CongA I2 I1 A T2 I2 C \/
  CongA T1 I1 A I1 I2 C \/ CongA T1 I1 B I1 I2 D ->
  Par A B C D.
Proof.
  intros T1 I1 I2 T2 A B C D Ht1 Ht2 Hab Hcd Hos Hconga.
  destruct (ender_transversal_verticals T1 I1 I2 T2 A B C D Ht1 Ht2 Hab Hcd)
    as [Hv1 [Hv1' [Hv2 Hv2']]].
  apply (ender_transversal_master_conv I1 I2 A B C D Hab Hcd Hos).
  destruct Hconga as [Hin|[Hin|[Hin|Hin]]].
  - right. apply conga_comm.
    apply conga_trans with T2 I2 D; [exact Hin|].
    apply conga_sym. exact Hv2.
  - left. apply conga_comm.
    apply conga_trans with T2 I2 C; [exact Hin|].
    apply conga_sym. exact Hv2'.
  - right. apply conga_comm.
    apply conga_trans with T1 I1 A; [apply conga_sym; exact Hv1|exact Hin].
  - left. apply conga_comm.
    apply conga_trans with T1 I1 B; [apply conga_sym; exact Hv1'|exact Hin].
Qed.

Lemma ender_transversal_sameside_conv : forall T1 I1 I2 T2 A B C D,
  BetS T1 I1 I2 -> BetS I1 I2 T2 -> BetS A I1 B -> BetS C I2 D ->
  OS I1 I2 A C ->
  SuppA B I1 I2 I1 I2 D \/ SuppA A I1 I2 I1 I2 C ->
  Par A B C D.
Proof.
  intros T1 I1 I2 T2 A B C D Ht1 Ht2 Hab Hcd Hos Hsupp.
  pose proof Hab as Hab0. pose proof Hcd as Hcd0.
  destruct Hab0 as [HbetAB [HneAI1 HneI1B]].
  destruct Hcd0 as [HbetCD [HneCI2 HneI2D]].
  apply (ender_transversal_master_conv I1 I2 A B C D Hab Hcd Hos).
  destruct Hsupp as [Hin|Hin].
  - destruct Hin as [HneBI1 [A' [HbetBA' Hconga']]].
    pose proof Hconga' as Hd.
    destruct Hd as [HneI1I2 [HneDI2 [HneI2I1 [HneA'I1 _]]]].
    assert (Hout : Out I1 A A').
    { apply (proj1 (l6_2 A A' B I1 HneAI1 HneA'I1 HneBI1 HbetAB)).
      apply between_symmetry. exact HbetBA'. }
    left. apply conga_comm.
    apply conga_trans with I2 I1 A'.
    + apply out2__conga.
      * apply out_trivial. exact HneI2I1.
      * apply l6_6. exact Hout.
    + apply conga_sym. exact Hconga'.
  - destruct Hin as [HneAI1' [B' [HbetAB' Hconga']]].
    pose proof Hconga' as Hd.
    destruct Hd as [HneI1I2 [HneCI2' [HneI2I1 [HneB'I1 _]]]].
    assert (HneBI1 : B <> I1) by (intro Heq; apply HneI1B; auto).
    assert (Hout : Out I1 B B').
    { apply (proj1 (l6_2 B B' A I1 HneBI1 HneB'I1 HneAI1
                      (between_symmetry A I1 B HbetAB))).
      apply between_symmetry. exact HbetAB'. }
    right. apply conga_comm.
    apply conga_trans with I2 I1 B'.
    + apply out2__conga.
      * apply out_trivial. exact HneI2I1.
      * apply l6_6. exact Hout.
    + apply conga_sym. exact Hconga'.
Qed.

(** Two tangent segments drawn to a circle from one outside point.  Each meets
    its radius at a right angle, so the two right triangles share the segment
    from the centre to that point and have congruent radii for their other
    legs; [cong2_per2__cong] cancels those and leaves the tangents equal. *)
Lemma ender_tangents_congruent : forall O E A B,
  Per E A O -> Per E B O -> Cong A O B O -> Cong A E B E.
Proof.
  intros O E A B HperA HperB Hradii.
  apply (cong2_per2__cong E A O E B O);
    [exact HperA|exact HperB|apply cong_reflexivity|exact Hradii].
Qed.

(** A radius perpendicular to a chord bisects it.  The foot cuts the chord
    into two legs of right triangles that share the leg running to the centre
    and whose hypotenuses are both radii, so the legs are congruent, and a
    point on the line congruent to both endpoints is their midpoint. *)
Lemma ender_chord_foot_midpoint : forall O P E F,
  E <> F -> Col E P F -> Per E P O -> Per F P O -> Cong O E O F ->
  Midpoint P E F.
Proof.
  intros O P E F Hne Hcol HperE HperF Hradii.
  assert (Hhalves : Cong P E P F).
  { apply (cong2_per2__cong E P O F P O);
      [exact HperE|exact HperF|Cong|apply cong_reflexivity]. }
  destruct (l7_20 P E F ltac:(Col) Hhalves) as [Heq|Hmid];
    [contradiction|exact Hmid].
Qed.

End EnderGeometry.

(** Rules that genuinely need the parallel postulate live here, in their own
    context, so that a reader can see at a glance which reasons force it.  The
    neutral section above is unaffected. *)
Section EnderEuclideanGeometry.

Context `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}.
Context {TE : @Tarski_euclidean Tn TnEQD}.

(** The sum of a triangle's angles is a straight angle.  GeoCoq also proves
    this in [Annexes.inscribed_angle], but that route goes through [l12_21_a],
    which depends on [Eqdep.Eq_rect_eq]; going through Playfair instead keeps
    the whole development free of axioms. *)
Lemma euclidean_trisuma__bet : forall A B C D E F,
  TriSumA A B C D E F -> Bet D E F.
Proof.
  apply alternate_interior__triangle, playfair__alternate_interior,
        tarski_s_euclid_implies_playfair.
  unfold tarski_s_parallel_postulate. exact euclid.
Qed.

(** Two angles of a triangle determine the third.  Both triangle sums are
    straight angles, so cancelling the two known angles in turn leaves the
    third pair congruent.  Each cancellation is legitimate because the two
    summands never exceed a straight angle: [sams123231] for two angles of a
    triangle, and [bet_suma__sams] for a sum that is itself straight. *)
Lemma ender_third_angle A B C A' B' C' :
  ~ Col A B C -> ~ Col A' B' C' ->
  CongA B A C B' A' C' -> CongA A B C A' B' C' ->
  CongA A C B A' C' B'.
Proof.
  intros Hncol Hncol' HangA HangB.
  assert (HangA' : CongA C A B C' A' B') by (now apply conga_comm).
  apply not_col_distincts in Hncol. spliter.
  apply not_col_distincts in Hncol'. spliter.
  destruct (ex_trisuma A B C) as [P [Q [R HTri]]]; auto.
  destruct (ex_trisuma A' B' C') as [P' [Q' [R' HTri']]]; auto.
  pose proof (euclidean_trisuma__bet _ _ _ _ _ _ HTri) as HBet.
  pose proof (euclidean_trisuma__bet _ _ _ _ _ _ HTri') as HBet'.
  destruct HTri as [S1 [S2 [S3 [HInner HOuter]]]].
  destruct HTri' as [T1 [T2 [T3 [HInner' HOuter']]]].
  assert_diffs.
  pose proof (suma_distincts _ _ _ _ _ _ _ _ _ HOuter) as HdSum. spliter.
  pose proof (suma_distincts _ _ _ _ _ _ _ _ _ HOuter') as HdSum'. spliter.
  (* both triangle sums are straight, hence congruent *)
  assert (HflatCong : CongA P Q R P' Q' R') by (apply conga_line; auto).
  (* cancel the angle at A, leaving the sums of the other two angles *)
  assert (HsamsOuter : SAMS S1 S2 S3 C A B) by (apply bet_suma__sams with P Q R; auto).
  assert (HsamsOuter' : SAMS T1 T2 T3 C A B).
  { apply (conga2_sams__sams T1 T2 T3 C' A' B');
      [apply conga_refl; auto|now apply conga_sym|].
    apply bet_suma__sams with P' Q' R'; auto. }
  assert (HOuter'' : SumA T1 T2 T3 C A B P Q R).
  { apply (conga3_suma__suma T1 T2 T3 C' A' B' P' Q' R');
      [assumption|apply conga_refl; auto|now apply conga_sym|now apply conga_sym]. }
  assert (HsumEq : CongA S1 S2 S3 T1 T2 T3)
    by (apply (sams2_suma2__conga123 _ _ _ _ _ _ C A B P Q R); assumption).
  (* cancel the angle at B, leaving the angles at C *)
  assert (HsamsInner : SAMS A B C B C A) by (apply sams123231; auto).
  assert (HsamsInner' : SAMS A B C B' C' A').
  { apply (conga2_sams__sams A' B' C' B' C' A');
      [now apply conga_sym|apply conga_refl; auto|].
    apply sams123231; auto. }
  assert (HInner'' : SumA A B C B' C' A' S1 S2 S3).
  { apply (conga3_suma__suma A' B' C' B' C' A' T1 T2 T3);
      [assumption|now apply conga_sym|apply conga_refl; auto|now apply conga_sym]. }
  assert (HangC : CongA B C A B' C' A')
    by (apply (sams2_suma2__conga456 A B C _ _ _ _ _ _ S1 S2 S3); assumption).
  now apply conga_comm.
Qed.

(** The audited parallelogram in GeoCoq's own spelling.  Noncollinearity
    promotes the first [Par] to the strict relation, and the second then
    supplies the shared diagonal midpoint. *)
Lemma ender_pgram_plg : forall A B C D,
  ~ Col A B C -> Par A B C D -> Par B C D A -> Plg A B C D.
Proof.
  intros A B C D Hncol Hab Hbc.
  assert (Hstrict : Par_strict A B C D).
  { apply par_not_col_strict with C; [exact Hab|Col|exact Hncol]. }
  apply pars_par_plg; [exact Hstrict|Par].
Qed.

(** The converse of the diagonal-bisection theorem, read off GeoCoq's own
    midpoint spelling of the figure: two segments that share a
    midpoint are the diagonals of a parallelogram. *)
Lemma ender_pgram_from_diagonal_midpoint : forall A B C D M,
  ~ Col A B C -> Midpoint M A C -> Midpoint M B D ->
  Par A B C D /\ Par B C D A.
Proof.
  intros A B C D M Hncol Hac Hbd.
  pose proof Hncol as Hdistinct. apply not_col_distincts in Hdistinct.
  destruct Hdistinct as [_ [HAB [HBC HAC]]].
  assert (Hplg : Parallelogram A B C D) by (apply (mid_plg A B C D M); auto).
  destruct (plg_par A B C D HAB HBC Hplg) as [Hab Had].
  split; [exact Hab|apply par_symmetry, par_left_comm, Had].
Qed.

(** Alternate interior angles across a transversal of parallels, derived
    through Playfair exactly as [euclidean_trisuma__bet] is: GeoCoq's own
    [par_2_plg] route depends on [Eqdep.Eq_rect_eq], and this one keeps the
    development free of axioms. *)
Lemma ender_alternate_interior : forall A B C D,
  TS A C B D -> Par A B C D -> CongA B A C D C A.
Proof.
  apply playfair__alternate_interior, tarski_s_euclid_implies_playfair.
  unfold tarski_s_parallel_postulate. exact euclid.
Qed.

(** Opposite sides of a genuine parallelogram are congruent: the diagonal
    through the audited crossing point is a transversal of both parallel
    pairs, and ASA glues the two triangles it cuts. *)
Lemma ender_pgram_opp_sides : forall A B C D X,
  ~ Col A B C -> BetS A X C -> BetS B X D ->
  Par A B C D -> Par B C D A ->
  Cong A B C D /\ Cong B C D A.
Proof.
  intros A B C D X Hncol HbetsAC HbetsBD Hpab Hpbc.
  destruct (ender_quad_no_three_collinear A B C D X Hncol HbetsAC HbetsBD)
    as [Hbcd [Hcda Hdab]].
  destruct HbetsAC as [HbetAC [HAX HXC]].
  destruct HbetsBD as [HbetBD [HBX HXD]].
  assert (HcolXAC : Col X A C) by (apply bet_col in HbetAC; Col).
  assert (Hts : TS A C B D).
  { repeat split.
    - intro. apply Hncol. Col.
    - intro. apply Hcda. Col.
    - exists X. split; assumption. }
  assert (Hconga1 : CongA B A C D C A)
    by (apply ender_alternate_interior; assumption).
  assert (Hconga2 : CongA B C A D A C).
  { apply ender_alternate_interior.
    - apply invert_two_sides. exact Hts.
    - apply par_right_comm, par_left_comm. exact Hpbc. }
  assert (Htri : TriangleCongruent A C B C A D).
  { apply ender_asa.
    - intro. apply Hncol. Col.
    - apply conga_comm. exact Hconga1.
    - apply cong_pseudo_reflexivity.
    - apply conga_comm. exact Hconga2. }
  destruct Htri as [_ [Hcb_ad [Hba_dc _]]].
  split; Cong.
Qed.

(** Both diagonals of the audited rectangle have the same length.  Either
    diagonal completes a triangle on one of the sides, and those two triangles
    agree side-angle-side: they share that side, their other legs are the
    parallelogram's congruent opposite sides, and the corners between are two
    of the rectangle's right angles. *)
Lemma ender_rect_diagonals : forall A B C D X,
  ~ Col A B C -> BetS A X C -> BetS B X D ->
  Par A B C D -> Par B C D A ->
  Per D A B -> Per A B C ->
  Cong A C B D.
Proof.
  intros A B C D X Hncol HbetsAC HbetsBD Hpab Hpbc HperA HperB.
  destruct (ender_quad_no_three_collinear A B C D X Hncol HbetsAC HbetsBD)
    as [_ [_ Hdab]].
  destruct (ender_pgram_opp_sides A B C D X Hncol HbetsAC HbetsBD Hpab Hpbc)
    as [_ Hbc_da].
  apply not_col_distincts in Hncol. destruct Hncol as [Hncol [HAB [HBC _]]].
  apply not_col_distincts in Hdab. destruct Hdab as [_ [HDA [_ HDB]]].
  assert (Hcorners : CongA A B C B A D).
  { apply l11_16;
      [exact HperB|exact HAB|now apply not_eq_sym
      |now apply l8_2|now apply not_eq_sym|exact HDA]. }
  destruct (ender_sas B A C A B D) as [_ [Hdiagonals _]];
    [intro; apply Hncol; Col
    |apply cong_pseudo_reflexivity
    |exact Hcorners
    |now apply cong_right_commutativity
    |exact Hdiagonals].
Qed.

(** Opposite angles of the audited parallelogram.  Noncollinearity promotes
    the first broad [Par] relation to GeoCoq's strict one; the second parallel
    pair then supplies [Plg], whose standard angle theorem gives both pairs. *)
Lemma ender_pgram_opp_angles : forall A B C D,
  A <> B /\ A <> C /\ B <> C -> ~ Col A B C ->
  Par A B C D -> Par B C D A ->
  CongA A B C C D A /\ CongA B C D D A B.
Proof.
  intros A B C D Hdistinct Hncol Hab Hbc.
  assert (Hstrict : Par_strict A B C D).
  { apply par_not_col_strict with C; [exact Hab|Col|exact Hncol]. }
  assert (Hplg : Plg A B C D).
  { apply pars_par_plg; [exact Hstrict|Par]. }
  apply plg_conga; [exact Hdistinct|].
  now apply plg_to_parallelogram.
Qed.

Lemma ender_bets_sym : forall A X C, BetS A X C -> BetS C X A.
Proof.
  intros A X C [Hbet [H1 H2]]. repeat split;
    [now apply between_symmetry|now apply not_eq_sym|now apply not_eq_sym].
Qed.

(** An angle supplementary to a right angle is right.  [SuppA] lays the two
    along a straight angle, so the second is congruent to the first's
    continuation, and a continuation of a right angle is right. *)
Lemma ender_suppa_per : forall A B C D E F,
  SuppA A B C D E F -> Per D E F -> Per A B C.
Proof.
  intros A B C D E F [HneAB [A' [Hbet Hconga]]] Hper.
  assert (HperA' : Per C B A') by (apply (l11_17 D E F); assumption).
  pose proof (conga_distinct D E F C B A' Hconga) as [_ [_ [HneCB HneBA']]].
  apply l8_2, (l11_17 C B A'); [exact HperA'|].
  apply l11_18_1;
    [now apply between_symmetry
    |now apply not_eq_sym|now apply not_eq_sym|now apply not_eq_sym
    |exact HperA'].
Qed.

(** Consecutive interior angles between parallels, Euclidean by the same
    Playfair route the alternate interior angles take. *)
Lemma ender_consecutive_interior : forall A B C D,
  OS B C A D -> Par A B C D -> SuppA A B C B C D.
Proof.
  apply alternate_interior__consecutive_interior,
    playfair__alternate_interior, tarski_s_euclid_implies_playfair.
  unfold tarski_s_parallel_postulate. exact euclid.
Qed.

(** Two corners of the audited parallelogram that share a side are
    supplementary.  The shared side is a transversal of the other two, which
    are parallel, and the crossing diagonals are what put the two far corners
    on one side of it: each is on the same ray from an end of the shared side
    as the crossing point is. *)
(** The two corners at either end of a side are on one side of it, which is
    what the crossing diagonals are for: each far corner lies on the same ray
    from an end of that side as the crossing point does. *)
Lemma ender_quad_same_side : forall A B C D X,
  ~ Col A B C -> BetS A X C -> BetS B X D -> OS B C A D.
Proof.
  intros A B C D X Hncol HAC HBD.
  destruct (ender_quad_no_three_collinear A B C D X Hncol HAC HBD)
    as [Hbcd _].
  destruct HAC as [HbetAC [HAX HXC]].
  destruct HBD as [HbetBD [HBX HXD]].
  assert (HcolBXD : Col B X D) by Col.
  assert (HncolBCX : ~ Col B C X) by (intro; apply Hbcd; ColR).
  assert (HosX : OS B C X D)
    by (apply out_one_side; [now left|apply bet_out; auto]).
  assert (HosA : OS B C A X).
  { apply one_side_symmetry, invert_one_side, out_one_side;
      [right; intro; apply Hncol; Col
      |apply bet_out; [now apply not_eq_sym
                      |now apply between_symmetry]]. }
  apply one_side_transitivity with X; assumption.
Qed.

Lemma ender_pgram_consec_angles : forall A B C D X,
  ~ Col A B C -> BetS A X C -> BetS B X D -> Par A B C D ->
  SuppA A B C B C D.
Proof.
  intros A B C D X Hncol HAC HBD Hpar.
  apply ender_consecutive_interior;
    [exact (ender_quad_same_side A B C D X Hncol HAC HBD)|exact Hpar].
Qed.

(** The converse, and neutral where the forward direction is not: continue one
    of the two sides past their shared corner, and the supplement makes the
    far corner congruent to the continuation.  That is an alternate interior
    pair, which [l12_21_b] turns into the parallel. *)
Lemma ender_pgram_from_consec_angles : forall A B C D X,
  ~ Col A B C -> BetS A X C -> BetS B X D ->
  SuppA A B C B C D -> Par A B C D.
Proof.
  intros A B C D X Hncol HAC HBD Hsuppa.
  pose proof (ender_quad_same_side A B C D X Hncol HAC HBD) as Hos.
  pose proof Hncol as Hdistinct. apply not_col_distincts in Hdistinct.
  destruct Hdistinct as [_ [HAB [HBC _]]].
  destruct (segment_construction A B A B) as [A' [HbetA' Hcong]].
  assert (HneBA' : B <> A').
  { intro Heq. subst A'. apply HAB, (cong_identity A B B).
    now apply cong_symmetry. }
  assert (Hlinear : SuppA A B C C B A')
    by (apply bet__suppa; assumption).
  assert (Hconga : CongA B C D C B A')
    by (apply (suppa2__conga456 A B C); assumption).
  assert (Hts : TS B C A A').
  { repeat split.
    - intro. apply Hncol. Col.
    - intro Hcol. apply Hncol.
      apply (col3 B A' A B C HneBA');
        [apply bet_col in HbetA'; Col|Col|Col].
    - exists B. split; [Col|exact HbetA']. }
  assert (HtsD : TS B C A' D)
    by (apply l9_2, (l9_8_2 B C A D A'); [exact Hts|exact Hos]).
  assert (Hpar : Par B A' C D)
    by (apply l12_21_b; [exact HtsD|apply conga_comm, conga_sym, Hconga]).
  apply par_left_comm, (par_col_par_2 B A' C D A);
    [now apply not_eq_sym
    |apply bet_col in HbetA'; Col
    |exact Hpar].
Qed.

(** One right corner makes a parallelogram a rectangle: the opposite corner is
    congruent to it, and each neighbour is supplementary to it. *)
Lemma ender_pgram_right_corner : forall A B C D X,
  ~ Col A B C -> BetS A X C -> BetS B X D ->
  Par A B C D -> Par B C D A -> Per A B C ->
  Per D A B /\ Per A B C /\ Per B C D /\ Per C D A.
Proof.
  intros A B C D X Hncol HAC HBD Hpar1 Hpar2 Hper.
  pose proof Hncol as Hncol'. apply not_col_distincts in Hncol'.
  destruct Hncol' as [_ [HAB [HBC HACne]]].
  destruct (ender_pgram_opp_angles A B C D (conj HAB (conj HACne HBC))
              Hncol Hpar1 Hpar2) as [Hopp1 Hopp2].
  assert (HperCDA : Per C D A) by (apply (l11_17 A B C); assumption).
  assert (HperBCD : Per B C D).
  { apply (ender_suppa_per _ _ _ A B C);
      [apply suppa_sym, (ender_pgram_consec_angles A B C D X); assumption
      |exact Hper]. }
  assert (HperDAB : Per D A B) by (apply (l11_17 B C D); assumption).
  auto.
Qed.

(** Both pairs of opposite sides congruent make a parallelogram: the diagonal
    cuts two triangles that agree side for side, so the alternate interior
    angles it makes are congruent, and the crossing point is the [TS] that
    [l12_21_b] turns them back into a parallel with -- all neutral. *)
Lemma ender_pgram_from_opposite_sides : forall A B C D X,
  ~ Col A B C -> BetS A X C -> BetS B X D ->
  Cong A B C D -> Cong B C D A ->
  Par A B C D.
Proof.
  intros A B C D X Hncol HAC HBD Hab Hbc.
  destruct (ender_quad_no_three_collinear A B C D X Hncol HAC HBD)
    as [_ [Hcda _]].
  destruct HAC as [HbetAC [HAX HXC]]. destruct HBD as [HbetBD [HBX HXD]].
  assert (Hts : TS A C B D).
  { repeat split.
    - intro. apply Hncol. Col.
    - intro. apply Hcda. Col.
    - exists X. split; [Col|assumption]. }
  destruct (ender_sss A B C C D A) as [_ [_ [_ [Hangle _]]]];
    [exact Hncol|exact Hab|exact Hbc|apply cong_pseudo_reflexivity|].
  now apply l12_21_b.
Qed.

(** A parallelogram with one pair of congruent adjacent sides has all four
    sides congruent, spelled as the audited [IsRhombus] wants them. *)
Lemma ender_rhombus_sides : forall A B C D X,
  ~ Col A B C -> BetS A X C -> BetS B X D ->
  Par A B C D -> Par B C D A ->
  Cong A B B C \/ Cong B C C D \/ Cong C D D A \/ Cong D A A B ->
  Cong A B B C /\ Cong B C C D /\ Cong C D D A.
Proof.
  intros A B C D X Hncol HAC HBD Hab Hbc Hadj.
  destruct (ender_pgram_opp_sides A B C D X Hncol HAC HBD Hab Hbc)
    as [Hopp1 Hopp2].
  assert (Hcd_ab : Cong C D A B) by Cong.
  assert (Hda_bc : Cong D A B C) by Cong.
  destruct Hadj as [H|[H|[H|H]]]; repeat split;
    eauto 7 using cong_transitivity, cong_symmetry,
      cong_left_commutativity, cong_right_commutativity.
Qed.

(** One parallel-and-congruent opposite pair, together with the crossing
    diagonals of a well-formed quadrilateral, is already a parallelogram:
    the crossing point supplies the [TS] hypothesis of [par_cong_mid_ts],
    whose midpoint is the shared diagonal midpoint of [Plg]. *)
Lemma ender_pgram_from_side : forall A B C D X,
  ~ Col A B C -> BetS A X C -> BetS B X D ->
  Par A B C D -> Cong A B C D ->
  Par B C D A.
Proof.
  intros A B C D X Hncol HAC HBD Hpar Hcong.
  destruct (ender_quad_no_three_collinear A B C D X Hncol HAC HBD)
    as [Hbcd [Hcda Hdab]].
  destruct HAC as [HbetAC [HAX HXC]]. destruct HBD as [HbetBD [HBX HXD]].
  assert (HneAC : A <> C).
  { intro Heq. subst C. apply HAX, between_identity. assumption. }
  assert (Hstrict : Par_strict A B C D).
  { destruct Hpar as [Hs|[HneAB [HneCD [Hacd Hbcd']]]]; [assumption|].
    exfalso. apply Hcda. Col. }
  assert (HcolXAC : Col X A C) by (apply bet_col in HbetAC; Col).
  assert (Hts : TS A C B D).
  { repeat split.
    - intro. apply Hncol. Col.
    - intro. apply Hcda. Col.
    - exists X. split; assumption. }
  destruct (par_cong_mid_ts A B C D Hstrict Hcong Hts) as [M [Hmac Hmbd]].
  assert (Hplg : Parallelogram A B C D).
  { apply plg_to_parallelogram. split; [left; exact HneAC|exists M; auto]. }
  apply plg_par in Hplg;
    [|intro Heq; subst B; apply Hncol; Col
     |intro Heq; subst C; apply Hncol; Col].
  destruct Hplg as [_ Had]. apply par_symmetry, par_left_comm. exact Had.
Qed.

(** Congruent diagonals make a parallelogram a rectangle.  Each diagonal cuts
    a triangle off the shared side, and those two triangles agree side for
    side, so the two corners on that side are congruent -- and being
    consecutive corners they are also supplementary, which leaves them
    right. *)
Lemma ender_pgram_con_diagonals_right : forall A B C D X,
  ~ Col A B C -> BetS A X C -> BetS B X D ->
  Par A B C D -> Par B C D A -> Cong A C B D ->
  Per D A B /\ Per A B C /\ Per B C D /\ Per C D A.
Proof.
  intros A B C D X Hncol HAC HBD Hpar1 Hpar2 Hdiag.
  destruct (ender_pgram_opp_sides A B C D X Hncol HAC HBD Hpar1 Hpar2)
    as [_ Hbc_da].
  destruct (ender_quad_no_three_collinear A B C D X Hncol HAC HBD)
    as [_ [_ Hdab]].
  pose proof Hncol as Hdistinct. apply not_col_distincts in Hdistinct.
  destruct Hdistinct as [_ [HAB [HBC _]]].
  destruct (ender_sss A B C B A D) as [_ [_ [_ [_ [Hcorners _]]]]];
    [exact Hncol|apply cong_pseudo_reflexivity|Cong|Cong|].
  assert (Hsupp : SuppA D A B A B C).
  { apply (ender_pgram_consec_angles D A B C X Hdab
             (ender_bets_sym _ _ _ HBD) HAC (par_symmetry _ _ _ _ Hpar2)). }
  assert (Hsame : CongA D A B A B C)
    by (apply conga_left_comm, conga_sym, Hcorners).
  assert (Hper : Per A B C).
  { apply suppa__per, (conga2_suppa__suppa D A B A B C);
      [exact Hsame
      |apply conga_refl; [exact HAB|now apply not_eq_sym]
      |exact Hsupp]. }
  exact (ender_pgram_right_corner A B C D X Hncol HAC HBD Hpar1 Hpar2 Hper).
Qed.

(** Perpendicular diagonals make a parallelogram a rhombus.  GeoCoq's
    [perp_rmb] wants the figure in its own midpoint spelling and returns one
    pair of congruent adjacent sides; [ender_rhombus_sides] spreads that
    around the audited chain. *)
Lemma ender_pgram_perp_diagonals_rhombus : forall A B C D X,
  ~ Col A B C -> BetS A X C -> BetS B X D ->
  Par A B C D -> Par B C D A -> Perp A C B D ->
  Cong A B B C /\ Cong B C C D /\ Cong C D D A.
Proof.
  intros A B C D X Hncol HAC HBD Hpar1 Hpar2 Hperp.
  assert (Hplg : Plg A B C D)
    by (apply ender_pgram_plg; assumption).
  destruct (perp_rmb A B C D Hplg Hperp) as [_ Hadjacent].
  apply (ender_rhombus_sides A B C D X); auto.
Qed.

(** One diagonal of a parallelogram bisecting the corner it leaves makes the
    parallelogram a rhombus.  The diagonal is a transversal of one pair of
    parallel sides, so the half it cuts off at the far corner is congruent to
    the half at the near one; with the bisected halves congruent too, the
    triangle on that diagonal has congruent base angles. *)
Lemma ender_pgram_bisector_rhombus : forall A B C D X,
  ~ Col A B C -> BetS A X C -> BetS B X D ->
  Par A B C D -> Par B C D A -> CongA B A C C A D ->
  Cong A B B C /\ Cong B C C D /\ Cong C D D A.
Proof.
  intros A B C D X Hncol HAC HBD Hpar1 Hpar2 Hbisects.
  destruct (ender_quad_no_three_collinear A B C D X Hncol HAC HBD)
    as [_ [Hcda _]].
  pose proof HAC as HACcopy. destruct HACcopy as [HbetAC [HAX HXC]].
  pose proof HBD as HBDcopy. destruct HBDcopy as [HbetBD [HBX HXD]].
  assert (HcolXAC : Col X A C) by (apply bet_col in HbetAC; Col).
  assert (Hts : TS A C B D).
  { repeat split.
    - intro. apply Hncol. Col.
    - intro. apply Hcda. Col.
    - exists X. split; assumption. }
  assert (Halt : CongA B A C D C A)
    by (apply ender_alternate_interior; assumption).
  assert (Hbase : CongA D A C D C A).
  { apply conga_left_comm.
    apply (conga_trans C A D B A C D C A); [now apply conga_sym|exact Halt]. }
  assert (Hlegs : Cong D A D C).
  { apply ender_base_angle_conv; [intro; apply Hcda; Col|exact Hbase]. }
  apply (ender_rhombus_sides A B C D X); auto.
  right. right. left. Cong.
Qed.

(** The diagonal from [A] runs inside the corner there, so the corner is the
    sum of the two halves it cuts. *)
Lemma ender_quad_corner_split : forall A B C D X,
  ~ Col A B C -> BetS A X C -> BetS B X D ->
  SumA D A C C A B D A B /\ SAMS D A C C A B.
Proof.
  intros A B C D X Hncol HAC HBD.
  destruct (ender_quad_no_three_collinear A B C D X Hncol HAC HBD)
    as [Hbcd [Hcda Hdab]].
  pose proof HAC as HACcopy. destruct HACcopy as [HbetAC [HAX HXC]].
  pose proof HBD as HBDcopy. destruct HBDcopy as [HbetBD [HBX HXD]].
  apply not_col_distincts in Hdab. destruct Hdab as [_ [HDA [HAB HDB]]].
  apply not_col_distincts in Hncol. destruct Hncol as [_ [_ [_ HAC']]].
  assert (Hin : InAngle C D A B).
  { repeat split; [now apply not_eq_sym|now apply not_eq_sym
                  |now apply not_eq_sym|].
    exists X. split; [now apply between_symmetry|right].
    repeat split; [now apply not_eq_sym|now apply not_eq_sym|now left]. }
  split; [now apply inangle__suma|now apply inangle__sams].
Qed.

(** The two angles of a triangle other than the one at [B] sum to its
    supplement: the Euclidean triangle sum, regrouped so that the angle to be
    cancelled is the one added last. *)
Lemma ender_triangle_other_two : forall A B C G H I,
  ~ Col A B C -> SumA B C A C A B G H I -> SuppA G H I A B C.
Proof.
  intros A B C G H I Hncol Hsum.
  apply not_col_distincts in Hncol. destruct Hncol as [_ [HAB [HBC HCA]]].
  destruct (ex_trisuma B C A) as [P [Q [R Htri]]];
    [assumption|now apply not_eq_sym|now apply not_eq_sym|].
  pose proof Htri as Htricopy.
  destruct Htricopy as [G0 [H0 [I0 [Hsum0 Hsum1]]]].
  assert (Hconga : CongA G H I G0 H0 I0)
    by (apply (suma2__conga B C A C A B); assumption).
  apply (conga2_suppa__suppa G0 H0 I0 A B C);
    [now apply conga_sym
    |apply conga_refl; [assumption|now apply not_eq_sym]
    |].
  apply (bet_suma__suppa _ _ _ _ _ _ P Q R); [exact Hsum1|].
  now apply (euclidean_trisuma__bet B C A P Q R).
Qed.

(** Both pairs of opposite corners congruent make consecutive corners
    supplementary, which is what the parallel needs.  Each diagonal cuts the
    two corners it runs between into halves, and the two triangles it makes
    have the same angle sum, so the halves at one end of the diagonal are
    congruent to the ones at the other.  Only *ordering* shows that, not
    cancellation: if one half were the larger the opposite-corner hypothesis
    would make its partner the larger too, and then the two triangles could
    not have the same angle sum. *)
Lemma ender_quad_opposite_angles : forall A B C D X,
  ~ Col A B C -> BetS A X C -> BetS B X D ->
  CongA D A B B C D -> CongA A B C C D A ->
  SuppA A B C B C D.
Proof.
  intros A B C D X Hncol HAC HBD HopA HopB.
  destruct (ender_quad_no_three_collinear A B C D X Hncol HAC HBD)
    as [Hbcd [Hcda Hdab]].
  destruct (ender_quad_corner_split A B C D X Hncol HAC HBD)
    as [HsumA HsamsA].
  destruct (ender_quad_corner_split C D A B X Hcda
              (ender_bets_sym _ _ _ HAC) (ender_bets_sym _ _ _ HBD))
    as [HsumC HsamsC].
  pose proof Hncol as Hd1. apply not_col_distincts in Hd1.
  destruct Hd1 as [_ [HAB [HBC HACne]]].
  pose proof Hcda as Hd2. apply not_col_distincts in Hd2.
  destruct Hd2 as [_ [HCD [HDA _]]].
  (* the two halves each diagonal end is cut into, summed *)
  destruct (ex_suma B C A C A B) as [G [H [I HsumG]]];
    auto using not_eq_sym.
  destruct (ex_suma D C A C A D) as [G' [H' [I' HsumG'']]];
    auto using not_eq_sym.
  destruct (suma_distincts B C A C A B G H I HsumG)
    as [_ [_ [_ [_ [HGH HHI]]]]].
  destruct (suma_distincts D C A C A D G' H' I' HsumG'')
    as [_ [_ [_ [_ [HGH' HHI']]]]].
  assert (HsumG' : SumA A C D D A C G' H' I').
  { apply (conga3_suma__suma D C A C A D G' H' I');
      [exact HsumG''
      |apply conga_pseudo_refl; auto using not_eq_sym
      |apply conga_pseudo_refl; auto using not_eq_sym
      |apply conga_refl; auto using not_eq_sym]. }
  (* both sums are the supplement of the same corner *)
  pose proof (ender_triangle_other_two A B C G H I Hncol HsumG) as HsuppG.
  assert (HsuppG' : SuppA G' H' I' A B C).
  { apply (conga2_suppa__suppa G' H' I' A D C);
      [apply conga_refl; auto using not_eq_sym
      |apply conga_sym, (conga_trans A B C C D A A D C);
         [exact HopB|apply conga_pseudo_refl; auto using not_eq_sym]
      |apply (ender_triangle_other_two A D C);
         [intro; apply Hcda; Col|exact HsumG'']]. }
  assert (Hhalves : CongA G H I G' H' I')
    by (apply (suppa2__conga123 _ _ _ A B C); assumption).
  assert (HsamsGA : SAMS B C A C A B)
    by (apply sams123231; auto using not_eq_sym).
  destruct (or_lta2_conga D A C B C A) as [Hlt|[Hlt|Hcong]];
    auto using not_eq_sym.
  - (* the half at A is the smaller, so its partner at C is the larger, and
       the two triangle sums cannot then agree *)
    exfalso.
    assert (Hother : LtA A C D C A B).
    { apply (sams_lea_lta123_suma2__lta456 B C A A C D B C D D A C C A B D A B);
        [exact Hlt|apply conga__lea, conga_sym, HopA|exact HsamsC
        |exact HsumC|exact HsumA]. }
    assert (Hbigger : LtA G' H' I' G H I).
    { apply (sams_lea_lta123_suma2__lta D A C A C D G' H' I' B C A C A B G H I);
        [exact Hlt|now apply lta__lea|exact HsamsGA
        |now apply suma_sym|exact HsumG]. }
    apply (lta__nlea _ _ _ _ _ _ Hbigger), conga__lea, Hhalves.
  - exfalso.
    assert (Hother : LtA C A B A C D).
    { apply (sams_lea_lta123_suma2__lta456 D A C C A B D A B B C A A C D B C D);
        [exact Hlt|apply conga__lea, HopA|exact HsamsA
        |exact HsumA|exact HsumC]. }
    assert (HsamsAC : SAMS D A C A C D)
      by (apply sams123231; auto using not_eq_sym).
    assert (Hbigger : LtA G H I G' H' I').
    { apply (sams_lea_lta123_suma2__lta B C A C A B G H I D A C A C D G' H' I');
        [exact Hlt|now apply lta__lea|exact HsamsAC
        |exact HsumG|now apply suma_sym]. }
    apply (lta__nlea _ _ _ _ _ _ Hbigger), conga__lea, conga_sym, Hhalves.
  - (* congruent halves: the corner sums cancel, and the two sums agree *)
    assert (Hsecond : CongA C A B A C D).
    { apply (sams2_suma2__conga456 B C A _ _ _ _ _ _ B C D);
        [exact HsamsGA|exact HsamsC
        |apply (conga3_suma__suma D A C C A B D A B);
           [exact HsumA|exact Hcong
           |apply conga_refl; auto using not_eq_sym
           |exact HopA]
        |exact HsumC]. }
    apply suppa_sym.
    apply (conga2_suppa__suppa G H I A B C);
      [|apply conga_refl; auto using not_eq_sym|exact HsuppG].
    apply (suma2__conga B C A C A B); [exact HsumG|].
    apply (conga3_suma__suma B C A A C D B C D);
      [exact HsumC
      |apply conga_refl; auto using not_eq_sym
      |now apply conga_sym
      |apply conga_refl; auto using not_eq_sym].
Qed.

(** In a trapezoid the two diagonals are congruent exactly when the base
    angles are, and both readings come from the crossing point: the parallel
    sides make the alternate interior angles at the two ends of each diagonal
    congruent, so the triangle the crossing cuts off one parallel side is
    isosceles exactly when the one it cuts off the other is.  This is the
    congruent-diagonals direction. *)
Lemma ender_isos_trap_base_angles : forall A B C D X,
  ~ Col A B C -> BetS A X C -> BetS B X D ->
  Par A B C D -> Cong A C B D ->
  CongA D A B A B C.
Proof.
  intros A B C D X Hncol HAC HBD Hpar Hdiag.
  destruct (ender_quad_no_three_collinear A B C D X Hncol HAC HBD)
    as [Hbcd [Hcda Hdab]].
  pose proof Hncol as Hd1. apply not_col_distincts in Hd1.
  destruct Hd1 as [_ [HAB [HBC HACne]]].
  pose proof Hcda as Hd2. apply not_col_distincts in Hd2.
  destruct Hd2 as [_ [HCD [HDA _]]].
  pose proof HAC as HACc. destruct HACc as [HbetAC [HAX HXC]].
  pose proof HBD as HBDc. destruct HBDc as [HbetBD [HBX HXD]].
  assert (HcolXAC : Col X A C) by (apply bet_col in HbetAC; Col).
  assert (HcolXBD : Col X B D) by (apply bet_col in HbetBD; Col).
  assert (HoutAC : Out A X C)
    by (apply bet_out; [now apply not_eq_sym|assumption]).
  assert (HoutCA : Out C X A)
    by (apply bet_out; [assumption|now apply between_symmetry]).
  assert (HoutBD : Out B X D)
    by (apply bet_out; [now apply not_eq_sym|assumption]).
  assert (HoutDB : Out D X B)
    by (apply bet_out; [assumption|now apply between_symmetry]).
  (* neither diagonal end lies on the other diagonal *)
  assert (HncolXAB : ~ Col X A B).
  { intro Hcol. apply Hncol.
    apply (col3 A X); [auto using not_eq_sym|Col|Col|Col]. }
  assert (HncolXCD : ~ Col X C D).
  { intro Hcol. apply Hcda.
    apply (col3 C X); [auto using not_eq_sym|Col|Col|Col]. }
  (* each half-diagonal names the same ray as the whole one *)
  assert (HangA : CongA X A B C A B)
    by (apply out2__conga; [now apply l6_6|apply out_trivial; auto]).
  assert (HangB : CongA X B A D B A)
    by (apply out2__conga; [now apply l6_6
                           |apply out_trivial; auto using not_eq_sym]).
  assert (HangC : CongA X C D A C D)
    by (apply out2__conga; [now apply l6_6|apply out_trivial; auto]).
  assert (HangD : CongA X D C B D C)
    by (apply out2__conga; [now apply l6_6
                           |apply out_trivial; auto using not_eq_sym]).
  (* the alternate interior angles each diagonal makes *)
  assert (Hts1 : TS A C B D).
  { repeat split; [intro; apply Hncol; Col|intro; apply Hcda; Col|].
    exists X. split; assumption. }
  assert (Hts2 : TS B D A C).
  { repeat split; [intro; apply Hdab; Col|intro; apply Hbcd; Col|].
    exists X. split; [Col|assumption]. }
  assert (Hu : CongA C A B A C D).
  { apply conga_comm, ender_alternate_interior; assumption. }
  assert (Hv : CongA D B A B D C).
  { apply conga_comm, ender_alternate_interior; [exact Hts2|Par]. }
  destruct (or_lt_cong_gt X A X B) as [Hlt|[Hgt|Hcong]].
  - (* the near half at A is the shorter, so the far half at C is too, and
       the diagonals cannot then agree *)
    exfalso.
    assert (Hnear : LtA X B A X A B)
      by (apply l11_44_2_a; [intro; apply HncolXAB; Col|exact Hlt]).
    assert (Hfar : LtA X D C X C D).
    { apply (conga_preserves_lta B D C A C D);
        [now apply conga_sym|now apply conga_sym|].
      apply (conga_preserves_lta D B A C A B);
        [exact Hv|exact Hu|].
      apply (conga_preserves_lta X B A X A B);
        [exact HangB|exact HangA|exact Hnear]. }
    apply (cong__nlt A C B D Hdiag).
    apply (bet2_lt2__lt X X B D A C);
      [assumption|assumption|exact Hlt|].
    apply (l11_44_2_b D X C). exact Hfar.
  - exfalso.
    assert (Hnear : LtA X A B X B A)
      by (apply (l11_44_2_a B X A); [intro; apply HncolXAB; Col|exact Hgt]).
    assert (Hfar : LtA X C D X D C).
    { apply (conga_preserves_lta A C D B D C);
        [now apply conga_sym|now apply conga_sym|].
      apply (conga_preserves_lta C A B D B A);
        [exact Hu|exact Hv|].
      apply (conga_preserves_lta X A B X B A);
        [exact HangA|exact HangB|exact Hnear]. }
    apply (cong__nlt B D A C (cong_symmetry _ _ _ _ Hdiag)).
    apply (bet2_lt2__lt X X A C B D);
      [assumption|assumption|exact Hgt|].
    apply (l11_44_2_b C X D). exact Hfar.
  - (* congruent halves: the near triangle is isosceles, and the two halves
       of the figure then agree side-angle-side *)
    assert (Hbase : CongA X A B X B A)
      by (apply ender_base_angle; [intro; apply HncolXAB; Col|exact Hcong]).
    assert (Hcorner : CongA C A B D B A).
    { apply (conga_trans C A B X B A);
        [apply (conga_trans C A B X A B);
           [now apply conga_sym|exact Hbase]
        |exact HangB]. }
    destruct (ender_sas A B C B A D) as [_ [_ [_ [_ [Hangle _]]]]];
      [exact Hncol|apply cong_pseudo_reflexivity|now apply conga_comm
      |exact Hdiag|].
    apply conga_left_comm, conga_sym, Hangle.
Qed.

Lemma ender_playfair : playfair_s_postulate.
Proof.
  apply tarski_s_euclid_implies_playfair.
  unfold tarski_s_parallel_postulate. exact euclid.
Qed.

(** Parallel lines are transitive.  This is GeoCoq's
    [playfair_implies_par_trans] with its one [CopR] reflection call replaced
    by explicit plane pasting through [coplanar_pseudo_trans]: the reflection
    tactic's proof term depends on [Eqdep.Eq_rect_eq], and this development
    stays free of axioms. *)
Lemma ender_par_trans : forall A1 A2 B1 B2 C1 C2,
  Par A1 A2 B1 B2 -> Par B1 B2 C1 C2 -> Par A1 A2 C1 C2.
Proof.
  intros A1 A2 B1 B2 C1 C2 HAB HBC.
  pose proof ender_playfair as HP.
  assert_diffs.
  destruct (cop_dec A1 A2 C1 B1) as [Hcop|HNCop];
    [induction (col_dec A1 A2 C1)|].
  - right.
    destruct (HP B1 B2 C1 C2 A1 A2 C1); repeat split; Par; Col.
  - left.
    split.
    { apply par_symmetry in HBC.
      destruct HBC as [HBCs|HBCd]; [destruct HAB as [HABs|HABd]|].
      - assert (HncolAB : ~ Col A1 A2 B1)
          by (apply par_strict_not_col_1 with B2; exact HABs).
        assert (HncolBC : ~ Col B1 B2 C1).
        { apply par_strict_not_col_1 with C2.
          apply par_strict_symmetry. exact HBCs. }
        assert (Ha1 : Coplanar B1 B2 C1 A1).
        { apply coplanar_pseudo_trans with A1 A2 B1;
            [exact HncolAB|Cop|apply pars__coplanar; exact HABs|Cop|Cop]. }
        assert (Ha2 : Coplanar B1 B2 C1 A2).
        { apply coplanar_pseudo_trans with A1 A2 B1;
            [exact HncolAB|Cop|apply pars__coplanar; exact HABs|Cop|Cop]. }
        apply coplanar_pseudo_trans with B1 B2 C1;
          [exact HncolBC|exact Ha1|exact Ha2|Cop|].
        assert (Hcp := pars__coplanar _ _ _ _ HBCs). Cop.
      - spliter. apply coplanar_perm_16, col2_cop__cop with B1 B2; Col; Cop.
      - spliter. apply col2_cop__cop with B1 B2; Col; Cop.
    }
    intros [X []].
    destruct (HP B1 B2 A1 A2 C1 C2 X); Par; Col.
  - apply (par_not_col_strict A1 A2 B1 B2 B1) in HAB;
      [|Col|intro; apply HNCop; Cop].
    apply (par_not_col_strict B1 B2 C1 C2 C1) in HBC;
      [|Col|intro; apply HNCop, coplanar_perm_1, col_cop__cop with B2; Cop].
    destruct (cop_osp__ex_cop2 A1 A2 C1 B1 B2 C1) as [C' [HCop1 [HCop2 HC1C']]];
      Cop.
      apply cop2_os__osp with A1 A2; Side; Cop.
    assert (HC' : forall X, Coplanar A1 A2 B1 X -> ~ Col X C1 C').
    { intros X HX1 HX2.
      apply (par_not_col A1 A2 B1 B2 X HAB).
      - apply (l9_30 A1 A2 C1 A1 A2 B1 B1); Cop.
          apply par_strict_not_col_1 with B2, HAB.
        apply col_cop__cop with C'; Col.
      - apply (l9_30 A1 A2 B1 B1 B2 C1 C1); Cop.
          apply par_strict_not_col_1 with C2, HBC.
        apply col_cop__cop with C'; Col.
    }
    left; apply par_strict_col_par_strict with C'; auto.
    { split; trivial.
      intros [X [HX1 HX2]].
      revert HX2.
      apply HC'; Cop.
    }
    assert (HBC' : Par_strict B1 B2 C1 C').
    { split; trivial.
      intros [X [HX1 HX2]].
      revert HX2.
      apply HC', col_cop__cop with B2; Col; Cop.
    }
    destruct (HP B1 B2 C1 C2 C1 C' C1); Par; Col.
Qed.

(** The master congruences of a transversal figure: with the audited
    configuration and the lines parallel, both alternate interior pairs are
    congruent.  Every other angle relation of the figure is neutral algebra
    over these two. *)
Lemma ender_transversal_master : forall T1 I1 I2 T2 A B C D,
  BetS T1 I1 I2 -> BetS I1 I2 T2 -> BetS A I1 B -> BetS C I2 D ->
  OS I1 I2 A C -> Par A B C D ->
  CongA A I1 I2 D I2 I1 /\ CongA B I1 I2 C I2 I1.
Proof.
  intros T1 I1 I2 T2 A B C D Ht1 Ht2 Hab Hcd Hos Hpar.
  destruct Hab as [HbetAB [HneAI1 HneI1B]].
  destruct Hcd as [HbetCD [HneCI2 HneI2D]].
  assert (HncolA : ~ Col I1 I2 A) by (apply one_side_not_col123 with C; auto).
  assert (HncolC : ~ Col I1 I2 C)
    by (apply one_side_not_col123 with A; auto using one_side_symmetry).
  assert (HcolAB1 : Col A B I1) by (apply bet_col in HbetAB; Col).
  assert (HcolCD2 : Col C D I2) by (apply bet_col in HbetCD; Col).
  assert (HncolB : ~ Col I1 I2 B).
  { intro Hcol.
    assert (Hstep : Col I1 A I2)
      by (apply (col_transitivity_1 I1 B A I2 HneI1B); Col).
    apply HncolA. Col. }
  assert (HncolD : ~ Col I1 I2 D).
  { intro Hcol.
    assert (Hstep : Col I2 C I1)
      by (apply (col_transitivity_1 I2 D C I1 HneI2D); Col).
    apply HncolC. Col. }
  assert (HtsAB : TS I1 I2 A B).
  { repeat split; [intro; apply HncolA; Col|intro; apply HncolB; Col|].
    exists I1. split; [Col|assumption]. }
  assert (HtsCD : TS I1 I2 C D).
  { repeat split; [intro; apply HncolC; Col|intro; apply HncolD; Col|].
    exists I2. split; [Col|assumption]. }
  assert (HtsAD : TS I1 I2 A D).
  { apply l9_8_2 with C; [exact HtsCD|now apply one_side_symmetry]. }
  assert (HtsBC : TS I1 I2 B C).
  { apply l9_2. apply l9_8_2 with A; assumption. }
  assert (HneI1A : I1 <> A) by (intro Heq; apply HneAI1; auto).
  assert (HneI2C : I2 <> C) by (intro Heq; apply HneCI2; auto).
  assert (HparProjD : Par A B I2 D)
    by (apply (par_col2_par A B C D I2 D HneI2D Hpar); Col).
  assert (HparAD : Par I1 A I2 D).
  { apply par_symmetry.
    apply (par_col2_par I2 D A B I1 A HneI1A); [now apply par_symmetry|Col|Col]. }
  assert (HparProjC : Par A B I2 C)
    by (apply (par_col2_par A B C D I2 C HneI2C Hpar); Col).
  assert (HparBC : Par I1 B I2 C).
  { apply par_symmetry.
    apply (par_col2_par I2 C A B I1 B HneI1B); [now apply par_symmetry|Col|Col]. }
  split.
  - apply ender_alternate_interior; assumption.
  - apply ender_alternate_interior; assumption.
Qed.

(** The remaining forward families are the master congruences carried around
    the figure by its vertical angles and linear pairs. *)
Lemma ender_transversal_altext : forall T1 I1 I2 T2 A B C D,
  BetS T1 I1 I2 -> BetS I1 I2 T2 -> BetS A I1 B -> BetS C I2 D ->
  OS I1 I2 A C -> Par A B C D ->
  CongA T1 I1 A T2 I2 D /\ CongA T1 I1 B T2 I2 C.
Proof.
  intros T1 I1 I2 T2 A B C D Ht1 Ht2 Hab Hcd Hos Hpar.
  destruct (ender_transversal_master T1 I1 I2 T2 A B C D
              Ht1 Ht2 Hab Hcd Hos Hpar) as [Hm1 Hm2].
  destruct (ender_transversal_verticals T1 I1 I2 T2 A B C D Ht1 Ht2 Hab Hcd)
    as [Hv1 [Hv1' [Hv2 Hv2']]].
  split.
  - apply conga_trans with I2 I1 B; [exact Hv1|].
    apply conga_trans with I1 I2 C; [|exact Hv2].
    apply conga_comm. exact Hm2.
  - apply conga_trans with I2 I1 A; [exact Hv1'|].
    apply conga_trans with I1 I2 D; [|exact Hv2'].
    apply conga_comm. exact Hm1.
Qed.

Lemma ender_transversal_corresp : forall T1 I1 I2 T2 A B C D,
  BetS T1 I1 I2 -> BetS I1 I2 T2 -> BetS A I1 B -> BetS C I2 D ->
  OS I1 I2 A C -> Par A B C D ->
  CongA I2 I1 B T2 I2 D /\ CongA I2 I1 A T2 I2 C /\
  CongA T1 I1 A I1 I2 C /\ CongA T1 I1 B I1 I2 D.
Proof.
  intros T1 I1 I2 T2 A B C D Ht1 Ht2 Hab Hcd Hos Hpar.
  destruct (ender_transversal_master T1 I1 I2 T2 A B C D
              Ht1 Ht2 Hab Hcd Hos Hpar) as [Hm1 Hm2].
  destruct (ender_transversal_verticals T1 I1 I2 T2 A B C D Ht1 Ht2 Hab Hcd)
    as [Hv1 [Hv1' [Hv2 Hv2']]].
  split; [|split; [|split]].
  - apply conga_trans with I1 I2 C; [|exact Hv2].
    apply conga_comm. exact Hm2.
  - apply conga_trans with I1 I2 D; [|exact Hv2'].
    apply conga_comm. exact Hm1.
  - apply conga_trans with I2 I1 B; [exact Hv1|].
    apply conga_comm. exact Hm2.
  - apply conga_trans with I2 I1 A; [exact Hv1'|].
    apply conga_comm. exact Hm1.
Qed.

Lemma ender_transversal_sameside : forall T1 I1 I2 T2 A B C D,
  BetS T1 I1 I2 -> BetS I1 I2 T2 -> BetS A I1 B -> BetS C I2 D ->
  OS I1 I2 A C -> Par A B C D ->
  SuppA B I1 I2 I1 I2 D /\ SuppA A I1 I2 I1 I2 C.
Proof.
  intros T1 I1 I2 T2 A B C D Ht1 Ht2 Hab Hcd Hos Hpar.
  destruct (ender_transversal_master T1 I1 I2 T2 A B C D
              Ht1 Ht2 Hab Hcd Hos Hpar) as [Hm1 Hm2].
  destruct Hab as [HbetAB [HneAI1 HneI1B]].
  assert (HneBI1 : B <> I1) by (intro Heq; apply HneI1B; auto).
  split.
  - split; [exact HneBI1|]. exists A.
    split; [apply between_symmetry; exact HbetAB|].
    apply conga_sym, conga_comm. exact Hm1.
  - split; [exact HneAI1|]. exists B.
    split; [exact HbetAB|].
    apply conga_sym, conga_comm. exact Hm2.
Qed.

(** Thales' circle theorem, through the postulate web rather than GeoCoq's
    [midpoint_thales] or [thales_theorem], whose proofs rest on
    [Eqdep.Eq_rect_eq] (through [cop_par_perp__perp] and [right_saccheris]
    respectively).  The right-Saccheri hypothesis follows cleanly from the
    existence of one triangle with straight angle sum, witnessed by the
    lower-dimension points and [euclidean_trisuma__bet]. *)
Lemma ender_rah : postulate_of_right_saccheri_quadrilaterals.
Proof.
  apply existential_triangle__rah.
  assert (Hncol : ~ Col PA PB PC) by exact lower_dim.
  assert (Hd := Hncol). apply not_col_distincts in Hd.
  destruct Hd as [_ [HAB [HBC HAC]]].
  destruct (ex_trisuma PA PB PC) as [P [Q [R Htri]]]; auto.
  exists PA, PB, PC, P, Q, R.
  split; [exact Hncol|]. split; [exact Htri|].
  exact (euclidean_trisuma__bet _ _ _ _ _ _ Htri).
Qed.

Lemma ender_thales : forall A B C M,
  Midpoint M A B -> Cong M A M C -> Per A C B.
Proof.
  exact (rah__thales_postulate ender_rah).
Qed.

End EnderEuclideanGeometry.
