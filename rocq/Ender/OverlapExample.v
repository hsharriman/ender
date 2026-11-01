(** The overlapping-triangles proof from the paper, checked two ways: the
    checker accepts it, and the premises it states can all hold at once.

    The second matters because [Audit.checker_sound] is an implication from
    the declarations and premises to the goal.  A problem whose premises
    could never hold together would make it true vacuously, so this file
    exhibits points in [Model.v]'s plane satisfying every declaration and
    premise of the accepted problem.

    The [pt:] line in the source gives each point display coordinates that
    reproduce the paper's figure to one decimal place.  They do not satisfy
    the premises: F is about 0.02 units off line EG, and H likewise off DG.
    The checker never reads them, which is why the witness below can use
    different points.  Rounding the figure to whole numbers happens to give
    a configuration that does satisfy them, and that is the witness.

    Like [Model.v], this file is written in MathComp. *)

From mathcomp Require Import ssreflect ssrbool ssrfun eqtype ssrnat seq.
From mathcomp Require Import ssralg ssrnum matrix rat fintype zmodp realalg.
From Stdlib Require List.
From Stdlib Require Import Ascii String.
Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Require Import GeoCoq.Algebraic.POF_to_Tarski.
Require Import Ender.Audit Ender.Model.
Require Ender.CertifiedAPI.
Import GRing.Theory Num.Theory.

(** * The proof *)

Definition overlap_source : String.string := "title: ""Overlapping triangle congruence""
premises:
pt: E (2, 8.3, b), F (4.8, 5.3, bl), G (7, 3, b), H (9.2, 5.3, br), D (12, 8.3, b)
tri: t_EGH t_FGD
ang: a_EGD
[d_1] on_line(EG, F)
[d_2] on_line(DG, H)
[g_1] con_seg(EG, DG)
[g_2] con_ang(a_GEH, a_GDF)
-> con_seg(FG, HG)

steps:
[01] given(g_1) -> con_seg(EG, DG)
[02] given(g_2) -> con_ang(a_GEH, a_GDF)
[03] reflex() -> ref_ang(a_EGD, a_EGD)
[04] asa(2, 1, 3) -> con_tri(t_EGH, t_FGD)
[05] cpctc(4) -> con_seg(FG, HG)"%string.

Theorem overlap_accepted : CertifiedAPI.checker overlap_source = true.
Proof. vm_compute. reflexivity. Qed.

(** * Points with rational coordinates

    Each point of the plane is a row vector over the real algebraic numbers.
    Writing its coordinates as images of rationals under [ratr], a field
    morphism, turns every fact below into an equation or inequality between
    rationals, which [vm_compute] decides. *)

Local Open Scope ring_scope.

Definition pt (x y : rat) : @Tpoint PlaneTn := row2 (ratr x) (ratr y).

