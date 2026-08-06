Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Require Import GeoCoq.Axioms.parallel_postulates.
Require Import GeoCoq.Main.Annexes.suma.
Require Import GeoCoq.Main.Meta_theory.Parallel_postulates.tarski_playfair.
Require Import GeoCoq.Main.Annexes.quadrilaterals.
Require Import GeoCoq.Main.Annexes.quadrilaterals_inter_dec.
Require Import GeoCoq.Main.Meta_theory.Parallel_postulates.playfair_alternate_interior_angles.
Require Import GeoCoq.Main.Meta_theory.Parallel_postulates.alternate_interior_angles_triangle.

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

End EnderEuclideanGeometry.
