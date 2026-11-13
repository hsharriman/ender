(** Euclidean lemmas without [Eqdep.Eq_rect_eq], for any development that
    needs them.

    GeoCoq proves each of these, but its proofs reach [Eqdep.Eq_rect_eq] --
    through the [CopR] coplanarity reflection, whose proof terms carry the
    axiom, or through Euclidean lemmas that do.  This file proves them again
    without it: [par_trans] and [l12_21_a] from [Geometry.v]'s Playfair route,
    and the rest as GeoCoq's own proofs with each [CopR] call replaced by
    [all_coplanar], which is why the section assumes a plane.

    The lemmas keep GeoCoq's names.  A file that copies a GeoCoq proof needing
    them imports [GhostEuclidean] after GeoCoq, so the copy's references
    resolve here and the copy stays axiom-free unchanged; [Similarity.v] does
    this for Desargues' theorem.  Any other file should name them qualified,
    as [Euclidean.GhostEuclidean.cop_par_perp__perp], so its own proofs keep
    resolving to GeoCoq.  GeoCoq is distributed under the LGPL v3. *)
Require Export GeoCoq.Main.Tarski_dev.Ch13_6_Desargues_Hessenberg.
Require Import GeoCoq.Main.Meta_theory.Parallel_postulates.tarski_euclid.
Require Import GeoCoq.Main.Meta_theory.Parallel_postulates.euclid_5_original_euclid.
Require Import GeoCoq.Main.Meta_theory.Parallel_postulates.original_euclid_original_spp.
Require Import GeoCoq.Main.Meta_theory.Parallel_postulates.original_spp_inverse_projection_postulate.
Require Import GeoCoq.Main.Meta_theory.Parallel_postulates.SPP_ID.
Require Import Ghost.Geometry.

Module GhostEuclidean.

Section Euclidean.

