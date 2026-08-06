Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Require Import GeoCoq.Axioms.parallel_postulates.
Require Import GeoCoq.Main.Annexes.suma.
Require Import GeoCoq.Main.Meta_theory.Parallel_postulates.tarski_playfair.
Require Import GeoCoq.Main.Meta_theory.Parallel_postulates.playfair_par_trans.
Require Import GeoCoq.Main.Meta_theory.Parallel_postulates.playfair_alternate_interior_angles.
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
