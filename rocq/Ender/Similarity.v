(** Euclidean similarity, without [Eqdep.Eq_rect_eq].

    The similarity rules rest on one fact: whether four lengths are in
    proportion does not depend on the angle the audited [proportion] draws
    them at.  That fact is Desargues' theorem, which GeoCoq proves as
    [l13_15] (pinned commit 1b1e7ad), but its proof reaches
    [Eqdep.Eq_rect_eq] through four Euclidean lemmas: [par_trans],
    [l12_21_a], [inter_dec] and [cop_par_perp__perp].  [Euclidean.v] proves
    those without the axiom under GeoCoq's names; importing it after GeoCoq
    lets this file copy, unchanged, the GeoCoq lemmas from [l13_11] to
    [l13_15] so that each copy's proof resolves the four names there.  GeoCoq
    is distributed under the LGPL v3. *)
Require Export GeoCoq.Main.Tarski_dev.Ch13_6_Desargues_Hessenberg.
Require Import Ender.Geometry.
(* Last, so that the names it restates shadow GeoCoq's. *)
Require Import Ender.Euclidean.
Import EnderEuclidean.

Module EnderSimilarity.

Section Similarity.

Context `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}.
Context {TE : @Tarski_euclidean Tn TnEQD}.
Context {T2D : @Tarski_2D Tn TnEQD}.

Lemma l13_11 : forall A B C A' B' C' O,
  ~ Col O A A' ->
  B <> O -> C <> O ->
  Col O A B -> Col O B C ->
  B' <> O -> C' <> O ->
  Col O A' B' -> Col O B' C' -> Par B C' C B' -> Par C A' A C' ->
  Par A B' B A'.
Proof.
    intros.
    assert (Coplanar B C' C O) by Cop.
    assert (Coplanar C A' A O) by (apply coplanar_perm_1, col_cop__cop with B; Col; Cop).
    assert(HH:=cop_par__perp2 B C' C B' O H10 H8).
    assert(HP:=cop_par__perp2 C A' A C' O H11 H9).
    assert(HQ : Perp2 A B' B A' O).
      apply(l13_10 A B C A' B' C' O); assumption.
    ex_and HQ X.
    ex_and H12 Y.
    assert_diffs.
    assert (Coplanar O A A' X).
      apply coplanar_perm_13, col_cop__cop with B'; Col.
      apply coplanar_perm_3, col_cop__cop with Y; Col; Cop.
    assert (Coplanar O A A' Y).
      apply coplanar_perm_13, col_cop__cop with B'; Col.
      apply coplanar_perm_3, col_cop__cop with X; Col; Cop.
    apply l12_9 with X Y; Perp; apply coplanar_pseudo_trans with O A A'; Cop.
Qed.

Lemma l13_15_1 : forall A B C A' B' C' O,
  ~ Col A B C -> ~ Par O B A C -> Coplanar O B A C ->
  Par_strict A B A' B' -> Par_strict A C A' C'->
  Col O A A' -> Col O B B' -> Col O C C' ->
  Par B C B' C'.
Proof.
    intros.
    assert(~Col B A' B').
      intro.
      apply H2.
      exists B.
      split; Col.
    assert(~Col A A' B').
      intro.
      apply H2.
      exists A.
      split; Col.
    assert(B <> O).
      intro.
      subst B.
      apply H2.
      exists A'.
      split; Col.
    assert(A <> O).
      intro.
      subst A.
      apply H2.
      exists B'.
      split; Col.
    assert(~ Col A' A C).
      eapply (par_not_col A' C').
        Par.
      Col.
    assert(C <> O).
      intro.
      subst C.
      apply H11.
      Col.
    assert(~Col O A B).
      intro.
      apply H2.
      exists O.
      split.
        Col.
      assert(Col O A B').
        apply (col_transitivity_1 _ B); Col.
      apply (col_transitivity_1 _ A); Col.
    assert(~Col O A C).
      intro.
      apply H3.
      exists O.
      split.
        Col.
      assert(Col O A C').
        apply (col_transitivity_1 _ C); Col.
      apply (col_transitivity_1 _ A); Col.
    assert(~ Col A' B' C').
      intro.
      apply H.
      assert(Par A' C' A B).
        apply(par_col_par_2 A' B' A B C').
          apply par_strict_distinct in H3.
          spliter.
          auto.
          auto.
        left.
        Par.
      assert(Par A C A B).
        apply(par_trans A C A' C'); Par.
      induction H17.
        apply False_ind.
        apply H17.
        exists A.
        split; Col.
      spliter; Col.
    induction(col_dec O B C).
      right.
      repeat split.
        intro.
        subst C.
        apply H.
        Col.
        intro.
        subst C'.
        apply H15.
        Col.
        assert(Col O B C').
          apply (col_transitivity_1 _ C); Col.
        apply (col_transitivity_1 _ O); Col.
      assert(Col O C B').
        apply (col_transitivity_1 _ B); Col.
      apply (col_transitivity_1 _ O); Col.
    assert(B' <> O).
      intro.
      subst B'.
      apply H8.
      Col.
    assert(B' <> O).
      intro.
      subst B'.
      apply H8.
      Col.
    assert(A' <> O).
      intro.
      subst A'.
      apply H7.
      Col.
    assert(~ Col A A' C').
      apply (par_not_col A C).
        Par.
      Col.
    assert(C' <> O).
      intro.
      subst C'.
      apply H20.
      Col.
    assert(~Col O A' B').
      intro.
      apply H2.
      exists O.
      split.
        assert(Col O A' B).
          apply (col_transitivity_1 _ B'); Col.
        apply (col_transitivity_1 _ A'); Col.
      Col.
    assert(~Col O A' C').
      intro.
      apply H3.
      exists O.
      split.
        ColR.
      Col.
    assert(~Col B' A B).
      intro.
      apply H2.
      exists B'.
      Col.
    assert(~Col A' A B).
      intro.
      apply H2.
      exists A'.
      split; Col.
    (********** construct L *********)
    assert(exists C : Tpoint, exists D : Tpoint, C <> D /\ Par O B C D /\ Col A C D).
      apply(parallel_existence O B A).
      auto.
    ex_and H26 X.
    ex_and H27 Y.
    assert(Coplanar O B X A) by (apply col_cop__cop with Y; Col; Cop).
    assert(Coplanar O B Y A) by (apply col_cop__cop with X; Col; Cop).
    assert(exists L : Tpoint, Col L X Y /\ Col L A' C').
      apply(cop_npar__inter_exists X Y A' C').
      apply coplanar_pseudo_trans with O A B; [Cop..|].
        apply coplanar_perm_12, col_cop__cop with C; Cop.
      intro.
      apply H0.
      eapply (par_trans O B X Y).
        auto.
      apply par_symmetry.
      apply (par_trans A C A' C').
        left.
        auto.
      Par.
    ex_and H31 L.
    assert(A <> L).
      intro.
      subst L.
      contradiction.
    assert(Par A L O B').
      apply par_symmetry.
      apply(par_col_par_2 _ B); Col.
      apply par_symmetry.
      apply par_left_comm.
      induction(eq_dec_points X L).
        subst X.
        apply (par_col_par_2 _ Y); Col.
        Par.
      apply (par_col_par_2 _ X); try auto.
        ColR.
      apply par_left_comm.
      apply (par_col_par_2 _ Y); Col.
      Par.
    (********** construct M *********)
    assert(~ Par X Y O C).
      intro.
      assert(Par O B O C).
        apply (par_trans O B X Y); Par.
      induction H36.
        apply H36.
        exists O.
        split; Col.
      spliter.
      apply H16.
      Col.
    assert(Coplanar X Y O C).
      apply coplanar_pseudo_trans with O A B; Cop.
    assert(HH:=cop_npar__inter_exists X Y O C H36 H35).
    ex_and HH M.
    assert(A <> M).
      intro.
      subst M.
      apply H14.
      Col.
    assert(Par O B A M).
      apply (par_col_par_2 _ B'); Col.
      apply par_symmetry.
      apply (par_col_par_2 _ L); try auto.
      ColR.
    (*************** construct N ********************)
    assert(L <> A').
      intro.
      subst L.
      clean_trivial_hyps.
      apply H13.
      induction(eq_dec_points A' X).
        subst X.
        assert(Par A' A O B).
          apply (par_col_par_2 _ Y); Col.
          Par.
        induction H32.
          apply False_ind.
          apply H32.
          exists O.
          split; Col.
        spliter.
        ColR.
      assert(Par X A' O B).
        apply (par_col_par_2 _ Y); Col.
        Par.
      assert(Par A' A O B).
        apply (par_col_par_2 _ X); try auto.
          ColR.
        Par.
      induction H42.
        apply False_ind.
        apply H42.
        exists O.
        split; Col.
      spliter.
      Col.
    assert(~ Par L B' A' B').
      intro.
      induction H42.
        apply H42.
        exists B'.
        split;Col.
      spliter.
      apply H15.
      eapply (col_transitivity_1 _ L); Col.
    assert(~ Par A B L B').
      apply(par_not_par A' B' A B L B').
        left.
        Par.
      intro.
      apply H42.
      Par.
    assert(Coplanar A B L B').
      apply coplanar_perm_4, col_cop__cop with O; Col; Cop.
    assert(HH:=cop_npar__inter_exists A B L B' H44 H43).
    ex_and HH N.
    assert(Par_strict A L O B').
      induction H34.
        auto.
      spliter.
      apply False_ind.
      apply H13.
      apply (col_transitivity_1 _ B'); Col.
    assert(A <> N).
      intro.
      subst N.
      apply H47.
      exists B'; Col.
    assert(Par A N A' B').
      apply (par_col_par_2 _ B); Col.
      left.
      Par.
    clean_duplicated_hyps.
    (**********************************)
    assert(Par O N L A').
      induction(par_dec A O N L).
        assert(Par_strict A O N L).
          induction H18.
            auto.
          spliter.
          apply False_ind.
          apply H24.
          assert(Col N A B').
            eapply (col_transitivity_1 _ L); Col.
          apply col_permutation_2.
          eapply (col_transitivity_1 _ N); Col.
        apply(l13_14 A O A' A N L N B'); Col.
          Par.
        Par.
      assert(N <> L).
        intro.
        subst L.
        apply H47.
        exists B.
        split; Col.
      assert(Coplanar A O N L).
        assert_diffs; apply coplanar_perm_1, col_cop__cop with B'; Col; Cop.
      assert(HH:=cop_npar__inter_exists A O N L H51 H18).
      ex_and HH P.
      apply par_right_comm.
      assert(P <> L).
        intro.
        subst P.
        apply H47.
        exists O.
        split; Col.
      assert(P <> O).
        intro.
        subst P.
        apply H47.
        exists L.
        split.
          Col.
        apply (col_transitivity_1 _ N); Col.
      assert(L <> B').
        intro.
        subst L.
        apply H47.
        exists B'.
        split; Col.
      assert(A <> P).
        intro.
        subst P.
        assert(Col A B L).
          apply (col_transitivity_1 _ N); Col.
        assert(Col L A B').
          apply (col_transitivity_1 _ N); Col.
        apply H43.
        apply par_symmetry.
        right.
        repeat split.
          assumption.
          intro.
          subst B.
          apply H24.
          Col.
          Col.
        ColR.
      assert(P <> N).
        intro.
        subst P.
        apply H13.
        apply col_permutation_2.
        apply (col_transitivity_1 _ N); Col.
      assert(A' <> P).
        intro.
        subst P.
        apply H42.
        right.
        repeat split; try assumption.
          intro.
          subst B'.
          apply H22.
          Col.
          ColR.
        Col.
      assert(B' <> P).
        intro.
        subst P.
        apply H22.
        apply (col_transitivity_1 _ A); Col.
      apply(l13_11 O A' A L N B' P); Par; [|ColR..].
      intro.
      apply H47.
      exists L.
      split.
        Col.
      assert(Col L O N).
        apply (col_transitivity_1 _ P); Col.
      apply (col_transitivity_1 _ N); Col.
    (* apply col_permutation_2.
    apply (col_transitivity_1 _ A); Col.
    apply col_permutation_1.
    apply (col_transitivity_1 _ O); Col.
    Col.
    apply col_permutation_2.
    apply (col_transitivity_1 _ L); Col.
    *)
    assert(Par A' C' O N).
      apply (par_col_par_2 _ L).
        intro.
        subst C'.
        apply H23.
        Col.
        Col.
      Par.
    assert(Par O N A C).
      apply (par_trans _ _ A' C'); Par.
    assert(Par N M B C).
      induction(par_dec A N O C).
        assert(Par_strict A N O C).
          induction H52.
            auto.
          spliter.
          apply False_ind.
          apply H14.
          Col.
        apply par_right_comm.
        apply(l13_14 A N B A O C M O ); Par; Col.
      assert(Coplanar A N O C) by Cop.
      assert(HH:= cop_npar__inter_exists A N O C H53 H52).
      ex_and HH P.
      assert(B <> P).
        intro.
        subst P.
        apply H16.
        Col.
      assert(A <> P).
        intro.
        subst P.
        apply H14.
        Col.
      assert(M <> P).
        intro.
        subst P.
        induction H40.
          apply H40.
          exists B.
          split.
            Col.
          apply col_permutation_2.
          apply (col_transitivity_1 _ N); Col.
        spliter.
        apply H13.
        apply col_permutation_2.
        apply (col_transitivity_1 _ M); Col.
      assert(O <> P).
        intro.
        subst P.
        induction H51.
          apply H51.
          exists A.
          split; Col.
        spliter.
        apply H14.
        Col.
      assert(P <> N).
        intro.
        subst P.
        induction H51.
          apply H51.
          exists C.
          split; Col.
        spliter.
        apply H14.
        Col.
      apply(l13_11 N B A C M O P); Par; [|ColR..].
      intro.
      assert(Col N A C) by ColR.
      apply H.
      ColR.
    (* apply col_permutation_2.
    apply (col_transitivity_1 _ A); Col.
    apply col_permutation_1.
    apply (col_transitivity_1 _ N); Col.
    apply col_permutation_2.
    apply (col_transitivity_1 _ O); Col.
    apply col_permutation_1.
    apply (col_transitivity_1 _ C); Col.
    *)
    assert(Par N M B' C').
      induction(par_dec N B' O C').
        assert(Par_strict N B' O C').
          induction H53.
            auto.
          spliter.
          apply False_ind.
          induction H51.
            apply H51.
            exists C.
            split.
              ColR.
            Col.
          spliter.
          contradiction.
        assert(M <> L).
          intro.
          subst M.
          apply H54.
          exists L.
          split.
            Col.
          apply col_permutation_2.
          apply(col_transitivity_1 _ C); Col.
        assert(L <> C').
          intro.
          subst C'.
          apply H54.
          exists L.
          split; Col.
        assert(Par L M O B').
          apply (par_col_par_2 _ A); try assumption.
            auto.
            ColR.
          Par.
        assert(Par L C' O N).
          apply (par_col_par_2 _ A'); Col.
          Par.
        apply par_right_comm.
        apply(l13_14 B' N B' L O C' M O); Par; ColR.
      assert(Coplanar N B' O C').
        apply coplanar_pseudo_trans with O A B; [Cop..|].
        apply coplanar_perm_12, col_cop__cop with C; Col; Cop.
      assert(HH:= cop_npar__inter_exists N B' O C' H54 H53).
      ex_and HH P.
      assert(B' <> P).
        intro.
        subst P.
        apply H16.
        ColR.
      induction(eq_dec_points C'  L).
        subst L.
        assert(C' = M).
          induction (col_dec O X C).
            apply (l6_21 O C Y X).
              intro.
              assert(Col O X Y) by ColR.
              induction H27.
                apply H27.
                exists O.
                split; Col.
              spliter.
              apply H13.
              apply(col3 X Y); Col.
              auto.
              Col.
              Col.
              Col.
              Col.
          apply (l6_21 O C X Y); Col.
        subst M.
        right.
        repeat split; auto.
          apply par_distincts in H52; spliter; auto.
          intro; subst; apply H15; Col.
          Col.
        Col.
      assert(L <> P).
        intro.
        subst P.
        apply H23.
        apply col_permutation_1.
        apply (col_transitivity_1 _ L); Col.
      induction (eq_dec_points L M).
        subst L.
        assert(C' = M).
          apply (l6_21 O C A' C'); Col.
            intro.
            apply H23.
            ColR.
            intro.
            subst C'.
            apply H23.
            Col.
            subst M.
            right.
            repeat split; auto. Col. Col.
              assert(Par L M O B').
            apply (par_col_par_2 _ A); try assumption. ColR.
              Par.
            assert(Par L C' N O).
              apply (par_col_par_2 _ A'); Col.
              Par.
            assert(B' <> N).
              intro.
              subst N.
              contradiction.
            apply(l13_11  N B' L  C' M O P); Par.
              intro.
              assert(Col P B' C').
                apply (col_transitivity_1 _ N).
                  intro.
                  subst N.
                  induction H50.
                    apply H50.
                    exists C'.
                    split; Col.
                  spliter.
                  apply H23.
                  ColR.
                  Col.
                Col.
              assert(Col C' O B' ).
                apply (col_transitivity_1 _ P).
                  intro.
                  subst P.
                  clean_trivial_hyps.
                  assert(Col B' C' L).
                    apply (col_transitivity_1 _ N); Col.
                  apply H15.
                  ColR.
                  Col.
                Col.
              assert(Col O B C').
                apply (col_transitivity_1 _ B'); Col.
              apply H16.
              ColR.
              ColR.
              intro.
              subst M.
              assert(Col B' P L).
                apply (col_transitivity_1 _ N); Col.
              assert(Col L A B').
                assert(Col P A L).
                  apply (col3 X Y); Col.
                apply (col_transitivity_1 _ P); Col.
              apply H47.
              exists B'.
              split; Col.
              intro.
              subst P.
              assert(N = B).
                apply (l6_21 A B O B'); Col.
                  subst N.
                  induction H52.
                    apply H52.
                    exists B.
                    split; Col.
                  spliter.
                  assert(B = O).
                    apply (l6_21 O B' M C); Col.
                  subst B.
                  induction H61.
                    apply H61.
                    exists L.
                    split; Col.
                  tauto.
                  ColR.
                  ColR.
                  apply (par_trans _ _ N M); Par.
Qed.

Lemma l13_15_2_aux : forall A B C A' B' C' O , ~Col A B C
                                         -> ~Par O A B C
                                         -> Par O B A C
                                         -> Par_strict A B A' B'
                                         -> Par_strict A C A' C'
                                         -> Col O A A' -> Col O B B' -> Col O C C'
                                         -> Par B C B' C'.
Proof.
    intros.
    assert(~Col O A B /\ ~Col O B C /\ ~Col O A C).
      induction H1; repeat split; intro.
        apply H1.
        exists A.
        split; Col.
        apply H1.
        exists C.
        split; Col.
        apply H1.
        exists O.
        split; Col.
        spliter.
        apply H; Col.
        spliter.
        apply H; Col.
      spliter.
      apply H; Col.
    spliter.
    assert( A <> O /\ B <> O /\ C <> O).
      repeat split; intro; subst O.
        apply H9.
        Col.
        apply H8.
        Col.
      apply H9.
      Col.
    spliter.
    assert( A' <> O).
      intro.
      subst A'.
      assert(Par O B A B).
        apply (par_col_par_2 _ B'); Col.
        left.
        Par.
      induction H13.
        apply H13.
        exists B.
        split; Col.
      spliter.
      contradiction.
    assert(B' <> O).
      intro.
      subst B'.
      assert(Par O A B A).
        apply(par_col_par_2 _ A'); Col.
        apply par_comm.
        apply par_symmetry.
        left.
        Par.
      induction H14.
        apply H14.
        exists A.
        split; Col.
      spliter.
      apply H7.
      Col.
    assert(C' <> O).
      intro.
      subst C'.
      assert(Par O A C A).
        apply (par_col_par_2 _ A'); Col.
        apply par_comm.
        apply par_symmetry.
        left.
        Par.
      induction H15.
        apply H15.
        exists A.
        split; Col.
      spliter.
      apply H9.
      Col.
    assert(~Col O A' B').
      intro.
      assert(Col O A B').
        apply (col_transitivity_1 _ A'); Col.
      apply H7.
      apply (col_transitivity_1 _ B'); Col.
    assert(~Col O B' C').
      intro.
      assert(Col O B C').
        apply (col_transitivity_1 _ B'); Col.
      apply H8.
      apply (col_transitivity_1 _ C'); Col.
    assert(~Col O A' C').
      intro.
      assert(Col O A C').
        apply (col_transitivity_1 _ A'); Col.
      apply H9.
      apply (col_transitivity_1 _ C'); Col.
    assert(A <> A').
      intro.
      subst A'.
      apply H3.
      exists A.
      split; Col.
    assert(B <> B').
      intro.
      subst B'.
      apply H2.
      exists B.
      split; Col.
    assert(C <> C').
      intro.
      subst C'.
      apply H3.
      exists C.
      split; Col.
    induction(par_dec B C B' C').
      auto.
    assert(B <> C).
      intro.
      subst C.
      apply H.
      Col.
    assert(HP:=parallel_existence B C B' H23).
    ex_and HP X.
    ex_and H24 Y.
    assert(~Par X Y O C).
      intro.
      assert(Par O C B C).
        apply (par_trans _ _  X Y); Par.
      induction H28.
        apply H28.
        exists C.
        split; Col.
      spliter.
      contradiction.
    assert(Coplanar X Y O C).
      induction H25.
        apply coplanar_pseudo_trans with B C B'.
          apply not_col_permutation_1, (par_not_col X Y); Par.
          apply coplanar_perm_1, col_cop__cop with Y; Col; Cop.
          apply coplanar_perm_1, col_cop__cop with X; Col; Cop.
          Cop.
          Cop.
      spliter.
      Cop.
    assert(HH:=cop_npar__inter_exists X Y O C H28 H27).
    ex_and HH C''.
    assert(B' <> C'').
      intro.
      subst C''.
      assert(Col O B C).
        apply (col_transitivity_1 _ B'); Col.
      contradiction.
    assert(Par B' C'' B C ).
      induction(eq_dec_points B' X).
        subst X.
        apply (par_col_par_2 _ Y).
          auto.
          Col.
        Par.
      apply (par_col_par_2 _ X).
        auto.
        apply col_permutation_2.
        apply(col_transitivity_1 _ Y); Col.
      apply par_left_comm.
      apply (par_col_par_2 _ Y); Col.
      Par.
    assert(Par A C A' C'').
      apply(l13_15_1 B A C B' A' C'' O); Col.
        Cop.
        apply par_strict_comm.
        auto.
      induction H32.
        Par.
      spliter.
      apply False_ind.
      apply H8.
      apply col_permutation_2.
      apply(col_transitivity_1 _ B'); Col.
    assert(C' <> C'').
      intro.
      subst C''.
      apply H22.
      Par.
    assert(Par A' C' A' C'').
      apply (par_trans _ _ A C).
        left.
        Par.
      Par.
    assert(C' = C'').
      apply (l6_21 A' C' O C); Col.
        induction H35.
        apply False_ind.
        apply H35.
        exists A'.
        split; Col.
        spliter.
        Col.
    contradiction.
Qed.

Lemma l13_15_2 : forall A B C A' B' C' O , ~Col A B C
                                         -> Par O B A C
                                         -> Par_strict A B A' B'
                                         -> Par_strict A C A' C'
                                         -> Col O A A' -> Col O B B' -> Col O C C'
                                         -> Par B C B' C'.
Proof.
    intros.
    induction(par_dec B C B' C').
      auto.
    assert(HH:=not_par_one_not_par B C B' C' O A H6).
    induction HH.
      apply (l13_15_2_aux A B C A' B' C' O); auto.
      intro.
      apply H7.
      Par.
    apply par_symmetry.
    assert(~ Col A' B' C').
      intro.
      apply H.
      assert(Par A' B' A' C').
        right.
        repeat split; Col.
          intro.
          subst B'.
          apply H1.
          exists A.
          split; Col.
        intro.
        subst C'.
        apply H2.
        exists A.
        split; Col.
      assert(Par A B A C).
        apply(par_trans _ _ A' B').
          left.
          auto.
        apply(par_trans _ _ A' C').
          Par.
        left.
        Par.
      induction H10.
        apply False_ind.
        apply H10.
        exists A.
        split; Col.
      spliter.
      Col.
    assert(B' <> O).
      intro.
      subst B'.
      assert(Par O A B A).
        apply (par_col_par_2 _ A'); Col.
          intro.
          subst A.
          apply H1.
          exists O.
          split; Col.
        apply par_comm.
        left.
        Par.
      induction H9.
        apply H9.
        exists A.
        split; Col.
      spliter.
      apply H1.
      exists O.
      split; Col.
    assert(Par O B O B').
      right.
      repeat split; Col.
      intro.
      subst B.
      apply par_distincts in H0.
      tauto.
    apply (l13_15_2_aux A' B' C' A B C O); Col; Par.
      intro.
      apply H7.
      apply par_symmetry.
      apply (par_col_par_2 _ A').
        intro.
        subst A.
        induction H0.
          apply H0.
          exists O.
          split; Col.
        spliter.
        apply H.
        Col.
        Col.
      Par.
    apply (par_trans _ _ O B).
      Par.
    apply (par_trans _ _ A C).
      Par.
    left.
    Par.
Qed.

Lemma l13_15 : forall A B C A' B' C' O , ~Col A B C -> Coplanar O B A C
                                         -> Par_strict A B A' B'
                                         -> Par_strict A C A' C'
                                         -> Col O A A' -> Col O B B' -> Col O C C'
                                         -> Par B C B' C'.
Proof.
    intros.
    induction(par_dec O B A C).
      apply (l13_15_2 A B C A' B' C' O); Col; Par.
    apply (l13_15_1 A B C A' B' C' O); Col; Par.
Qed.

(** * Proportion is independent of the angle it is drawn at *)

(** Four lengths in proportion, read off two rays from [O]: the audited
    [proportion]'s meaning, stated for points.  [A B : C D = E F : G H]. *)
Definition Proportional A B C D E F G H :=
  exists O P Q R S,
    Cong O P A B /\ Cong O Q C D /\ Cong O R E F /\ Cong O S G H /\
    Out O P Q /\ Out O R S /\ ~ Col O P R /\ Par P R Q S.

(** Only the four lengths matter, so a congruent segment may stand in for
    any of them. *)
Lemma proportional_cong : forall A B C D E F G H A' B' C' D' E' F' G' H',
  Proportional A B C D E F G H ->
  Cong A B A' B' -> Cong C D C' D' -> Cong E F E' F' -> Cong G H G' H' ->
  Proportional A' B' C' D' E' F' G' H'.
Proof.
  intros A B C D E F G H A' B' C' D' E' F' G' H'
    [O [P [Q [R [S [HP [HQ [HR [HS Hrest]]]]]]]]] HA HC HE HG.
  exists O, P, Q, R, S.
  refine (conj _ (conj _ (conj _ (conj _ Hrest))));
    eapply cong_transitivity; eassumption.
Qed.

(** [a : b = c : d] reads the same as [c : d = a : b] ... *)
Lemma proportional_swap : forall A B C D E F G H,
  Proportional A B C D E F G H -> Proportional E F G H A B C D.
Proof.
  intros A B C D E F G H
    [O [P [Q [R [S [HP [HQ [HR [HS [HoutQ [HoutS [Hncol HPar]]]]]]]]]]]].
  exists O, R, S, P, Q.
  refine (conj HR (conj HS (conj HP (conj HQ (conj HoutS (conj HoutQ (conj _ _))))))).
  - intro; apply Hncol; Col.
  - apply par_comm; exact HPar.
Qed.

(** ... and as [b : a = d : c]. *)
Lemma proportional_invert : forall A B C D E F G H,
  Proportional A B C D E F G H -> Proportional C D A B G H E F.
Proof.
  intros A B C D E F G H
    [O [P [Q [R [S [HP [HQ [HR [HS [HoutQ [HoutS [Hncol HPar]]]]]]]]]]]].
  exists O, Q, P, S, R.
  refine (conj HQ (conj HP (conj HS (conj HR (conj (l6_6 _ _ _ HoutQ)
    (conj (l6_6 _ _ _ HoutS) (conj _ _))))))).
  - assert (HcQ := out_col _ _ _ HoutQ). assert (HcS := out_col _ _ _ HoutS).
    destruct HoutQ as [HPO [HQO _]]. destruct HoutS as [HRO [HSO _]].
    intro Hc. apply Hncol. ColR.
  - apply par_symmetry; exact HPar.
Qed.

(** Two isosceles triangles with a common apex angle have parallel bases:
    the reflection in the first base's perpendicular bisector, which passes
    through the apex, carries each ray onto the other and so carries the
    second base onto itself. *)
Lemma isosceles_bases_par : forall V C D C' D',
  Out V C D -> Out V C' D' -> ~ Col V C C' ->
  Cong V C V C' -> Cong V D V D' -> Par C C' D D'.
Proof.
  intros V C D C' D' HoutD HoutD' Hncol HcongC HcongD.
  assert_diffs.
  destruct (midpoint_existence C C') as [M HM].
  assert (HVM : V <> M).
  { intro; subst M. apply Hncol. apply midpoint_col in HM. Col. }
  assert (HrefC : Reflect C' C V M) by (apply cong_midpoint__image; assumption).
  assert (HrefV : Reflect V V V M)
    by (apply is_image_is_image_spec; [exact HVM|apply col__refl; Col]).
  destruct (l10_2_existence V M D) as [D2 HrefD].
  assert (HcongD2 : Cong V D V D2) by (apply (l10_10 V M); assumption).
  assert (HoutD2 : Out V C' D2).
  { assert (HD2V : D2 <> V) by (intro; subst D2; apply cong_identity in HcongD2;
      auto).
    destruct HoutD as [_ [_ [Hb|Hb]]].
    - repeat split; auto.
      left. apply (image_gen_preserves_bet V C D V C' D2 V M); auto; apply l10_4; auto.
    - repeat split; auto.
      right. apply (image_gen_preserves_bet V D C V D2 C' V M); auto; apply l10_4; auto. }
  assert (HD2 : D2 = D').
  { apply (l6_11_uniqueness V V D C' D2 D'); [apply l6_6; exact HoutD2|Cong|
      apply l6_6; exact HoutD'|Cong]. }
  subst D2.
  assert (HDD' : D <> D').
  { intro; subst D'. apply Hncol.
    apply out_col in HoutD. apply out_col in HoutD'. ColR. }
  apply (is_image_is_image_spec D D' V M HVM) in HrefD.
  apply (is_image_is_image_spec C C' V M HVM) in HrefC.
  destruct HrefD as [_ [HperpD|]]; [|contradiction].
  destruct HrefC as [_ [HperpC|HCC]]; [|exfalso; subst; apply Hncol; Col].
  apply l12_9 with V M; try apply all_coplanar; Perp.
Qed.

(** Lengths in proportion along one pair of rays from [V] stay in proportion
    when the second ray turns about [V] within the same half-plane.  This is
    Desargues' theorem for the triangles [C A C'] and [D B D'], whose sides
    [C A] and [C C'] have parallel counterparts. *)
Lemma proportional_turn : forall V A B C D C' D',
  Out V A B -> Out V C D -> ~ Col V A C -> Par A C B D ->
  Out V C' D' -> OS V A C C' -> Cong V C' V C -> Cong V D' V D ->
  Par A C' B D'.
Proof.
  intros V A B C D C' D' HoutB HoutD Hncol HPar HoutD' Hos HcongC HcongD.
  assert (Hncol' : ~ Col V A C') by (apply one_side_not_col124 with C; exact Hos).
  assert_diffs.
  assert (HsameC : forall X, Out V C X -> Cong V X V C -> X = C).
  { intros X HX HcX. apply (l6_11_uniqueness V V C C X C); auto using out_trivial;
      [apply l6_6; exact HX|Cong]. }
  destruct (out_dec V C C') as [Hout|Hnout].
  { assert (C' = C) by (apply HsameC; [exact Hout|exact HcongC]).
    subst C'.
    assert (D' = D).
    { apply (l6_11_uniqueness V V D C D' D); [|exact HcongD|apply l6_6; exact HoutD|Cong].
      apply l6_6; exact HoutD'. }
    subst D'. exact HPar. }
  assert (HnotVA : forall X, Col V A X -> X <> V -> ~ Col V C X) by
    (intros X HX HXV HX'; apply Hncol; ColR).
  destruct (eq_dec_points A B) as [<-|HAB].
  { assert (HCD : C = D).
    { apply par_id in HPar. destruct (eq_dec_points C D) as [|HCD]; [assumption|].
      exfalso. apply Hncol. apply out_col in HoutD. ColR. }
    subst D.
    assert (D' = C').
    { apply (l6_11_uniqueness V V C C' D' C');
        [apply l6_6; exact HoutD'|exact HcongD|apply out_trivial; auto|exact HcongC]. }
    subst D'. apply par_reflexivity. intro; subst C'. apply Hncol'. Col. }
  assert (HCD : C <> D).
  { intro; subst D. apply par_comm, par_id in HPar.
    apply HAB. apply out_col in HoutB.
    apply (l6_21 V A C A A B); auto; Col. }
  assert (HC'D' : C' <> D').
  { intro; subst D'. apply HCD. apply (l6_11_uniqueness V V C D C D);
      [exact HoutD|Cong|apply out_trivial; auto|].
    apply cong_transitivity with V C'; Cong. }
  assert (HnCC' : ~ Col V C C').
  { intro Hcol. apply Hnout. apply col_one_side_out with A; [Col|].
    exact Hos. }
  assert (HparCC : Par C C' D D')
    by (apply isosceles_bases_par with V; [exact HoutD|exact HoutD'|exact HnCC'|Cong|Cong]).
  assert (HsAC : Par_strict C A D B).
  { apply par_not_col_strict with B; [Par|Col|].
    intro Hcol. apply HAB. apply out_col in HoutB.
    apply (l6_21 V A C A A B); auto; Col. }
  destruct (col_dec C A C') as [Hcol|HnCAC'].
  { (* [A] lies on the base [C C'], so [C A] and [C C'] are one line and so
       are their parallels [D B] and [D D']. *)
    assert (HlineB : Col D B D').
    { assert (Hp : Par D B D D').
      { apply par_trans with C A; [apply par_comm, par_symmetry; exact HPar|].
        apply par_col_par_2 with C'; [auto|Col|exact HparCC]. }
      apply par_id in Hp. Col. }
    assert (HBD' : B <> D').
    { intro; subst D'. apply Hncol'. apply out_col in HoutB.
      apply out_col in HoutD'. ColR. }
    apply par_col4__par with C A D B; [auto|exact HBD'|apply par_comm; exact HPar|
      Col|Col|Col|Col]. }
  assert (HsCC : Par_strict C C' D D').
  { apply par_not_col_strict with D; [exact HparCC|Col|].
    intro Hcol. apply HnCC'. apply out_col in HoutD. ColR. }
  apply (l13_15 C A C' D B D' V); [Col|apply all_coplanar|exact HsAC|
    exact HsCC|apply out_col in HoutD; Col|apply out_col in HoutB; Col|
    apply out_col in HoutD'; Col].
Qed.

(** A proportion holds along any two rays that carry its four lengths: the
    audited construction can be copied to the rays' angle by SAS, and then
    turned onto the second ray by [proportional_turn]. *)
Lemma proportional_at : forall A B C D E F G H V X Y P Q R S,
  Proportional A B C D E F G H -> ~ Col V X Y ->
  Out V X P -> Out V X Q -> Out V Y R -> Out V Y S ->
  Cong V P A B -> Cong V Q C D -> Cong V R E F -> Cong V S G H ->
  Par P R Q S.
Proof.
  intros A B C D E F G H V X Y P Q R S
    [O [P0 [Q0 [R0 [S0 [HcP [HcQ [HcR [HcS [HoutQ0 [HoutS0 [Hncol0 HPar0]]]]]]]]]]]]
    Hncol HoutP HoutQ HoutR HoutS HcP' HcQ' HcR' HcS'.
  assert_diffs.
  assert (Hncol1 : ~ Col X V Y) by (intro; apply Hncol; Col).
  destruct (angle_construction_1 P0 O R0 X V Y) as [Z [HangZ HosZ]]; [Col|exact Hncol1|].
  apply invert_one_side in HosZ.
  assert (HnZ : ~ Col V X Z) by (apply one_side_not_col123 with Y; exact HosZ).
  assert_diffs.
  destruct (segment_construction_3 V Z O R0) as [R1 [HoutR1 HcR1]]; auto.
  destruct (segment_construction_3 V Z O S0) as [S1 [HoutS1 HcS1]]; auto.
  assert_diffs.
  assert (HPQ : Out V P Q) by (apply l6_7 with X; [apply l6_6|]; assumption).
  assert (HR1S1 : Out V R1 S1) by (apply l6_7 with Z; [apply l6_6|]; assumption).
  assert (HRS : Out V R S) by (apply l6_7 with Y; [apply l6_6|]; assumption).
  assert (HcongPP0 : Cong V P O P0) by (apply cong_transitivity with A B; Cong).
  assert (HcongQQ0 : Cong V Q O Q0) by (apply cong_transitivity with C D; Cong).
  (* the construction, copied to the angle [X V Z] *)
  assert (HangP : CongA P0 O R0 P V R1)
    by (apply l11_10 with P0 R0 X Z; auto using out_trivial; apply l6_6; assumption).
  assert (HangQ : CongA Q0 O S0 Q V S1)
    by (apply l11_10 with P0 R0 X Z; auto; apply l6_6; assumption).
  destruct (l11_49 P0 O R0 P V R1 HangP) as [_ HbaseP]; Cong.
  destruct HbaseP as [HbaseP _]; [intro; subst; apply Hncol0; Col|].
  assert (Hncol0' : ~ Col O Q0 S0).
  { intro Hc. apply Hncol0. apply out_col in HoutQ0. apply out_col in HoutS0. ColR. }
  assert_diffs.
  destruct (l11_49 Q0 O S0 Q V S1 HangQ) as [_ HbaseQ]; Cong.
  destruct HbaseQ as [HbaseQ _]; [intro; subst; apply Hncol0'; Col|].
  assert (Hcorr0 : CongA R0 P0 O S0 Q0 O).
  { apply l12_22_a; [exact HoutQ0| |exact HPar0].
    apply out_one_side; [left; intro; apply Hncol0; Col|exact HoutS0]. }
  assert (HPar1 : Par P R1 Q S1).
  { apply l12_22_b with V; [exact HPQ| |].
    - apply out_one_side; [left|exact HR1S1].
      intro Hc. apply HnZ. apply out_col in HoutP. apply out_col in HoutR1. ColR.
    - apply conga_trans with R0 P0 O; [apply conga_sym, conga_comm; exact HbaseP|].
      apply conga_trans with S0 Q0 O; [exact Hcorr0|apply conga_comm; exact HbaseQ]. }
  (* and turned onto the ray [V Y] *)
  apply (proportional_turn V P Q R1 S1 R S HPQ HR1S1); [| exact HPar1 | exact HRS | | |].
  - intro Hc. apply HnZ. apply out_col in HoutP. apply out_col in HoutR1. ColR.
  - apply col2_os__os with V X; [auto|Col|apply out_col; exact HoutP|].
    apply one_side_symmetry, out_out_one_side with Z; [|exact HoutR1].
    apply one_side_symmetry, out_out_one_side with Y; [exact HosZ|exact HoutR].
  - apply cong_transitivity with E F; [Cong|].
    apply cong_transitivity with O R0; Cong.
  - apply cong_transitivity with G H; [Cong|].
    apply cong_transitivity with O S0; Cong.
Qed.

(** * The similarity criteria *)

(** Laying off [E D] and [E F] along the rays from [B] gives a copy [D' B F']
    of the second triangle whose third side is parallel to [A C]: the
    proportion [BA : ED = BC : EF] holds along those rays by
    [proportional_at]. *)
Lemma similar_copy : forall A B C D E F D' F',
  ~ Col A B C -> Proportional B A E D B C E F ->
  Out B A D' -> Cong B D' E D -> Out B C F' -> Cong B F' E F ->
  CongA B A C B D' F' /\ CongA B C A B F' D'.
Proof.
  intros A B C D E F D' F' Hncol Hprop HoutD HcongD HoutF HcongF.
  assert_diffs.
  assert (HPar : Par A C D' F').
  { apply (proportional_at B A E D B C E F B A C A D' C F' Hprop);
      [intro; apply Hncol; Col|apply out_trivial; auto|exact HoutD|
       apply out_trivial; auto|exact HoutF|Cong|exact HcongD|Cong|exact HcongF]. }
  split.
  - apply conga_comm, l12_22_a; [exact HoutD| |exact HPar].
    apply out_one_side; [left; intro; apply Hncol; Col|exact HoutF].
  - apply conga_comm, l12_22_a; [exact HoutF| |apply par_comm; exact HPar].
    apply out_one_side; [left; intro; apply Hncol; Col|exact HoutD].
Qed.

(** SAS similarity: an angle congruent to an angle, with the sides around it
    in proportion. *)
Lemma sas_similar : forall A B C D E F,
  ~ Col A B C -> ~ Col D E F -> CongA A B C D E F ->
  Proportional B A E D B C E F ->
  CongA B A C E D F /\ CongA B C A E F D.
Proof.
  intros A B C D E F Hncol Hncol' Hang Hprop.
  assert_diffs.
  destruct (segment_construction_3 B A E D) as [D' [HoutD HcongD]]; auto.
  destruct (segment_construction_3 B C E F) as [F' [HoutF HcongF]]; auto.
  destruct (similar_copy A B C D E F D' F' Hncol Hprop HoutD HcongD HoutF HcongF)
    as [HangA HangC].
  assert (Hang' : CongA D' B F' D E F).
  { apply (l11_10 A B C D E F D' F' D F); [exact Hang|apply l6_6; exact HoutD|
      apply l6_6; exact HoutF|apply out_trivial; auto|apply out_trivial; auto]. }
  assert (HD'F' : D' <> F').
  { intro; subst F'. apply Hncol. apply out_col in HoutD. apply out_col in HoutF.
    assert_diffs. ColR. }
  destruct (l11_49 D' B F' D E F Hang') as [_ Hparts]; [Cong|Cong|].
  destruct (Hparts HD'F') as [HangD HangF].
  split; eapply conga_trans; eassumption.
Qed.

(** SSS similarity: the three pairs of sides in proportion, given as two
    proportions sharing the pair [B C]/[E F].  The copy [D' B F'] built at
    [B] is similar to [A B C]; the second proportion, read at [C], then
    makes its third side as long as [D F], and SSS finishes. *)
Lemma sss_similar : forall A B C D E F,
  ~ Col A B C -> ~ Col D E F ->
  Proportional B A E D B C E F -> Proportional C B F E C A F D ->
  CongA B A C E D F /\ CongA A B C D E F /\ CongA B C A E F D.
Proof.
  intros A B C D E F Hncol Hncol' Hprop1 Hprop2.
  assert_diffs.
  destruct (segment_construction_3 B A E D) as [D' [HoutD HcongD]]; auto.
  destruct (segment_construction_3 B C E F) as [F' [HoutF HcongF]]; auto.
  destruct (similar_copy A B C D E F D' F' Hncol Hprop1 HoutD HcongD HoutF HcongF)
    as [HangA HangC].
  assert (HncolCopy : ~ Col D' B F').
  { intro Hc. apply Hncol. apply out_col in HoutD. apply out_col in HoutF.
    assert_diffs. ColR. }
  (* the second proportion, laid off from [C] *)
  destruct (segment_construction_3 C B F E) as [X [HoutX HcongX]]; auto.
  destruct (segment_construction_3 C A F D) as [Y [HoutY HcongY]]; auto.
  assert (Hncol2 : ~ Col B C A) by (intro; apply Hncol; Col).
  destruct (similar_copy B C A E F D X Y Hncol2 Hprop2 HoutX HcongX HoutY HcongY)
    as [HangB2 _].
  (* [X C Y] and [B F' D'] agree in the side [C X = F' B] and its two angles *)
  assert (HangC' : CongA X C Y B F' D').
  { apply conga_trans with B C A; [|exact HangC].
    apply (l11_10 B C A B C A X Y B A); [apply conga_refl; auto|apply l6_6; exact HoutX|
      apply l6_6; exact HoutY|apply out_trivial; auto|apply out_trivial; auto]. }
  assert (HangX : CongA C X Y F' B D').
  { apply conga_trans with C B A; [apply conga_sym; exact HangB2|].
    apply (l11_10 C B A C B A C A F' D'); [apply conga_refl; auto|apply out_trivial; auto|
      apply out_trivial; auto|apply l6_6; exact HoutF|apply l6_6; exact HoutD]. }
  assert (HncolXCY : ~ Col X C Y).
  { intro Hc. apply Hncol2. apply out_col in HoutX. apply out_col in HoutY.
    assert_diffs. ColR. }
  destruct (l11_50_1 C X Y F' B D') as [HcongCY _];
    [intro; apply HncolXCY; Col|exact HangC'|exact HangX|
     apply cong_transitivity with F E; [exact HcongX|Cong]|].
  (* so the copy is congruent to [D E F] *)
  assert (HcongDF : Cong D' F' D F)
    by (apply cong_transitivity with C Y; Cong).
  assert_diffs.
  destruct (l11_51 B D' F' E D F) as [HangB [HangD HangF]]; auto.
  split; [eapply conga_trans; [exact HangA|exact HangD]|].
  split; [|eapply conga_trans; [exact HangC|apply conga_comm; exact HangF]].
  apply conga_trans with D' B F'; [|exact HangB].
  apply (l11_10 A B C A B C A C D' F'); [apply conga_refl; auto|apply out_trivial; auto|
    apply out_trivial; auto|apply l6_6; exact HoutD|apply l6_6; exact HoutF].
Qed.

End Similarity.

End EnderSimilarity.
