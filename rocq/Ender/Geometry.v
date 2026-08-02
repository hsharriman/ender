Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Require Import GeoCoq.Axioms.parallel_postulates.
Require Import GeoCoq.Main.Annexes.suma.
Require Import GeoCoq.Main.Meta_theory.Parallel_postulates.tarski_playfair.
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

End EnderEuclideanGeometry.