Lemma pt0 x y : (pt x y : 'rV[RA]_2) 0 0 = ratr x.
Proof. by rewrite /pt !mxE. Qed.

Lemma pt1 x y : (pt x y : 'rV[RA]_2) 0 1 = ratr y.
Proof. by rewrite /pt !mxE. Qed.

Lemma pt_neq a b c d : (a != c) || (b != d) -> pt a b <> pt c d.
Proof.
move=> H E; move: H.
have := congr1 (fun v : 'rV[RA]_2 => v 0 1) E.
have := congr1 (fun v : 'rV[RA]_2 => v 0 0) E.
by rewrite /= !pt0 !pt1 => /fmorph_inj -> /fmorph_inj ->; rewrite !eqxx.
Qed.

Lemma pt_cong a b c d e f g h :
  (c - a) ^+ 2 + (d - b) ^+ 2 == (g - e) ^+ 2 + (h - f) ^+ 2 ->
  @Cong PlaneTn (pt a b) (pt c d) (pt e f) (pt g h).
Proof.
move=> H; change (is_true (@cong RA 2 (pt a b) (pt c d) (pt e f) (pt g h))).
by rewrite congP_aux /sqr_L2_norm_2D !pt0 !pt1 -!rmorphB -!rmorphXn -!rmorphD
  fmorph_eq.
Qed.

(** Collinear points have a zero determinant ([col_2D']). *)
Lemma pt_ncol a b c d e f :
  (a - c) * (d - f) != (b - d) * (c - e) ->
  ~ @Col PlaneTn (pt a b) (pt c d) (pt e f).
Proof.
move=> /negP H HC; apply: H.
have := @col_2D' RA (pt a b) (pt c d) (pt e f) HC.
by rewrite !pt0 !pt1 -!rmorphB -!rmorphM fmorph_eq.
Qed.

(** [(c, d)] is the fraction [k] of the way from [(a, b)] to [(e, f)]. *)
Lemma pt_bet a b c d e f k :
  0 < k -> k < 1 -> (e != a) || (f != b) ->
  c - a == k * (e - a) -> d - b == k * (f - b) ->
  @Bet PlaneTn (pt a b) (pt c d) (pt e f).
Proof.
move=> k0 k1 Hne Hx Hy.
change (is_true (@bet RA 2 (pt a b) (pt c d) (pt e f))).
have Hv : (pt c d - pt a b : 'rV[RA]_2) == ratr k *: (pt e f - pt a b).
  by rewrite vector2_eq !mxE /= -!rmorphB -!rmorphM !fmorph_eq Hx Hy.
have Hn : (pt e f - pt a b : 'rV[RA]_2) != 0.
  by rewrite vector2_neq0 !mxE /= !subr_eq0 !(inj_eq (fmorph_inj ratr)).
apply/orP; right; apply/betSP; rewrite /betR (ratio_eq Hn Hv).
split; first exact/eqP.
- by rewrite ltr0q.
- by rewrite -(rmorph1 ratr) ltr_rat.
Qed.

(** * The witness *)

Definition E := pt 2 8.
Definition F := pt 5 5.
Definition G := pt 7 3.
Definition H := pt 9 5.
Definition D := pt 12 8.

(** Every other letter is unused; where it goes does not matter. *)
Definition overlap_point (p : PointName) : @Tpoint PlaneTn :=
  match p with
  | "E"%char => E
  | "F"%char => F
  | "G"%char => G
  | "H"%char => H
  | "D"%char => D
  | _ => pt 0 0
  end.

Ltac decide_rat := by vm_compute.

Theorem overlap_premises_hold :
  exists part problem,
    problemPart overlap_source = Some part /\
    CertifiedAPI.parseProblem part = Some problem /\
    List.Forall (@declarationMeaning PlaneTn overlap_point)
      (public_declarations problem) /\
    List.Forall (@statementMeaning PlaneTn overlap_point)
      (public_premises problem).
Proof.
do 2 eexists; split; first by vm_compute.
split; first by vm_compute.
have EG : E <> G by apply: pt_neq; decide_rat.
have GH : G <> H by apply: pt_neq; decide_rat.
have HE : H <> E by apply: pt_neq; decide_rat.
have FG : F <> G by apply: pt_neq; decide_rat.
have GD : G <> D by apply: pt_neq; decide_rat.
have DF : D <> F by apply: pt_neq; decide_rat.
have DG : D <> G by move=> /esym.
have [EGH FGD] : ~ Col E G H /\ ~ Col F G D by split; apply: pt_ncol; decide_rat.
have EFG : Bet E F G by apply: (@pt_bet _ _ _ _ _ _ (3%:R / 5%:R)); decide_rat.
have DHG : Bet D H G by apply: (@pt_bet _ _ _ _ _ _ (3%:R / 5%:R)); decide_rat.
have EGDG : Cong E G D G by apply: pt_cong; decide_rat.
have GEHGDF : CongA G E H G D F.
  apply: cong3_conga; [by move=> /esym|exact: HE|].
  by split; [|split]; apply: pt_cong; decide_rat.
split; repeat apply List.Forall_cons; try apply List.Forall_nil;
  cbv [declarationMeaning statementMeaning TriangleWellFormed AngleWellFormed
       SegmentWellFormed OnSegment SegmentCongruent AngleCongruent
       seg_start seg_end ang_start ang_vertex ang_end overlap_point
       triangle_first triangle_second triangle_third
       angle_first angle_vertex angle_last segment_first segment_second].
all: first [assumption | repeat split; assumption].
Qed.