Context `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}.
Context {TE : @Tarski_euclidean Tn TnEQD}.
Context {T2D : @Tarski_2D Tn TnEQD}.

(** * Restated Euclidean lemmas *)

Lemma par_trans : forall A1 A2 B1 B2 C1 C2,
  Par A1 A2 B1 B2 -> Par B1 B2 C1 C2 -> Par A1 A2 C1 C2.
Proof. exact ghost_par_trans. Qed.

Lemma par_dec : forall A B C D, Par A B C D \/ ~ Par A B C D.
Proof. exact (par_trans__par_dec par_trans). Qed.

Lemma par_not_par : forall A B C D P Q,
  Par A B C D -> ~ Par A B P Q -> ~ Par C D P Q.
Proof.
  intros A B C D P Q HPar HNPar HNPar'.
  apply HNPar, par_trans with C D; Par.
Qed.

Lemma l12_21_a : forall A B C D,
  TS A C B D -> (Par A B C D -> CongA B A C D C A).
Proof. exact ghost_alternate_interior. Qed.

Lemma inverse_projection_postulate__proclus_bis :
  inverse_projection_postulate -> alternative_proclus_postulate.
Proof.
  intros ip A B C D P Q HPerp2 HNC1 HCop1 HInter HNC2 HCop2.
  assert(Par_strict C D A B)
    by (apply (col_cop_perp2__pars_bis P); [..|apply coplanar_perm_16|apply perp2_sym]; assumption).
  destruct HPerp2 as [P1 [P2 [HP [HPerpAP HPerpCP]]]].
  assert(HC0 := HPerpCP); auto.
  destruct HC0 as [C0 [_ [_ [HC0P [HC0C _]]]]].
  assert(HP' := HPerpAP); auto.
  destruct HP' as [P' HPerpP].
  assert(P'=P) by (apply (l8_14_2_1b _ P1 P2 A B); Col).
  subst P'.
  destruct HPerpP as [_ [_ [HPP _]]].
  assert(P<>C0) by (intro; subst C0; Col).
  apply (perp_col0 _ _ _ _ P C0) in HPerpAP; Col.
  apply (perp_col0 _ _ _ _ P C0) in HPerpCP; Col.
  clear dependent P1.
  clear dependent P2.

  assert(P<>Q) by (intro; subst; auto).
  elim(col_dec P Q C0).
    intro; exists C0; Col.
  intro HNCol1.
  assert(HNCol2 : ~ Col C0 A B) by (apply (par_not_col C D); auto).
  assert(HQ0 := cop_not_par_same_side A B Q P P C0).
  destruct HQ0 as [Q0 []]; Col.
    apply all_coplanar.
  assert(HNCol3 : ~ Col A B Q0) by (apply (one_side_not_col123 _ _ _ C0); Side).
  assert(P<>Q0) by (intro; subst; auto).
  assert(HNCol4 : ~ Col P C0 Q0) by (intro; apply HNCol1; ColR).
  assert_diffs.
  assert(HC1 : exists C1, Col C D C1 /\ C1 <> C0).
  { elim(eq_dec_points C C0).
      intro; subst C0; exists D; split; Col.
      intro; exists C; split; Col.
  }
  destruct HC1 as [C1 []].
  assert(HA0 : exists A0, Col A B A0 /\ OS P C0 Q0 A0).
  { elim(col_dec P C0 A).
    - intro.
      assert(~ Col P C0 B) by (intro; apply HNCol2; ColR).
      assert (HA0 := cop_not_par_same_side P C0 B A P Q0).
      destruct HA0 as [A0 []]; Col.
        apply coplanar_perm_22, col_cop__cop with A; Col; Cop.
      exists A0.
      split; Col.
    - intro.
      apply (cop_not_par_same_side _ _ _ _ P); Col.
      apply coplanar_perm_16, coplanar_trans_1 with B; [Col|Cop..].
  }
  destruct HA0 as [A0 []].
  assert(HNCol6 : ~ Col P C0 A0) by (apply (one_side_not_col123 _ _ _ Q0); Side).
  assert_diffs.

  assert(HY := ip C0 P Q0 C0 C1).
  destruct HY as [Y []]; [|Out..|apply (l8_16_1 C D); Col|apply all_coplanar|exists Y; split; ColR].
  exists C0, P, A0; split.
  apply (l8_16_1 A B); Col; Perp.
  split.

    {
    apply inangle__lea.
    apply os2__inangle; Side.
    apply (col2_os__os A B); auto.
    }

    {
    intro.
    assert(Out P Q0 A0) by (apply (conga_os__out C0); Side).
    apply HNCol3; ColR.
    }
Qed.

Lemma proclus_bis__proclus : alternative_proclus_postulate -> proclus_postulate.
Proof.
  intros proclus_bis A B C D P Q HPar HInter HNCol HCop.
  elim(col_dec C D P).
    intro; exists P; Col.
  intro HNCol1.
  apply par_symmetry in HPar.
  apply (par_not_col_strict _ _ _ _ P) in HPar; auto.
  assert(HC0 := l8_18_existence C D P).
  destruct HC0 as [C0 []]; auto.
  assert(HNCol2 : ~ Col C0 A B) by (apply (par_not_col C D); Col).
  assert_diffs.
  assert(HA0 : exists A0, Col A B A0 /\ ~ Col C0 P A0).
  { elim(col_dec C0 P A).
    - intro.
      assert(~ Col C0 P B) by (intro; apply HNCol2; ColR).
      exists B.
      split; Col.

    - intro.
      exists A.
      split; Col.
  }
  destruct HA0 as [A0 []].
  assert(HA' := l10_15 C0 P P A0).
  destruct HA' as [A' []]; Col.
  assert_diffs.
  assert (Coplanar C D P A0) by (apply col2_cop__cop with A B; Col; Cop).
  elim(col_dec A0 P A').
  - intro.
    apply (proclus_bis A0 P); Col; [|apply all_coplanar|intro; apply HNCol; ColR].
    exists C0.
    exists P.
    split; Col.
    split; [|Perp].
    apply perp_right_comm.
    apply (perp_col1 _ _ _ A'); Perp; Col.

  - intro.
    exfalso.
    assert(HY := proclus_bis A' P C D P A0).
    destruct HY as [Y []]; Col.

      {
      exists C0; exists P; repeat split; Col; Perp.
      }

      {
      apply all_coplanar.
      }

      {
      apply (par_not_col C D A B Y); ColR.
      }
Qed.

Lemma proclus_s_postulate_implies_strong_parallel_postulate :
  proclus_postulate -> strong_parallel_postulate.
Proof.
intros HP P Q R S T U HPTQ HRTS HNC1 HCop HCong1 Hcong2.
unfold BetS in *; spliter.
elim (col_dec P Q R); [exists P; split; ColR|intro HNC2].
destruct (HP P R Q S P U) as [I [HCol1 HCol2]]; [..|exists I; split]; Col.
apply l12_17 with T; [assert_diffs|split..]; Cong.
assert (Coplanar P Q R S) by (exists T; left; split; Col).
apply all_coplanar.
Qed.

Lemma inter_dec : decidability_of_intersection.
Proof.
  apply strong_parallel_postulate_implies_inter_dec,
        proclus_s_postulate_implies_strong_parallel_postulate,
        proclus_bis__proclus, inverse_projection_postulate__proclus_bis,
        original_spp__inverse_projection_postulate,
        original_euclid__original_spp, euclid_5__original_euclid,
        tarski_s_euclid_implies_euclid_5.
  unfold tarski_s_parallel_postulate. exact euclid.
Qed.

Lemma cop_npars__inter_exists :
 forall A1 B1 A2 B2,
  Coplanar A1 B1 A2 B2 -> ~ Par_strict A1 B1 A2 B2 ->
  exists X, Col X A1 B1 /\ Col X A2 B2.
Proof.
intros.
induction (eq_dec_points A1 B1).
  subst.
  exists A2.
  Col.
induction (eq_dec_points A2 B2).
  subst.
  exists A1.
  Col.
induction (inter_dec A1 B1 A2 B2).
  assumption.
exfalso.
apply H0.
split; assumption.
Qed.

Lemma cop_npar__inter_exists : forall A1 B1 A2 B2,
  Coplanar A1 B1 A2 B2 -> ~ Par A1 B1 A2 B2 -> exists X, Col X A1 B1 /\ Col X A2 B2.
Proof.
intros.
apply cop_npars__inter_exists.
  assumption.
intro.
apply H0.
left.
assumption.
Qed.

Lemma not_par_one_not_par : forall A B A' B' X Y, ~Par A B A' B' -> ~Par A B X Y \/ ~Par A' B' X Y.
Proof.
    intros.
    destruct (par_dec A B X Y).
      right.
      intro.
      apply H.
      apply par_trans with X Y; Par.
    left.
    assumption.
Qed.

Lemma l12_22_a : forall A B C D P,
 Out P A C -> OS P A B D -> Par A B C D ->
 CongA B A P D C P.
Proof.
    cut (forall A B C D P,
         A <> P -> Bet P A C -> OS P A B D -> Par A B C D ->
         CongA B A P D C P).
    { intros Haux A B C D P HOut HOS HPar.
      destruct HOut as [HAP [HCP [|]]].
        apply Haux; trivial.
      apply conga_sym, Haux; Par.
      apply col_one_side with A; Col; Side.
    }
    intros A B C D P HAP HBet HOS HPar.
    destruct (eq_dec_points A C).
    { subst C.
      apply out2__conga; [|apply out_trivial; auto].
      apply col_one_side_out with P; Side.
      apply par_id; Par.
    }
    destruct (segment_construction B A B A) as [B' []].
    assert_diffs.
    apply conga_trans with B' A C.
      apply l11_14; auto.
    apply l11_10 with B' C D A; try (apply out_trivial); auto; [|apply l6_6, bet_out; Between].
    apply l12_21_a; [|apply par_col_par_2 with B; Col].
    apply l9_2, l9_8_2 with B; [|apply col_one_side with P; Side; Col].
    assert (HNCol : ~ Col P A B) by (apply one_side_not_col123 with D, HOS).
    assert (HNCol1 : ~ Col B A C) by (intro; apply HNCol; ColR).
    repeat split; trivial.
      intro; apply HNCol1; ColR.
    exists A; Col.
Qed.

(** A line perpendicular to one of two parallels is perpendicular to the
    other.  GeoCoq derives this through Posidonius' postulate; here it is the
    alternate interior angles at the two crossings, one of them right. *)
Lemma cop_par_perp__perp : forall A B C D P Q,
  Par A B C D -> Perp A B P Q -> Coplanar C D P Q -> Perp C D P Q.
Proof.
  intros A B C D P Q HPar HPerp _.
  destruct (perp_inter_perp_in A B P Q HPerp) as [X [HXAB [HXPQ HPin]]].
  assert (HAB : A <> B) by (destruct HPin; tauto).
  assert (HPQ : P <> Q) by (destruct HPin as [_ [HPQ _]]; exact HPQ).
  assert (HCD : C <> D) by (apply par_distincts in HPar; tauto).
  destruct HPar as [Hs|[_ [_ [HcolC HcolD]]]].
  2: { apply perp_col2 with A B; [exact HPerp|exact HCD|ColR|ColR]. }
  assert (Hnpar : ~ Par C D P Q).
  { intro Hp. apply (perp_not_par A B P Q HPerp).
    apply par_trans with C D; [left; exact Hs|exact Hp]. }
  destruct (cop_npar__inter_exists C D P Q (all_coplanar _ _ _ _) Hnpar)
    as [Y [HYCD HYPQ]].
  assert (HnotCD : forall Z, Col Z A B -> ~ Col Z C D)
    by (intros Z HZ HZ'; apply Hs; exists Z; split; Col).
  assert (HXY : X <> Y) by (intro; subst Y; apply (HnotCD X); Col).
  assert (HU : exists U, Col U A B /\ U <> X).
  { destruct (eq_dec_points A X) as [->|HAX];
      [exists B; split; Col|exists A; split; Col]. }
  destruct HU as [U [HUAB HUX]].
  assert (HW : exists W, Col W C D /\ W <> Y).
  { destruct (eq_dec_points C Y) as [->|HCY];
      [exists D; split; Col|exists C; split; Col]. }
  destruct HW as [W [HWCD HWY]].
  assert (HPer : Per U X Y).
  { destruct HPin as [_ [_ [_ [_ Hper]]]]. apply Hper; Col. }
  assert (HnU : ~ Col U X Y).
  { intro Hc. apply (HnotCD Y); [ColR|Col]. }
  assert (HnW : ~ Col W X Y).
  { intro Hc. apply (HnotCD X); [Col|ColR]. }
  assert (HV : exists V, Col V C D /\ V <> Y /\ TS X Y U V).
  { destruct (cop__one_or_two_sides X Y U W (all_coplanar _ _ _ _) HnU HnW)
      as [Hts|Hos]; [exists W; auto|].
    destruct (symmetric_point_construction W Y) as [W' HW'].
    assert (HW'Y : W' <> Y)
      by (intro; subst W'; apply HWY; symmetry; apply is_midpoint_id, l7_2, HW').
    assert (HW'CD : Col W' C D).
    { apply midpoint_col in HW'. ColR. }
    assert (HnW' : ~ Col W' X Y).
    { intro Hc. apply (HnotCD X); [Col|ColR]. }
    exists W'. split; [exact HW'CD|split; [exact HW'Y|]].
    apply l9_8_2 with W; [|apply one_side_symmetry; exact Hos].
    repeat split; [exact HnW|exact HnW'|].
    exists Y. split; [Col|apply midpoint_bet; exact HW']. }
  destruct HV as [V [HVCD [HVY Hts]]].
  assert (Hpar : Par X U Y V).
  { apply par_col4__par with A B C D; Col. left; exact Hs. }
  pose proof (l12_21_a X U Y V Hts Hpar) as Hconga.
  assert (HPer' : Per V Y X) by (apply l11_17 with U X Y; exact HPer || exact Hconga).
  apply perp_col4 with V Y Y X; [exact HCD|exact HPQ|ColR|ColR|ColR|ColR|].
  apply per_perp; auto.
Qed.

Lemma cop_par__perp2 : forall A B C D P, Coplanar A B C P -> Par A B C D -> Perp2 A B C D P.
Proof.
    intros.
    apply par_distincts in H0.
    spliter.
    unfold Perp2.
    assert(HH:= ex_perp_cop A B P C H1).
    ex_and HH Q.
    exists P.
    exists Q.
    repeat split.
      Col.
      Perp.
    apply perp_sym.
    apply (cop_par_perp__perp A B); Perp.
    apply par_symmetry in H0.
    induction H0.
      apply coplanar_pseudo_trans with A B C; Cop.
      apply par_strict_not_col_3 with D.
      assumption.
    spliter.
    apply coplanar_perm_16, col2_cop__cop with A B; Col; Cop.
Qed.

End Euclidean.

End GhostEuclidean.
