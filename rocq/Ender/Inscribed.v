(** The inscribed-angle theorems, without [Eqdep.Eq_rect_eq].

    This is GeoCoq's [Main/Annexes/inscribed_angle.v] (pinned commit 1b1e7ad),
    from its first lemma through Euclid III.22 ([cop_onc4_ts__suppa]),
    unchanged except for two proofs.  Upstream proves [trisuma__bet], that a
    triangle's angles sum to a straight angle, through [l12_21_a], and
    [right_saccheris] through [postulates_in_euclidean_context]; both rest on
    [Eqdep.Eq_rect_eq], and every lemma below inherits the axiom from one of
    them.  Here they are [euclidean_trisuma__bet] and [ender_rah] from
    [Geometry.v], which go through Playfair instead, so the file is
    axiom-free.  GeoCoq is distributed under
    the LGPL v3. *)
Require Export GeoCoq.Main.Annexes.circles.
Require Export GeoCoq.Main.Annexes.half_angles.
Require Export GeoCoq.Main.Tarski_dev.Ch12_parallel_inter_dec.
Require Import Ender.Geometry.

Import circles.

Module EnderInscribed.

Section Inscribed_angle.

Context `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}.
Context {TE : @Tarski_euclidean Tn TnEQD}.

(** The sum of the angles of a triangle is the flat angle. *)

Lemma trisuma__bet : forall A B C D E F, TriSumA A B C D E F -> Bet D E F.
Proof.
  apply euclidean_trisuma__bet.
Qed.

Lemma bet__trisuma : forall A B C D E F, Bet D E F -> A <> B -> B <> C -> A <> C -> D <> E -> E <> F ->
  TriSumA A B C D E F.
Proof.
  intros A B C D E F HBet; intros.
  destruct (ex_trisuma A B C) as [P [Q [R HTri]]]; auto.
  apply conga_trisuma__trisuma with P Q R; trivial.
  assert (Hd := HTri).
  apply trisuma_distincts in Hd; spliter.
  apply conga_line; auto.
  apply (trisuma__bet A B C); trivial.
Qed.

Lemma right_saccheris : forall A B C D, Saccheri A B C D -> Per A B C.
Proof.
  exact ender_rah.
Qed.

Lemma not_obtuse_saccheris : ~ hypothesis_of_obtuse_saccheri_quadrilaterals.
Proof.
  apply not_oah; right.
  unfold hypothesis_of_right_saccheri_quadrilaterals; apply right_saccheris.
Qed.

Lemma suma123231__sams : forall A B C D E F, SumA A B C B C A D E F -> SAMS D E F C A B.
Proof. exact (t22_20 not_obtuse_saccheris). Qed.

Lemma bet_suma__suma : forall A B C D E F G H I, G <> H -> H <> I ->
  Bet G H I -> SumA A B C B C A D E F -> SumA D E F C A B G H I.
Proof.
  intros A B C D E F G H I HGH HHI HBet HSuma.
  suma.assert_diffs.
  destruct (bet__trisuma A B C G H I) as [D' [E' [F' []]]]; auto.
  apply (conga3_suma__suma D' E' F' C A B G H I); try apply conga_refl; auto.
  apply (suma2__conga A B C B C A); assumption.
Qed.

Lemma suma__suppa : forall A B C D E F, SumA A B C B C A D E F -> SuppA D E F C A B.
Proof.
  intros A B C D E F HSuma.
  suma.assert_diffs.
  destruct (point_construction_different A B) as [A' []].
  apply bet_suma__suppa with A B A'; trivial.
  apply bet_suma__suma; auto.
Qed.

Lemma high_school_exterior_angle_theorem : forall A B C B', A <> B -> B <> C -> A <> C -> A <> B' ->
  Bet B A B' -> SumA A B C B C A C A B'.
Proof.
  intros A B C B'; intros.
  destruct (ex_suma A B C B C A) as [D [E [F HSuma]]]; auto.
  apply (conga3_suma__suma A B C B C A D E F); try apply conga_refl; auto.
  apply suppa2__conga123 with C A B.
    apply suma__suppa; assumption.
    apply suppa_sym, suppa_left_comm, bet__suppa; auto.
Qed.

(** If A, B and C are points on a circle where the line AB is a diameter of the circle,
    then the angle ACB is a right angle. *)

Lemma thales_theorem : forall A B C M,
  Midpoint M A B -> Cong M A M C -> Per A C B.
Proof.
  apply rah__thales_postulate.
  unfold postulate_of_right_saccheri_quadrilaterals; apply right_saccheris.
Qed.

(** In a right triangle, the midpoint of the hypotenuse is the circumcenter. *)

Lemma thales_converse_theorem : forall A B C M,
  Midpoint M A B -> Per A C B -> Cong M A M C.
Proof.
  apply thales_postulate__thales_converse_postulate.
  unfold thales_postulate; apply thales_theorem.
Qed.

Lemma thales_converse_theorem_1 : forall A B C O, A <> C -> B <> C ->
  Per A C B -> Cong O A O B -> Cong O A O C -> Coplanar A B C O -> Midpoint O A B.
Proof.
  intros A B C O HAC HBC HPer HCong1 HCong2 HCop.
  destruct (midpoint_existence A B) as [M HM].
  assert (M = O); [|subst; apply HM].
  suma.assert_diffs.
  apply (cong4_cop2__eq A C B); Cong; [|Cop..].
  apply cong_commutativity, thales_converse_theorem with B; assumption.
Qed.

Lemma bet_cong__ghalfa : forall A B C B', A <> B -> B <> C -> A <> B' ->
  Bet B A B' -> Cong A B A C -> gHalfA A B C C A B'.
Proof.
  intros A B C B' HAB HBC HAB' HBet HCong.
  apply ghalfa_chara; split.
    apply cong__acute; auto.
  suma.assert_diffs.
  apply (conga3_suma__suma A B C B C A C A B'); try apply conga_refl; auto.
    apply high_school_exterior_angle_theorem; auto.
  apply conga_left_comm, l11_44_1_a; Cong.
Qed.

(** If the angle ACB is inscribed in a circle of center O and
    C, O lie on the same side of AB, then this angle is acute. *)

Lemma onc3_os__acute : forall O P A B C,
  OnCircle A O P -> OnCircle B O P -> OnCircle C O P -> OS A B O C ->
  Acute A C B.
Proof.
  intros O P A B C HA HB HC HOS.
  destruct (midpoint_existence A B) as [M HM].
  assert (HNCol : ~ Col A B C) by (eapply one_side_not_col124, HOS).
  assert (HLt : Lt M A M C).
  { assert (HNCol1 : ~ Col A B O) by (eapply one_side_not_col123, HOS).
    assert (M <> O) by (intro; treat_equalities; apply HNCol1; Col).
    assert (O <> C) by (intro; treat_equalities; auto).
    suma.assert_diffs.
    assert (Cong O A O C) by (apply (onc2__cong O P); assumption).
    destruct (angle_partition M O C); auto.
    - assert (HMO := H).
      clear H.
      destruct (l8_18_existence M O C) as [H []].
      { intro.
        destruct (acute_col__out M O C) as [_ [_ [HBet|HBet]]]; auto.
        - apply l9_9_bis in HOS.
          apply HOS.
          repeat split; Col.
          exists M; split; Col.
        - apply (le__nlt O C O M); Le.
          apply (cong2_lt__lt O M O P); Cong.
          apply bet_inc2__incs with A B; Circle; Between.
      }
      assert (Perp O M A B) by (apply mid_onc2__perp with P; auto).
      assert (HOS1 : OS A B C H).
      { apply l12_6, par_not_col_strict with C; Col.
        apply l12_9 with O M; Perp; [|Cop| |Cop].
          apply coplanar_perm_5, col_cop__cop with B; Col; Cop.
          apply coplanar_perm_5, col_cop__cop with A; Col; Cop.
      }
      assert (M <> H) by (intro; subst; apply one_side_not_col124 in HOS1; apply HOS1; Col).
      assert (Per M H C) by (apply perp_per_1, perp_left_comm, perp_col with O; Col).
      apply lt_transitivity with H C; [|suma.assert_diffs; apply l11_46; auto].
      apply cong_lt_per2__lt_1 with O O; Cong.
        apply l8_2, per_col with M; Col; Perp.
        apply perp_per_1, perp_left_comm, perp_col1 with B; Col.
      apply bet__lt1213; auto; apply out2__bet.
        apply (acute_col_perp__out C); [apply acute_sym|..]; Col; Perp.
        apply (l9_19 A B); Col; apply one_side_transitivity with C; assumption.
    - apply lt_transitivity with O C; [|apply l11_46; auto].
      apply (cong2_lt__lt M A O A); Cong.
      apply l11_46; auto.
      left.
      apply mid_onc2__per with P B; auto.
  }
  destruct HLt as [[C' [HBet HCong]] HNCong].
  exists A, C', B; split.
    apply thales_theorem with M; trivial.
  suma.assert_diffs.
  assert (C <> C') by (intro; subst; apply HNCong, HCong).
  apply os3__lta.
  - apply one_side_transitivity with M.
      apply invert_one_side, out_one_side; [Col|apply l6_6, bet_out; Between].
      apply out_one_side; [left; intro; apply HNCol; ColR|apply l6_6, bet_out; Between].
  - apply out_one_side_1 with M; Col; apply l6_6, bet_out; auto.
  - apply one_side_transitivity with M.
      apply invert_one_side, out_one_side; [Col|apply l6_6, bet_out; Between].
      apply out_one_side; [left; intro; apply HNCol; ColR|apply l6_6, bet_out; Between].
Qed.

Lemma inscribed_angle_aux : forall O P A B C,
  OnCircle A O P -> OnCircle B O P -> OnCircle C O P ->
  OS A B O C -> TS O C A B ->
  gHalfA A C B A O B.
Proof.
  intros O P A B C HA HB HC HOS HTS.
  destruct (segment_construction C O O P) as [C' []].
  suma.assert_diffs.
  assert (O <> C') by (intro; treat_equalities; auto).
  assert (HCong := (onc2__cong O P)).
  apply suma_preserves_ghalfa with A C C' C' C B A O C' C' O B.
    apply (onc3_os__acute O P); assumption.
    apply ts__suma, invert_two_sides, col_two_sides with O; Side; Col.
    apply ts__suma, invert_two_sides, col_two_sides with C; Col.
    apply ghalfa_out4__ghalfa with A O A C'; try apply out_trivial; auto;
      [apply l6_6, bet_out|apply ghalfa_left_comm, bet_cong__ghalfa]; auto.
    apply ghalfa_out4__ghalfa with O B C' B; try apply out_trivial; auto;
      [apply l6_6, bet_out|apply ghalfa_right_comm, bet_cong__ghalfa]; auto.
Qed.

Lemma inscribed_angle_aux1 : forall O P A B C,
  OnCircle A O P -> OnCircle B O P -> OnCircle C O P ->
  OS A B O C -> OS O C A B ->
  gHalfA A C B A O B.
Proof.
  assert (Haux : forall O P A B C, OnCircle A O P -> OnCircle B O P -> OnCircle C O P ->
  OS A B O C -> OS O C A B -> OS O B A C -> gHalfA A C B A O B).
  { intros O P A B C HA HB HC HOS1 HOS2 HOS3.
    destruct (chord_completion O P C O) as [C' [HC' HBet ]]; Circle.
    suma.assert_diffs.
    assert (C' <> O) by (intro; treat_equalities; auto).
    assert (TS O B A C').
    { apply l9_8_2 with C; [|Side].
      apply one_side_not_col124 in HOS3.
      repeat split.
        Col.
        intro; apply HOS3; ColR.
      exists O; split; Col.
    }
    assert (HCong := (onc2__cong O P)).
    apply acute_ghalfa2_sams_suma2__ghalfa123 with B C O A C O B O C' A O C'.
    - repeat split; auto.
        right; intro; assert_cols; assert_ncols; Col.
      exists C'.
      split; CongA.
      repeat split; [Side| |Cop].
      apply l9_9_bis, invert_one_side, one_side_symmetry, os_ts1324__os; [|Side].
      apply col_one_side with C; Col; Side.
    - apply (onc3_os__acute O P); assumption.
    - exists O.
      repeat (split; CongA); [|Cop].
      apply l9_9, invert_two_sides, l9_31; Side.
    - exists C'.
      repeat (split; CongA); [Side|Cop].
    - apply ghalfa_left_comm, bet_cong__ghalfa; auto.
    - apply ghalfa_left_comm, bet_cong__ghalfa; auto.
  }
  intros O P A B C HA HB HC HOS1 HOS2.
  assert_ncols.
  destruct (cop__one_or_two_sides O B A C) as [HTS|]; Col; Cop.
    apply ghalfa_comm, Haux with P; auto; [..|apply one_side_symmetry, os_ts1324__os]; Side.
    apply Haux with P; assumption.
Qed.

(** Euclid Book III Prop 20:
    In a circle the angle at the centre is double of the angle at the circumference,
    when the angles have the same circumference as base. *)

Lemma inscribed_angle : forall O P A B C,
  OnCircle A O P -> OnCircle B O P -> OnCircle C O P -> OS A B O C ->
  gHalfA A C B A O B.
Proof.
  intros O P A B C HA HB HC HOS.
  assert (HCong := (onc2__cong O P)).
  destruct (col_dec A O C).
  { suma.assert_diffs.
    assert (Bet C O A) by (apply col_inc_onc2__bet with O P; Col; Circle).
    assert (O <> C) by (intro; treat_equalities; auto).
    apply ghalfa_right_comm, ghalfa_out4__ghalfa with O B B A; try apply out_trivial; auto.
      apply l6_6, bet_out; auto.
    apply bet_cong__ghalfa; auto.
  }
  destruct (col_dec B O C).
  { suma.assert_diffs.
    assert (Bet C O B) by (apply col_inc_onc2__bet with O P; Col; Circle).
    assert (O <> C) by (intro; treat_equalities; auto).
    apply ghalfa_left_comm, ghalfa_out4__ghalfa with O A A B; try apply out_trivial; auto.
      apply l6_6, bet_out; auto.
    apply bet_cong__ghalfa; auto.
  }
  destruct (cop__one_or_two_sides O C A B); Cop.
    apply inscribed_angle_aux with P; assumption.
    apply inscribed_angle_aux1 with P; assumption.
Qed.

Lemma diam_onc2_ts__suppa : forall O P A B C C',
  OnCircle A O P -> OnCircle B O P -> Diam C C' O P -> TS A B C C' ->
  SuppA A C B A C' B.
Proof.
  intros O P A B C C' HA HB [HBet [HC HC']] HTS.
  suma.assert_diffs.
  assert (HCong := onc2__cong O P).
  assert (HMid : Midpoint O C C') by (split; Cong).
  assert (C <> C') by (intro; treat_equalities; auto).
  assert (HNColA : ~ Col C C' A) by (apply (onc3__ncol O P); auto).
  assert (HNColB : ~ Col C C' B) by (apply (onc3__ncol O P); auto).
  assert (HSumaA : SumA A C C' C C' A C A C') by (apply cong_mid__suma with O; auto).
  assert (HSumaB : SumA B C C' C C' B C B C') by (apply cong_mid__suma with O; auto).
  assert (Per C A C') by (apply thales_theorem with O; auto).
  assert (Per C B C') by (apply thales_theorem with O; auto).
  assert (HSuma : SumA C A C' C B C' C O C') by (suma.assert_diffs; apply bet_per2__suma; auto).
  apply bet_suma__suppa with C O C'; trivial.
  destruct (ex_suma C A C' C' C B) as [D [E [F HSuma1]]]; auto.
  assert (HTS2 : TS C C' A B) by (apply (chord_intersection O P); assumption).
  assert (HTS3 : TS C' C A B) by (apply invert_two_sides, HTS2).
  assert (Acute C' C A).
  { suma.assert_diffs; apply acute_out2__acute with O A.
      apply l6_6, bet_out; auto.
      apply out_trivial; auto.
      apply cong__acute; auto.
  }
  assert (Acute C' C B).
  { suma.assert_diffs; apply acute_out2__acute with O B.
      apply l6_6, bet_out; auto.
      apply out_trivial; auto.
      apply cong__acute; auto.
  }
  assert (Acute C C' A).
  { suma.assert_diffs; apply acute_out2__acute with O A.
      apply l6_6, bet_out; Between.
      apply out_trivial; auto.
      apply cong__acute; auto.
  }
  assert (Acute C C' B).
  { suma.assert_diffs; apply acute_out2__acute with O B.
      apply l6_6, bet_out; Between.
      apply out_trivial; auto.
      apply cong__acute; auto.
  }
  assert (HSuma2 : SumA A C B A C' C D E F).
    apply suma_sym, suma_assoc_1 with A C C' C' C B C A C'; SumA.
  assert (HSAMS : SAMS A C B A C' C).
    apply sams_sym, sams_assoc_1 with A C C' C' C B C A C'; SumA.
  apply suma_assoc_1 with A C' C C C' B D E F; [SumA..|].
  apply suma_assoc_2 with C A C' B C C' C B C'; SumA.
Qed.

(** In a circle the angle at the centre is double of the angle at the circumference. *)

Lemma inscribed_angle_1 : forall O P A B C, A <> B -> B <> C -> A <> C ->
  OnCircle A O P -> OnCircle B O P -> OnCircle C O P -> Coplanar A B C O ->
  SumA A C B A C B A O B.
Proof.
  intros O P A B C HAB HBC HAC HA HB HC HCop.
  assert (~ Col A B C) by (apply (onc3__ncol O P); auto).
  destruct (col_dec A B O).
  { assert (Midpoint O A B) by (apply col_onc2__mid with P; auto).
    assert (Per A C B) by (apply thales_theorem with O; auto; apply cong_transitivity with O P; Cong).
    suma.assert_diffs; apply bet_per2__suma; Between.
  }
  destruct (cop__one_or_two_sides A B O C); Col; Cop.
  - destruct (chord_completion O P C O) as [C' []]; Circle.
    assert (TS A B C' C) by (apply l9_2, bet_ts__ts with O; Side).
    assert (SuppA A C' B A C B).
      apply (diam_onc2_ts__suppa O P); [..|repeat split|]; Between.
    apply (suma_suppa2__suma A C' B A C' B); trivial.
    apply ghalfa__suma, inscribed_angle with P; trivial.
    exists C; split; trivial.
  - apply ghalfa__suma, inscribed_angle with P; trivial.
Qed.

(** If two angles ACB and ADB are inscribed in the same circle,
    then they are either congruent or supplementary. *)

Lemma cop2_onc4__or_conga_suppa : forall O P A B C C',
  A <> B -> B <> C -> A <> C -> B <> C' -> A <> C' ->
  OnCircle A O P -> OnCircle B O P -> OnCircle C O P -> OnCircle C' O P ->
  Coplanar A B C O -> Coplanar A B C' O ->
  CongA A C B A C' B \/ SuppA A C B A C' B.
Proof.
  intros O P A B C C'; intros.
  apply suma2__or_conga_suppa with A O B; trivial; apply inscribed_angle_1 with P; assumption.
Qed.

(** If the angle ACB is inscribed in a circle of center O and
    C, O lie on opposite sides of AB, then this angle is obtuse. *)

Lemma onc3_ts__obtuse : forall O P A B C,
  OnCircle A O P -> OnCircle B O P -> OnCircle C O P -> TS A B O C ->
  Obtuse A C B.
Proof.
  intros O P A B C HA HB HC HTS.
  destruct (chord_completion O P C O) as [C' []]; Circle.
  assert (TS A B C C') by (apply bet_ts__ts with O; Side).
  apply (acute_suppa__obtuse A C' B).
    apply (onc3_os__acute O P); trivial; exists C; split; Side.
  apply (diam_onc2_ts__suppa O P); Side.
  repeat split; Between.
Qed.

(** Euclid Book III Prop 21:
    In a circle the angles in the same segment are equal to one another. *)

Lemma cop_onc4_os__conga : forall O P A B C C',
  OnCircle A O P -> OnCircle B O P -> OnCircle C O P -> OnCircle C' O P ->
  OS A B C C' -> Coplanar A B C O ->
  CongA A C B A C' B.
Proof.
  intros O P A B C C' HA HB HC HC' HOS HCop.
  assert_ncols.
  destruct (col_dec A B O).
  { suma.assert_diffs.
    assert (Midpoint O A B) by (apply col_onc2__mid with P; auto).
    apply l11_16; auto; apply thales_theorem with O; Col; apply cong_transitivity with O P; Cong.
  }
  destruct (cop__one_or_two_sides A B O C); Col; Cop.
  - suma.assert_diffs; destruct (cop2_onc4__or_conga_suppa O P A B C C') as [|Habs]; auto.
      apply coplanar_trans_1 with C; Col; Cop.
    exfalso.
    apply (nlta A C' B), acute_obtuse__lta.
      apply (obtuse_suppa__acute A C B); [apply (onc3_ts__obtuse O P)|]; trivial.
      apply (onc3_ts__obtuse O P); trivial; apply l9_2, l9_8_2 with C; Side.
  - apply ghalfa2__conga_2 with A O B; apply inscribed_angle with P; trivial.
    apply one_side_transitivity with C; Side.
Qed.

(** Euclid Book III Prop 22:
    The opposite angles of quadrilaterals in circles are equal to two right angles. *)

Lemma cop_onc4_ts__suppa : forall O P A B C C',
  OnCircle A O P -> OnCircle B O P -> OnCircle C O P -> OnCircle C' O P ->
  TS A B C C' -> Coplanar A B C O ->
  SuppA A C B A C' B.
Proof.
  intros O P A B C C' HA HB.
  revert C C'.
  assert (Haux : forall C C', OnCircle C O P -> OnCircle C' O P -> TS A B C C' -> OS A B O C ->
    SuppA A C B A C' B).
  { intros C C' HC HC' HTS HOS.
    suma.assert_diffs.
    assert (~ Col C A B) by (destruct HTS; assumption).
    assert (Coplanar A B C' O) by (apply coplanar_trans_1 with C; Cop).
    destruct (cop2_onc4__or_conga_suppa O P A B C C') as [Habs|]; Cop.
    exfalso.
    assert (HLta : LtA A C B A C' B); [|destruct HLta as [_ HN]; apply HN, Habs].
    apply acute_obtuse__lta.
      apply (onc3_os__acute O P); assumption.
    apply (onc3_ts__obtuse O P); trivial.
    apply l9_8_2 with C; Side.
  }
  intros C C' HC HC' HTS HCop.
  assert (~ Col C A B) by (destruct HTS; assumption).
  destruct (col_dec A B O).
  { suma.assert_diffs.
    assert (Midpoint O A B) by (apply col_onc2__mid with P; auto).
    destruct HTS as [_ []].
    apply per2__suppa; auto; apply thales_theorem with O; trivial; apply onc2__cong with P; assumption.
  }
  destruct (cop__one_or_two_sides A B O C); Col; Cop.
  apply suppa_sym, Haux; [..|exists C; split]; Side.
Qed.

End Inscribed_angle.

End EnderInscribed.
