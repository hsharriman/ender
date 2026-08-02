From Coq Require Import List String Bool Lia.
Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Require Import Ender.Syntax Ender.Geometry Ender.Semantics.
Import ListNotations.
Import EnderSyntax.

Definition rotate_triangle (t : Triangle) : Triangle :=
  triangle t.(tri_b) t.(tri_c) t.(tri_a).

Definition side_ab (t : Triangle) := segment t.(tri_a) t.(tri_b).
Definition side_bc (t : Triangle) := segment t.(tri_b) t.(tri_c).
Definition side_ca (t : Triangle) := segment t.(tri_c) t.(tri_a).
Definition angle_a (t : Triangle) := angle t.(tri_b) t.(tri_a) t.(tri_c).
Definition angle_b (t : Triangle) := angle t.(tri_a) t.(tri_b) t.(tri_c).
Definition angle_c (t : Triangle) := angle t.(tri_a) t.(tri_c) t.(tri_b).

Definition reverse_segment (s : Segment) := segment s.(seg_end) s.(seg_start).
Definition segment_u_eqb (a b : Segment) : bool :=
  segment_eqb a b || segment_eqb a (reverse_segment b).
Definition segment_pair_eqb (a b c d : Segment) : bool :=
  (segment_u_eqb a c && segment_u_eqb b d) ||
  (segment_u_eqb a d && segment_u_eqb b c).

Lemma segment_u_eqb_cases : forall a b, segment_u_eqb a b = true ->
  a = b \/ a = reverse_segment b.
Proof.
  intros a b H. unfold segment_u_eqb in H. apply orb_true_iff in H.
  destruct H as [H|H]; apply segment_eqb_eq in H; auto.
Qed.

(** [a_XYZ] and [a_ZYX] name the same angle, and angle congruence is symmetric,
    so an angle-congruence fact is matched the same way a segment-congruence
    fact is. *)
Definition reverse_angle (a : Angle) :=
  angle a.(ang_right) a.(ang_vertex) a.(ang_left).
Definition angle_u_eqb (a b : Angle) : bool :=
  angle_eqb a b || angle_eqb a (reverse_angle b).
Definition angle_pair_eqb (a b c d : Angle) : bool :=
  (angle_u_eqb a c && angle_u_eqb b d) || (angle_u_eqb a d && angle_u_eqb b c).

Lemma angle_u_eqb_cases : forall a b, angle_u_eqb a b = true ->
  a = b \/ a = reverse_angle b.
Proof.
  intros a b H. unfold angle_u_eqb in H. apply orb_true_iff in H.
  destruct H as [H|H]; apply angle_eqb_eq in H; auto.
Qed.

(** `RefSeg` and `RefAng` carry the same geometry as their `Con*` forms. *)
Definition fact_eqb (expected actual : Statement) : bool :=
  match expected, actual with
  | ConSeg a b, ConSeg c d | ConSeg a b, RefSeg c d
  | RefSeg a b, ConSeg c d | RefSeg a b, RefSeg c d =>
      segment_pair_eqb a b c d
  | ConAng a b, ConAng c d | ConAng a b, RefAng c d
  | RefAng a b, ConAng c d | RefAng a b, RefAng c d =>
      angle_pair_eqb a b c d
  | ConTri a b, ConTri c d => triangle_eqb a c && triangle_eqb b d
  | RightAng a, RightAng b => angle_eqb a b
  | ConRight a b, ConRight c d => angle_pair_eqb a b c d
  | PerpAt a b p, PerpAt c d q =>
      segment_u_eqb a c && segment_u_eqb b d && ascii_eqb p q
  | MidptOf a p, MidptOf b q => segment_u_eqb a b && ascii_eqb p q
  | IntersectSeg a b p, IntersectSeg c d q =>
      segment_eqb a c && segment_eqb b d && ascii_eqb p q
  (* Reversing the ray commutes the two disjuncts of the bisector meaning. *)
  | AngBisectOf a b, AngBisectOf c d => angle_eqb a c && segment_u_eqb b d
  | OnLine a p, OnLine b q => segment_u_eqb a b && ascii_eqb p q
  | IsoscelesTri a, IsoscelesTri b | EquilateralTri a, EquilateralTri b
  | EquiangularTri a, EquiangularTri b => triangle_eqb a b
  (* [SuppA] is symmetric and unaffected by reversing either angle. *)
  | Supplementary a b, Supplementary c d => angle_pair_eqb a b c d
  | _, _ => false
  end.

Definition lookup_step (facts : list Statement) (index : nat) : option Statement :=
  match index with O => None | S n => nth_error facts n end.

(** An angle spanning the three vertices of a declared triangle has
    nondegenerate rays, because declaring a triangle asserts that its vertices
    are noncollinear. *)
Definition angle_of_triangle (t : Triangle) (a : Angle) : bool :=
  angle_eqb a (angle t.(tri_b) t.(tri_a) t.(tri_c)) ||
  angle_eqb a (angle t.(tri_c) t.(tri_a) t.(tri_b)) ||
  angle_eqb a (angle t.(tri_a) t.(tri_b) t.(tri_c)) ||
  angle_eqb a (angle t.(tri_c) t.(tri_b) t.(tri_a)) ||
  angle_eqb a (angle t.(tri_a) t.(tri_c) t.(tri_b)) ||
  angle_eqb a (angle t.(tri_b) t.(tri_c) t.(tri_a)).

(** An angle is nondegenerate if it spans a declared triangle's vertices, or if
    it is itself declared on an [ang:] line -- the audited meaning of an angle
    declaration is exactly [AngleWellFormed]. *)
Definition declared_angle (decls : Declarations) (a : Angle) : bool :=
  existsb (fun t => angle_of_triangle t a) decls.(decl_triangles) ||
  existsb (angle_u_eqb a) decls.(decl_angles).

(** A triangle criterion may consume a [con_right] fact where it expects a
    [con_ang] one: two right angles are congruent as soon as both have
    nondegenerate rays, which declared triangles supply. *)
Definition dependency_matches (decls : Declarations)
    (expected actual : Statement) : bool :=
  fact_eqb expected actual ||
  match expected, actual with
  | ConAng a b, ConRight c d =>
      angle_u_eqb a c && angle_u_eqb b d &&
      declared_angle decls a && declared_angle decls b
  | _, _ => false
  end.

Definition schema3 (decls : Declarations) (facts : list Statement)
    (i j k : nat) (a b c : Statement) : bool :=
  match lookup_step facts i, lookup_step facts j, lookup_step facts k with
  | Some x, Some y, Some z =>
      dependency_matches decls a x && dependency_matches decls b y &&
      dependency_matches decls c z
  | _, _, _ => false
  end.

Definition sas_schema decls facts i j k (t u : Triangle) : bool :=
  schema3 decls facts i j k
    (ConSeg (side_ab t) (side_ab u))
    (ConAng (angle_a t) (angle_a u))
    (ConSeg (side_ca t) (side_ca u)).

Definition sss_schema decls facts i j k (t u : Triangle) : bool :=
  schema3 decls facts i j k
    (ConSeg (side_ab t) (side_ab u))
    (ConSeg (side_bc t) (side_bc u))
    (ConSeg (side_ca t) (side_ca u)).

Definition asa_schema decls facts i j k (t u : Triangle) : bool :=
  schema3 decls facts i j k
    (ConAng (angle_a t) (angle_a u))
    (ConSeg (side_ab t) (side_ab u))
    (ConAng (angle_b t) (angle_b u)).

(** The two angles are interchangeable in the citation: swapping them names
    the same three facts, so both orders are accepted. *)
Definition aas_schema decls facts i j k (t u : Triangle) : bool :=
  schema3 decls facts i j k
    (ConAng (angle_c t) (angle_c u))
    (ConAng (angle_b t) (angle_b u))
    (ConSeg (side_ab t) (side_ab u)) ||
  schema3 decls facts i j k
    (ConAng (angle_b t) (angle_b u))
    (ConAng (angle_c t) (angle_c u))
    (ConSeg (side_ab t) (side_ab u)).

(** Right-hypotenuse-leg.  The bundled fixtures disagree about whether the
    hypotenuse or the leg is cited second, and the catalog only says both are
    segment congruences, so both readings are accepted; each is separately
    sound.  Two legs are still refused, and the correspondence search already
    covers which leg is cited. *)
Definition rhl_schema decls facts i j k (t u : Triangle) : bool :=
  schema3 decls facts i j k
    (ConRight (angle_b t) (angle_b u))
    (ConSeg (side_ca t) (side_ca u))
    (ConSeg (side_bc t) (side_bc u)) ||
  schema3 decls facts i j k
    (ConRight (angle_b t) (angle_b u))
    (ConSeg (side_bc t) (side_bc u))
    (ConSeg (side_ca t) (side_ca u)).

Definition three_rotations
    (schema : Declarations -> list Statement -> nat -> nat -> nat ->
              Triangle -> Triangle -> bool)
    decls facts i j k t u : bool :=
  schema decls facts i j k t u ||
  schema decls facts i j k (rotate_triangle t) (rotate_triangle u) ||
  schema decls facts i j k (rotate_triangle (rotate_triangle t))
                               (rotate_triangle (rotate_triangle u)).

(** A criterion's dependency order fixes which vertex plays which role, so the
    correspondence must be searched in both orientations, not only in its three
    rotations. *)
Definition reverse_triangle (t : Triangle) : Triangle :=
  triangle t.(tri_c) t.(tri_b) t.(tri_a).

Definition six_correspondences
    (schema : Declarations -> list Statement -> nat -> nat -> nat ->
              Triangle -> Triangle -> bool)
    decls facts i j k t u : bool :=
  three_rotations schema decls facts i j k t u ||
  three_rotations schema decls facts i j k
    (reverse_triangle t) (reverse_triangle u).

(** Declaring [t_ABC] asserts that its vertices are noncollinear, and that is
    invariant under renaming the triangle's vertices. *)
Definition triangle_permutations (t : Triangle) : list Triangle :=
  [ triangle t.(tri_a) t.(tri_b) t.(tri_c); triangle t.(tri_a) t.(tri_c) t.(tri_b)
  ; triangle t.(tri_b) t.(tri_a) t.(tri_c); triangle t.(tri_b) t.(tri_c) t.(tri_a)
  ; triangle t.(tri_c) t.(tri_a) t.(tri_b); triangle t.(tri_c) t.(tri_b) t.(tri_a) ].

Definition triangle_declared (decls : Declarations) (t : Triangle) : bool :=
  existsb (fun d => triangle_mem t (triangle_permutations d))
          decls.(decl_triangles).

(** The same six readings [six_correspondences] searches, as data, for rules
    whose shape does not fit the three-dependency schema. *)
Definition correspondences (t u : Triangle) : list (Triangle * Triangle) :=
  let r := rotate_triangle in
  let t' := reverse_triangle t in
  let u' := reverse_triangle u in
  [ (t, u); (r t, r u); (r (r t), r (r u))
  ; (t', u'); (r t', r u'); (r (r t'), r (r u')) ].

Definition declared_pair (decls : Declarations) (t u : Triangle) : bool :=
  triangle_declared decls t && triangle_declared decls u.

Definition cpctc_facts (t u : Triangle) : list Statement :=
  [ ConSeg (side_ab t) (side_ab u)
  ; ConSeg (side_bc t) (side_bc u)
  ; ConSeg (side_ca t) (side_ca u)
  ; ConAng (angle_a t) (angle_a u)
  ; ConAng (angle_b t) (angle_b u)
  ; ConAng (angle_c t) (angle_c u)
  ].

Definition is_cpctc_fact (t u : Triangle) (conclusion : Statement) : bool :=
  existsb (fun expected => fact_eqb expected conclusion) (cpctc_facts t u).

(** Transitivity of congruence.  A dependency states a congruence between two
    like objects; the two dependencies must share one object, and the
    conclusion must congruate the remaining two.  Sharing is decided by the
    same object identity the corresponding [fact_eqb] case uses, so segments
    may be shared with either endpoint order while angles and triangles must
    be shared exactly. *)
Definition segment_congruence_pair (s : Statement) : option (Segment * Segment) :=
  match s with ConSeg a b | RefSeg a b => Some (a, b) | _ => None end.
Definition angle_congruence_pair (s : Statement) : option (Angle * Angle) :=
  match s with ConAng a b | RefAng a b => Some (a, b) | _ => None end.
Definition triangle_congruence_pair (s : Statement) : option (Triangle * Triangle) :=
  match s with ConTri a b => Some (a, b) | _ => None end.

Section Transitivity.
Context {A : Type} (same : A -> A -> bool) (congruence : A -> A -> Statement).

Definition transitive_link (x1 x2 y1 y2 : A) (conclusion : Statement) : bool :=
  (same x2 y1 && fact_eqb (congruence x1 y2) conclusion) ||
  (same x2 y2 && fact_eqb (congruence x1 y1) conclusion) ||
  (same x1 y1 && fact_eqb (congruence x2 y2) conclusion) ||
  (same x1 y2 && fact_eqb (congruence x2 y1) conclusion).

Definition transitive_rule (pair_of : Statement -> option (A * A))
    (facts : list Statement) (i j : nat) (conclusion : Statement) : bool :=
  match lookup_step facts i, lookup_step facts j with
  | Some first, Some second =>
      match pair_of first, pair_of second with
      | Some (x1, x2), Some (y1, y2) => transitive_link x1 x2 y1 y2 conclusion
      | _, _ => false
      end
  | _, _ => false
  end.
End Transitivity.

Definition con_seg_transitive facts i j conclusion : bool :=
  transitive_rule segment_u_eqb ConSeg segment_congruence_pair facts i j conclusion.
Definition con_ang_transitive facts i j conclusion : bool :=
  transitive_rule angle_u_eqb ConAng angle_congruence_pair facts i j conclusion.
Definition con_tri_transitive facts i j conclusion : bool :=
  transitive_rule triangle_eqb ConTri triangle_congruence_pair facts i j conclusion.

(** Two right angles are congruent.  The audited [right] meaning supplies the
    nondegenerate rays that GeoCoq's [l11_16] needs, so this rule may conclude
    either [con_right] or [con_ang]. *)
Definition def_con_right_conclusion (a b : Angle) (conclusion : Statement) : bool :=
  match conclusion with
  | ConRight c d | ConAng c d =>
      (angle_u_eqb a c && angle_u_eqb b d) || (angle_u_eqb a d && angle_u_eqb b c)
  | _ => false
  end.

Definition def_con_right (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i, lookup_step facts j with
  | Some (RightAng a), Some (RightAng b) => def_con_right_conclusion a b conclusion
  | _, _ => false
  end.

(** Every angle whose vertex is the foot of a perpendicular and whose rays end
    on the two perpendicular segments is right.  [Perp_at] states exactly this
    for all points collinear with either segment, and segment endpoints are
    trivially collinear with their own segment. *)
Definition endpoint_of (c : PointId) (s : Segment) : bool :=
  ascii_eqb c s.(seg_start) || ascii_eqb c s.(seg_end).

Definition perp_right_angle (s t : Segment) (p : PointId) (a : Angle) : bool :=
  ascii_eqb a.(ang_vertex) p &&
  ((endpoint_of a.(ang_left) s && endpoint_of a.(ang_right) t) ||
   (endpoint_of a.(ang_left) t && endpoint_of a.(ang_right) s)).

Definition perp_con_ang (decls : Declarations) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match lookup_step facts i with
  | Some (PerpAt s t p) =>
      match conclusion with
      | ConRight a b => perp_right_angle s t p a && perp_right_angle s t p b
      (* [Perp_at] alone forces neither ray to be nondegenerate, but a declared
         triangle spanning the angle does, and that is all [l11_16] needs. *)
      | ConAng a b =>
          perp_right_angle s t p a && perp_right_angle s t p b &&
          declared_angle decls a && declared_angle decls b
      | _ => false
      end
  | _ => false
  end.

(** A midpoint halves its segment. *)
Definition def_midpt (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i with
  | Some (MidptOf s p) =>
      fact_eqb (ConSeg (segment s.(seg_start) p) (segment p s.(seg_end))) conclusion
  | _ => false
  end.

(** Vertical angles.  Two segments crossing at [p] give two pairs of opposite
    angles at [p]; both members of the concluded pair must span the vertices of
    a declared triangle, which is what supplies the nondegenerate rays.  This
    reason takes no step dependency, so the crossing is looked up among the
    diagram premises. *)
Definition vertical_angle_pair (decls : Declarations) (s t : Segment)
    (p : PointId) (conclusion : Statement) : bool :=
  let opposite first second :=
    declared_angle decls first && declared_angle decls second &&
    fact_eqb (ConAng first second) conclusion in
  opposite (angle s.(seg_start) p t.(seg_start))
           (angle s.(seg_end) p t.(seg_end)) ||
  opposite (angle s.(seg_start) p t.(seg_end))
           (angle s.(seg_end) p t.(seg_start)).

Definition vert_ang (decls : Declarations) (premises : list Premise)
    (label : string) (conclusion : Statement) : bool :=
  existsb (fun pr =>
             (String.eqb label EmptyString || String.eqb label pr.(premise_label)) &&
             match pr.(premise_statement) with
             | IntersectSeg s t p => vertical_angle_pair decls s t p conclusion
             | _ => false
             end) premises.

(** An angle bisector halves its angle.  The audited meaning is a disjunction
    over which endpoint of the ray names the vertex, and that is a condition on
    names, so the checker can decide which disjunct is available. *)
Definition def_ang_bisect (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i with
  | Some (AngBisectOf a s) =>
      let halves far :=
        ConAng (angle a.(ang_left) a.(ang_vertex) far)
               (angle far a.(ang_vertex) a.(ang_right)) in
      (ascii_eqb s.(seg_start) a.(ang_vertex) &&
        fact_eqb (halves s.(seg_end)) conclusion) ||
      (ascii_eqb s.(seg_end) a.(ang_vertex) &&
        fact_eqb (halves s.(seg_start)) conclusion)
  | _ => false
  end.

(** Converse of the midpoint definition.  Congruent halves alone do not place
    the point between the endpoints, so this rule additionally requires an
    [on_line] diagram premise: on a line there is exactly one point equidistant
    from two distinct points. *)
Definition on_line_witness (s : Statement) : option (Segment * PointId) :=
  match s with OnLine t q => Some (t, q) | _ => None end.

Definition midpt_conv (premises : list Premise) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match conclusion with
  | MidptOf s p =>
      match lookup_step facts i with
      | Some dependency =>
          fact_eqb (ConSeg (segment s.(seg_start) p) (segment p s.(seg_end)))
                   dependency &&
          existsb (fun pr =>
                     match on_line_witness pr.(premise_statement) with
                     | Some (t, q) => segment_u_eqb s t && ascii_eqb p q
                     | None => false
                     end) premises
      | None => false
      end
  | _ => false
  end.

(** Two angles of a triangle determine the third.  The rule needs both
    triangles, and they are not named by the conclusion, so it searches the
    declared pairs; declaring them is also what rules out degenerate ones. *)
Definition schema2 (decls : Declarations) (facts : list Statement)
    (i j : nat) (a b : Statement) : bool :=
  match lookup_step facts i, lookup_step facts j with
  | Some x, Some y =>
      dependency_matches decls a x && dependency_matches decls b y
  | _, _ => false
  end.

Definition third_angle_at (decls : Declarations) (facts : list Statement)
    (i j : nat) (t u : Triangle) (conclusion : Statement) : bool :=
  schema2 decls facts i j
    (ConAng (angle_a t) (angle_a u))
    (ConAng (angle_b t) (angle_b u)) &&
  fact_eqb (ConAng (angle_c t) (angle_c u)) conclusion.

Definition third_angle (decls : Declarations) (facts : list Statement)
    (i j : nat) (conclusion : Statement) : bool :=
  existsb (fun t => existsb (fun u =>
      existsb (fun c => third_angle_at decls facts i j (fst c) (snd c) conclusion)
              (correspondences t u))
    decls.(decl_triangles)) decls.(decl_triangles).

Definition schema6 (decls : Declarations) (facts : list Statement)
    (i1 i2 i3 i4 i5 i6 : nat) (a b c d e f : Statement) : bool :=
  schema3 decls facts i1 i2 i3 a b c &&
  schema3 decls facts i4 i5 i6 d e f.

(** All six corresponding parts, cited explicitly.  The dependency order fixes
    the correspondence, so the six readings of the conclusion are searched as
    they are for the other criteria. *)
Definition def_con_tri_at (decls : Declarations) (facts : list Statement)
    (i1 i2 i3 i4 i5 i6 : nat) (t u : Triangle) : bool :=
  schema6 decls facts i1 i2 i3 i4 i5 i6
    (ConSeg (side_ab t) (side_ab u))
    (ConSeg (side_bc t) (side_bc u))
    (ConSeg (side_ca t) (side_ca u))
    (ConAng (angle_a t) (angle_a u))
    (ConAng (angle_b t) (angle_b u))
    (ConAng (angle_c t) (angle_c u)).

Definition def_con_tri (decls : Declarations) (facts : list Statement)
    (i1 i2 i3 i4 i5 i6 : nat) (conclusion : Statement) : bool :=
  match conclusion with
  | ConTri t u =>
      declared_pair decls t u &&
      existsb (fun c => def_con_tri_at decls facts i1 i2 i3 i4 i5 i6
                          (fst c) (snd c))
              (correspondences t u)
  | _ => false
  end.

(** Triangle shape statements.  Each names one declared triangle, which is
    where its nondegeneracy comes from. *)
Definition isosceles_pairs (t : Triangle) : list Statement :=
  [ ConSeg (side_ab t) (side_bc t)
  ; ConSeg (side_bc t) (side_ca t)
  ; ConSeg (side_ca t) (side_ab t) ].

Definition def_isosceles (decls : Declarations) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match conclusion with
  | IsoscelesTri t =>
      triangle_declared decls t &&
      match lookup_step facts i with
      | Some dependency =>
          existsb (fun expected => fact_eqb expected dependency)
                  (isosceles_pairs t)
      | None => false
      end
  | _ => false
  end.

(** Pons asinorum, with the apex at the first vertex of some reading of a
    declared triangle. *)
Definition base_angle_sides (t : Triangle) : Statement :=
  ConSeg (segment t.(tri_a) t.(tri_b)) (segment t.(tri_a) t.(tri_c)).
Definition base_angle_angles (t : Triangle) : Statement :=
  ConAng (angle t.(tri_a) t.(tri_b) t.(tri_c))
         (angle t.(tri_a) t.(tri_c) t.(tri_b)).

Definition apex_readings (t : Triangle) : list Triangle :=
  [t; rotate_triangle t; rotate_triangle (rotate_triangle t)].

Definition base_angle (decls : Declarations) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match lookup_step facts i with
  | Some dependency =>
      existsb (fun t => triangle_declared decls t &&
                        fact_eqb (base_angle_sides t) dependency &&
                        fact_eqb (base_angle_angles t) conclusion)
              (flat_map apex_readings decls.(decl_triangles))
  | None => false
  end.

Definition base_angle_conv (decls : Declarations) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match lookup_step facts i with
  | Some dependency =>
      existsb (fun t => triangle_declared decls t &&
                        fact_eqb (base_angle_angles t) dependency &&
                        fact_eqb (base_angle_sides t) conclusion)
              (flat_map apex_readings decls.(decl_triangles))
  | None => false
  end.

Definition def_equilateral (decls : Declarations) (facts : list Statement)
    (i j k : nat) (conclusion : Statement) : bool :=
  match conclusion with
  | EquilateralTri t =>
      triangle_declared decls t &&
      schema3 decls facts i j k
        (ConSeg (side_ab t) (side_bc t))
        (ConSeg (side_bc t) (side_ca t))
        (ConSeg (side_ca t) (side_ab t))
  | _ => false
  end.

Definition def_equiangular (decls : Declarations) (facts : list Statement)
    (i j k : nat) (conclusion : Statement) : bool :=
  match conclusion with
  | EquiangularTri t =>
      triangle_declared decls t &&
      schema3 decls facts i j k
        (ConAng (angle_a t) (angle_b t))
        (ConAng (angle_b t) (angle_c t))
        (ConAng (angle_c t) (angle_a t))
  | _ => false
  end.

Definition equilat_equiang (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | EquiangularTri t, Some (EquilateralTri u) => triangle_eqb t u
  | _, _ => false
  end.

Definition equiang_equilat (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | EquilateralTri t, Some (EquiangularTri u) => triangle_eqb t u
  | _, _ => false
  end.

(** Angles supplementary to congruent angles are congruent, and so are two
    supplements of the same angle. *)
Definition con_supplements (facts : list Statement) (i j k : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i, lookup_step facts j, lookup_step facts k with
  | Some (Supplementary a b), Some (Supplementary c d), Some witness =>
      (fact_eqb (ConAng b d) witness && fact_eqb (ConAng a c) conclusion) ||
      (fact_eqb (ConAng b c) witness && fact_eqb (ConAng a d) conclusion) ||
      (fact_eqb (ConAng a d) witness && fact_eqb (ConAng b c) conclusion) ||
      (fact_eqb (ConAng a c) witness && fact_eqb (ConAng b d) conclusion)
  | _, _, _ => false
  end.

Definition con_supplements_same (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i, lookup_step facts j with
  | Some (Supplementary a b), Some (Supplementary c d) =>
      (angle_u_eqb d b && fact_eqb (ConAng a c) conclusion) ||
      (angle_u_eqb c b && fact_eqb (ConAng a d) conclusion) ||
      (angle_u_eqb d a && fact_eqb (ConAng b c) conclusion) ||
      (angle_u_eqb c a && fact_eqb (ConAng b d) conclusion)
  | _, _ => false
  end.

(** A right angle at [p] whose rays reach the two lines makes them
    perpendicular at [p].  [Perp_at] additionally demands that the whole of
    each line meet at right angles, so the [on_line] premise is what lets the
    right angle be transported from the ray to the line that contains it. *)
Definition other_endpoint (c : PointId) (s : Segment) : PointId :=
  if ascii_eqb c s.(seg_start) then s.(seg_end) else s.(seg_start).

Definition def_perp_shape (u s : Segment) (p x y : PointId) : bool :=
  endpoint_of p u && endpoint_of x s && endpoint_of y u.

Definition def_perp (premises : list Premise) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match conclusion with
  | PerpAt u s p =>
      match lookup_step facts i with
      | Some (RightAng a) =>
          ascii_eqb a.(ang_vertex) p &&
          (def_perp_shape u s p a.(ang_left) a.(ang_right) ||
           def_perp_shape u s p a.(ang_right) a.(ang_left)) &&
          existsb (fun pr =>
                     match on_line_witness pr.(premise_statement) with
                     | Some (t, q) => segment_u_eqb s t && ascii_eqb p q
                     | None => false
                     end) premises
      | _ => false
      end
  | _ => false
  end.

Fixpoint find_premise (label : string) (premises : list Premise) : option Statement :=
  match premises with
  | [] => None
  | p :: rest =>
      if String.eqb label p.(premise_label) then Some p.(premise_statement)
      else find_premise label rest
  end.

Definition rule_valid (decls : Declarations) (premises : list Premise)
    (facts : list Statement) (r : Reason) (conclusion : Statement) : bool :=
  match r with
  | Given label =>
      match find_premise label premises with
      | Some prem => statement_eqb prem conclusion
      | None => false
      end
  | Reflex =>
      match conclusion with
      | RefSeg a b => segment_u_eqb a b
      (* An angle is congruent to itself once its rays are known to be
         nondegenerate, which a declaration supplies. *)
      | RefAng a b => angle_u_eqb a b && declared_angle decls a
      | _ => false
      end
  | SAS i j k =>
      match conclusion with
      | ConTri t u => declared_pair decls t u &&
          six_correspondences sas_schema decls facts i j k t u
      | _ => false
      end
  | SSS i j k =>
      match conclusion with
      | ConTri t u => declared_pair decls t u &&
          six_correspondences sss_schema decls facts i j k t u
      | _ => false
      end
  | ASA i j k =>
      match conclusion with
      | ConTri t u => declared_pair decls t u &&
          six_correspondences asa_schema decls facts i j k t u
      | _ => false
      end
  | AAS i j k =>
      match conclusion with
      | ConTri t u => declared_pair decls t u &&
          six_correspondences aas_schema decls facts i j k t u
      | _ => false
      end
  | CPCTC i =>
      match lookup_step facts i with
      | Some (ConTri t u) => is_cpctc_fact t u conclusion
      | _ => false
      end
  | ConSegTrans i j => con_seg_transitive facts i j conclusion
  | ConAngTrans i j => con_ang_transitive facts i j conclusion
  | ConTriTrans i j => con_tri_transitive facts i j conclusion
  | DefConRight i j => def_con_right facts i j conclusion
  | PerpConAng i => perp_con_ang decls facts i conclusion
  | DefMidpt i => def_midpt facts i conclusion
  | VertAng label => vert_ang decls premises label conclusion
  | DefAngBisect i => def_ang_bisect facts i conclusion
  | MidptConv i => midpt_conv premises facts i conclusion
  | ThirdAngle i j => third_angle decls facts i j conclusion
  | DefConTri i1 i2 i3 i4 i5 i6 =>
      def_con_tri decls facts i1 i2 i3 i4 i5 i6 conclusion
  | DefIsosceles i => def_isosceles decls facts i conclusion
  | BaseAngle i => base_angle decls facts i conclusion
  | BaseAngleConv i => base_angle_conv decls facts i conclusion
  | DefEquilateral i j k => def_equilateral decls facts i j k conclusion
  | DefEquiangular i j k => def_equiangular decls facts i j k conclusion
  | EquilatEquiang i => equilat_equiang facts i conclusion
  | EquiangEquilat i => equiang_equilat facts i conclusion
  | ConSupplements i j k => con_supplements facts i j k conclusion
  | ConSupplementsSame i j => con_supplements_same facts i j conclusion
  | DefPerp i => def_perp premises facts i conclusion
  | RHL i j k =>
      match conclusion with
      | ConTri t u => declared_pair decls t u &&
          six_correspondences rhl_schema decls facts i j k t u
      | _ => false
      end
  end.

Fixpoint check_steps decls premises facts steps : option (list Statement) :=
  match steps with
  | [] => Some facts
  | s :: rest =>
      if rule_valid decls premises facts s.(step_reason) s.(step_conclusion)
      then check_steps decls premises (facts ++ [s.(step_conclusion)]) rest
      else None
  end.

Definition check_problem (p : Problem) : bool :=
  match check_steps p.(problem_declarations) p.(problem_premises) [] p.(problem_steps) with
  | Some facts => existsb (statement_eqb p.(problem_goal)) facts
  | None => false
  end.

Section Soundness.

Context `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}.
Variable point : PointId -> Tpoint.

Notation Interp := (interp_statement point).

Lemma perp_at_realign : forall a b c d p q,
  segment_u_eqb a c = true -> segment_u_eqb b d = true ->
  ascii_eqb p q = true ->
  (Interp (PerpAt a b p) <-> Interp (PerpAt c d q)).
Proof.
  intros a b c d p q Ha Hb Hp. unfold ascii_eqb in Hp.
  apply Ascii.eqb_eq in Hp. subst q.
  apply segment_u_eqb_cases in Ha. apply segment_u_eqb_cases in Hb.
  destruct Ha as [Ha|Ha]; destruct Hb as [Hb|Hb]; subst;
    unfold reverse_segment; cbn; split; intro H;
    solve [ assumption
          | now apply perp_in_left_comm | now apply perp_in_right_comm
          | now apply perp_in_comm ].
Qed.

Lemma fact_eqb_sound : forall expected actual,
  fact_eqb expected actual = true -> (Interp expected <-> Interp actual).
Proof.
  assert (Hpair : forall a b c d,
      segment_pair_eqb a b c d = true ->
      (interp_segment_congruence point a b <->
       interp_segment_congruence point c d)).
  { intros a b c d H. unfold segment_pair_eqb in H. apply orb_true_iff in H.
    destruct H as [H|H]; apply andb_true_iff in H; destruct H as [H1 H2];
      apply segment_u_eqb_cases in H1; apply segment_u_eqb_cases in H2;
      destruct H1 as [H1|H1]; destruct H2 as [H2|H2]; subst;
      unfold reverse_segment, interp_segment_congruence; cbn; split; intro; Cong. }
  assert (Hangles : forall a b c d,
      angle_pair_eqb a b c d = true ->
      (interp_angle_congruence point a b <->
       interp_angle_congruence point c d)).
  { intros a b c d H. unfold angle_pair_eqb in H. apply orb_true_iff in H.
    destruct H as [H|H]; apply andb_true_iff in H; destruct H as [H1 H2];
      apply angle_u_eqb_cases in H1; apply angle_u_eqb_cases in H2;
      destruct H1 as [H1|H1]; destruct H2 as [H2|H2]; subst;
      unfold reverse_angle, interp_angle_congruence; cbn; split; intro; CongA. }
  assert (Hsupp : forall a b c d, angle_pair_eqb a b c d = true ->
      (Interp (Supplementary a b) <-> Interp (Supplementary c d))).
  { intros a b c d H. unfold angle_pair_eqb in H. apply orb_true_iff in H.
    destruct H as [H|H]; apply andb_true_iff in H; destruct H as [H1 H2];
      apply angle_u_eqb_cases in H1; apply angle_u_eqb_cases in H2;
      destruct H1 as [H1|H1]; destruct H2 as [H2|H2]; subst;
      unfold reverse_angle; cbn; split; intro Hs;
      solve [ assumption
            | now apply suppa_sym
            | now apply suppa_left_comm | now apply suppa_right_comm
            | now apply suppa_comm
            | now apply suppa_left_comm, suppa_sym
            | now apply suppa_right_comm, suppa_sym
            | now apply suppa_comm, suppa_sym
            | now apply suppa_sym, suppa_left_comm
            | now apply suppa_sym, suppa_right_comm
            | now apply suppa_sym, suppa_comm ]. }
  assert (Hrights : forall a b c d, angle_pair_eqb a b c d = true ->
      ((right_angle point a /\ right_angle point b) <->
       (right_angle point c /\ right_angle point d))).
  { intros a b c d H. unfold angle_pair_eqb in H. apply orb_true_iff in H.
    destruct H as [H|H]; apply andb_true_iff in H; destruct H as [H1 H2];
      apply angle_u_eqb_cases in H1; apply angle_u_eqb_cases in H2;
      destruct H1 as [H1|H1]; destruct H2 as [H2|H2]; subst;
      unfold reverse_angle, right_angle; cbn;
      split; intros [Hx Hy]; split;
      solve [assumption | now apply l8_2]. }
  destruct expected, actual; cbn; try discriminate; intros H;
    try (now apply Hpair); try (now apply Hangles); try (now apply Hrights);
    try (now apply Hsupp);
    try (apply andb_true_iff in H; destruct H as [H ?];
         apply andb_true_iff in H; destruct H as [H ?];
         now apply perp_at_realign);
    (* Split only syntactic conjunctions: the object comparisons are
       themselves conjunctions of character tests, and decomposing those
       would lose the record-level equalities this proof needs. *)
    repeat match goal with
    | Heq : _ && _ = true |- _ => apply andb_true_iff in Heq; destruct Heq as [? ?]
    end;
    repeat match goal with
    | Heq : segment_eqb _ _ = true |- _ => apply segment_eqb_eq in Heq
    | Heq : segment_u_eqb _ _ = true |- _ =>
        apply segment_u_eqb_cases in Heq; destruct Heq as [Heq|Heq]
    | Heq : angle_eqb _ _ = true |- _ => apply angle_eqb_eq in Heq
    | Heq : triangle_eqb _ _ = true |- _ => apply triangle_eqb_eq in Heq
    | Heq : ascii_eqb _ _ = true |- _ => apply Ascii.eqb_eq in Heq
    end; subst;
    (* residual cases: a midpoint, an angle bisector, or an on-line witness
       stated on a reversed segment *)
    solve [ tauto
          | unfold reverse_segment; cbn; split; apply l7_2
          | unfold reverse_segment; cbn; tauto
          | unfold reverse_segment; cbn;
            split; intros [Hne Hcol]; (split; [congruence|Col]) ].
Qed.

Lemma find_premise_sound : forall label premises statement,
  find_premise label premises = Some statement ->
  exists p, In p premises /\ p.(premise_statement) = statement.
Proof.
  intros label premises. induction premises as [|p rest IH]; cbn; intros statement H.
  - discriminate.
  - destruct (String.eqb label (premise_label p)) eqn:Heq.
    + inversion H. exists p. auto.
    + apply IH in H. destruct H as [q [Hin Hq]]. exists q. auto.
Qed.

Lemma lookup_step_sound : forall facts i statement,
  Forall Interp facts -> lookup_step facts i = Some statement -> Interp statement.
Proof.
  intros facts [|i] statement Hall Hlookup; cbn in Hlookup; try discriminate.
  eapply Forall_forall; [exact Hall|]. eapply nth_error_In; eauto.
Qed.

Lemma angle_u_eqb_right : forall a b, angle_u_eqb a b = true ->
  (right_angle point a <-> right_angle point b).
Proof.
  intros a b H. apply angle_u_eqb_cases in H.
  destruct H as [Heq|Heq]; subst a; [tauto|].
  unfold reverse_angle, right_angle; cbn. split; apply l8_2.
Qed.

Lemma angle_u_eqb_well_formed : forall a b, angle_u_eqb a b = true ->
  (angle_well_formed point a <-> angle_well_formed point b).
Proof.
  intros a b H. apply angle_u_eqb_cases in H.
  destruct H as [Heq|Heq]; subst a; [tauto|].
  unfold reverse_angle, angle_well_formed; cbn. tauto.
Qed.

Lemma declared_angle_sound : forall decls a,
  declarations_well_formed point decls ->
  declared_angle decls a = true -> angle_well_formed point a.
Proof.
  intros decls a [Hwft Hwfa] H. unfold declared_angle in H.
  apply orb_true_iff in H. destruct H as [H|H].
  - (* spans the vertices of a declared triangle *)
    apply existsb_exists in H. destruct H as [t [Hin Hangle]].
    pose proof (Hwft t Hin) as Hncol.
    destruct t as [A B C]. unfold triangle_well_formed in Hncol. cbn in Hncol.
    apply not_col_distincts in Hncol.
    destruct Hncol as [_ [Hab [Hbc Hac]]].
    unfold angle_of_triangle in Hangle. cbn in Hangle.
    repeat rewrite orb_true_iff in Hangle.
    unfold angle_well_formed.
    repeat match goal with H : _ \/ _ |- _ => destruct H as [H|H] end;
      apply angle_eqb_eq in Hangle; subst; cbn; split; auto.
  - (* declared directly on an [ang:] line *)
    apply existsb_exists in H. destruct H as [b [Hin Heq]].
    apply (proj2 (angle_u_eqb_well_formed _ _ Heq)). now apply Hwfa.
Qed.

Lemma dependency_matches_sound : forall decls expected actual,
  declarations_well_formed point decls ->
  dependency_matches decls expected actual = true ->
  Interp actual -> Interp expected.
Proof.
  intros decls expected actual Hwf H Hactual.
  unfold dependency_matches in H. apply orb_true_iff in H.
  destruct H as [H|H]; [now apply (fact_eqb_sound _ _ H)|].
  destruct expected; try discriminate. destruct actual; try discriminate.
  apply andb_true_iff in H. destruct H as [H Hb].
  apply andb_true_iff in H. destruct H as [H Ha].
  apply andb_true_iff in H. destruct H as [H1 H2].
  apply (declared_angle_sound decls _ Hwf) in Ha.
  apply (declared_angle_sound decls _ Hwf) in Hb.
  destruct Ha as [Hal Har]. destruct Hb as [Hbl Hbr].
  destruct Hactual as [Hpa Hpb].
  apply (proj2 (angle_u_eqb_right _ _ H1)) in Hpa.
  apply (proj2 (angle_u_eqb_right _ _ H2)) in Hpb.
  unfold right_angle in Hpa, Hpb.
  cbn. now apply l11_16.
Qed.

Lemma schema3_sound : forall decls facts i j k a b c,
  declarations_well_formed point decls ->
  Forall Interp facts -> schema3 decls facts i j k a b c = true ->
  Interp a /\ Interp b /\ Interp c.
Proof.
  intros decls facts i j k a b c Hwf Hall H.
  unfold schema3 in H.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate.
  destruct (lookup_step facts k) as [z|] eqn:Hz; try discriminate.
  apply andb_true_iff in H. destruct H as [Hab Hc].
  apply andb_true_iff in Hab. destruct Hab as [Ha Hb].
  pose proof (lookup_step_sound facts i x Hall Hx) as HIx.
  pose proof (lookup_step_sound facts j y Hall Hy) as HIy.
  pose proof (lookup_step_sound facts k z Hall Hz) as HIz.
  repeat split; eapply dependency_matches_sound; eauto.
Qed.

Lemma triangle_declared_sound : forall decls t,
  declarations_well_formed point decls ->
  triangle_declared decls t = true -> triangle_well_formed point t.
Proof.
  intros decls t [Hwft _] H. unfold triangle_declared in H.
  apply existsb_exists in H. destruct H as [d [Hin Hperm]].
  pose proof (Hwft d Hin) as Hd.
  apply triangle_mem_spec in Hperm. destruct d as [A B C].
  unfold triangle_well_formed in Hd |- *. cbn in Hd, Hperm.
  destruct Hperm as [<-|[<-|[<-|[<-|[<-|[<-|[]]]]]]]; cbn;
    intro Hcol; apply Hd; Col.
Qed.

Lemma declared_pair_sound : forall decls t u,
  declarations_well_formed point decls ->
  declared_pair decls t u = true ->
  triangle_well_formed point t /\ triangle_well_formed point u.
Proof.
  intros decls t u Hwf H. apply andb_true_iff in H. destruct H as [Ht Hu].
  split; eapply triangle_declared_sound; eauto.
Qed.

Lemma rotated_well_formed : forall t,
  triangle_well_formed point t -> triangle_well_formed point (rotate_triangle t).
Proof.
  intros [A B C]. unfold triangle_well_formed, rotate_triangle; cbn.
  intros Hncol Hcol. apply Hncol. Col.
Qed.

Lemma sas_schema_sound : forall decls facts i j k t u,
  declarations_well_formed point decls ->
  Forall Interp facts -> triangle_well_formed point t ->
  sas_schema decls facts i j k t u = true ->
  interp_triangle_congruence point t u.
Proof.
  intros decls facts i j k [A B C] [D E F] Hdecl Hall Hwf Hschema.
  apply schema3_sound in Hschema; [|exact Hdecl|exact Hall]. cbn in Hschema |- *.
  destruct Hschema as [Hs1 [Ha Hs2]]. eapply ender_sas; eauto; Cong.
Qed.

Lemma sss_schema_sound : forall decls facts i j k t u,
  declarations_well_formed point decls ->
  Forall Interp facts -> triangle_well_formed point t ->
  sss_schema decls facts i j k t u = true -> interp_triangle_congruence point t u.
Proof.
  intros decls facts i j k [A B C] [D E F] Hdecl Hall Hwf Hschema.
  apply schema3_sound in Hschema; [|exact Hdecl|exact Hall]. cbn in Hschema |- *.
  destruct Hschema as [Hs1 [Hs2 Hs3]]. now apply ender_sss.
Qed.

Lemma asa_schema_sound : forall decls facts i j k t u,
  declarations_well_formed point decls ->
  Forall Interp facts -> triangle_well_formed point t ->
  asa_schema decls facts i j k t u = true -> interp_triangle_congruence point t u.
Proof.
  intros decls facts i j k [A B C] [D E F] Hdecl Hall Hwf Hschema.
  apply schema3_sound in Hschema; [|exact Hdecl|exact Hall]. cbn in Hschema |- *.
  destruct Hschema as [Ha [Hs Hb]]. now apply ender_asa.
Qed.

Lemma aas_schema_sound : forall decls facts i j k t u,
  declarations_well_formed point decls ->
  Forall Interp facts -> triangle_well_formed point t ->
  aas_schema decls facts i j k t u = true -> interp_triangle_congruence point t u.
Proof.
  intros decls facts i j k [A B C] [D E F] Hdecl Hall Hwf Hschema.
  unfold aas_schema in Hschema. apply orb_true_iff in Hschema.
  assert (Hparts : forall x y z : Statement,
      schema3 decls facts i j k x y z = true ->
      Interp x /\ Interp y /\ Interp z)
    by (intros; eapply schema3_sound; eauto).
  destruct Hschema as [H|H]; apply Hparts in H; cbn in H |- *.
  - destruct H as [Hc [Hb Hs]]. apply ender_aas; auto. now apply conga_comm.
  - destruct H as [Hb [Hc Hs]]. apply ender_aas; auto. now apply conga_comm.
Qed.

Lemma rhl_schema_sound : forall decls facts i j k t u,
  declarations_well_formed point decls ->
  Forall Interp facts -> triangle_well_formed point t ->
  rhl_schema decls facts i j k t u = true ->
  interp_triangle_congruence point t u.
Proof.
  intros decls facts i j k [A B C] [D E F] Hdecl Hall Hwf Hschema.
  unfold rhl_schema in Hschema. apply orb_true_iff in Hschema.
  assert (Hsides : forall x y z : Statement,
      schema3 decls facts i j k x y z = true -> Interp x /\ Interp y /\ Interp z)
    by (intros; eapply schema3_sound; eauto).
  assert (Hbuild : Per (point A) (point B) (point C) ->
                   Per (point D) (point E) (point F) ->
                   Cong (point C) (point A) (point F) (point D) ->
                   Cong (point B) (point C) (point E) (point F) ->
                   interp_triangle_congruence point (triangle A B C) (triangle D E F)).
  { intros Hper Hper' Hca Hbc.
    assert (Hcong3 : Cong_3 (point A) (point B) (point C)
                            (point D) (point E) (point F))
      by (apply cong2_per2__cong_3; auto; Cong).
    destruct Hcong3 as [Hab [Hac Hbc']]. cbn.
    apply ender_sss; auto; Cong. }
  destruct Hschema as [H|H]; apply Hsides in H; cbn in H;
    destruct H as [[Hper Hper'] [H1 H2]]; now apply Hbuild.
Qed.

Lemma three_rotations_sound : forall schema decls facts i j k t u,
  declarations_well_formed point decls ->
  Forall Interp facts -> triangle_well_formed point t ->
  (forall decls facts i j k t u,
    declarations_well_formed point decls ->
    Forall Interp facts -> triangle_well_formed point t ->
    schema decls facts i j k t u = true ->
    interp_triangle_congruence point t u) ->
  three_rotations schema decls facts i j k t u = true ->
  interp_triangle_congruence point t u.
Proof.
  intros schema decls facts i j k t u Hdecl Hall Hwf Hsound H.
  unfold three_rotations in H. apply orb_true_iff in H. destruct H as [H|H].
  - apply orb_true_iff in H. destruct H as [H|H].
    + exact (Hsound decls facts i j k t u Hdecl Hall Hwf H).
    + apply triangle_congruent_rotate_back.
      exact (Hsound decls facts i j k (rotate_triangle t) (rotate_triangle u)
               Hdecl Hall (rotated_well_formed t Hwf) H).
  - apply triangle_congruent_rotate_back. apply triangle_congruent_rotate_back.
    exact (Hsound decls facts i j k (rotate_triangle (rotate_triangle t))
             (rotate_triangle (rotate_triangle u)) Hdecl Hall
             (rotated_well_formed _ (rotated_well_formed t Hwf)) H).
Qed.

Lemma reversed_well_formed : forall t,
  triangle_well_formed point t -> triangle_well_formed point (reverse_triangle t).
Proof.
  intros [A B C]. unfold triangle_well_formed, reverse_triangle; cbn.
  intros Hncol Hcol. apply Hncol. Col.
Qed.

Lemma six_correspondences_sound : forall schema decls facts i j k t u,
  declarations_well_formed point decls ->
  Forall Interp facts -> triangle_well_formed point t ->
  (forall decls facts i j k t u,
    declarations_well_formed point decls ->
    Forall Interp facts -> triangle_well_formed point t ->
    schema decls facts i j k t u = true ->
    interp_triangle_congruence point t u) ->
  six_correspondences schema decls facts i j k t u = true ->
  interp_triangle_congruence point t u.
Proof.
  intros schema decls facts i j k [A B C] [D E F] Hdecl Hall Hwf Hsound H.
  unfold six_correspondences in H. apply orb_true_iff in H. destruct H as [H|H].
  - eapply three_rotations_sound; eauto.
  - apply triangle_congruent_reverse.
    change (interp_triangle_congruence point
              (reverse_triangle (triangle A B C)) (reverse_triangle (triangle D E F))).
    eapply three_rotations_sound;
      [exact Hdecl|exact Hall|now apply reversed_well_formed|exact Hsound|exact H].
Qed.

Lemma cpctc_sound : forall t u conclusion,
  interp_triangle_congruence point t u ->
  is_cpctc_fact t u conclusion = true -> Interp conclusion.
Proof.
  intros [A B C] [D E F] conclusion Htri H.
  unfold is_cpctc_fact, cpctc_facts in H. cbn [existsb] in H.
  repeat rewrite orb_true_iff in H.
  unfold interp_triangle_congruence in Htri. cbn in Htri.
  destruct Htri as [Hs1 [Hs2 [Hs3 [Ha [Hb Hc]]]]].
  repeat match goal with
  | H : _ \/ _ |- _ => destruct H as [H|H]
  end;
  try discriminate;
  apply fact_eqb_sound in H; tauto.
Qed.

(** One transitivity argument covers segments, angles, and triangles.  The
    shared-object test is only ever used to move an already established
    congruence onto an equal object, so no reflexivity — and in particular no
    nondegenerate-ray hypothesis for angles — is required. *)
Lemma transitive_rule_sound :
  forall (A : Type) (same : A -> A -> bool) (congruence : A -> A -> Statement)
         (pair_of : Statement -> option (A * A)),
  (forall w x y, same x y = true ->
     Interp (congruence w x) -> Interp (congruence w y)) ->
  (forall x y, Interp (congruence x y) -> Interp (congruence y x)) ->
  (forall x y z, Interp (congruence x y) -> Interp (congruence y z) ->
     Interp (congruence x z)) ->
  (forall s x y, pair_of s = Some (x, y) -> Interp s -> Interp (congruence x y)) ->
  forall facts i j conclusion,
  Forall Interp facts ->
  transitive_rule same congruence pair_of facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros A same congruence pair_of Hsame Hsym Htrans Hpair facts i j conclusion
    Hfacts Hrule.
  unfold transitive_rule in Hrule.
  destruct (lookup_step facts i) as [first|] eqn:Hfirst; try discriminate.
  destruct (lookup_step facts j) as [second|] eqn:Hsecond; try discriminate.
  destruct (pair_of first) as [[x1 x2]|] eqn:Hx; try discriminate.
  destruct (pair_of second) as [[y1 y2]|] eqn:Hy; try discriminate.
  assert (Hxx : Interp (congruence x1 x2))
    by (eapply Hpair; [exact Hx|eapply lookup_step_sound; eauto]).
  assert (Hyy : Interp (congruence y1 y2))
    by (eapply Hpair; [exact Hy|eapply lookup_step_sound; eauto]).
  unfold transitive_link in Hrule.
  repeat rewrite orb_true_iff in Hrule.
  assert (Hconclude : forall x y, Interp (congruence x y) ->
            fact_eqb (congruence x y) conclusion = true -> Interp conclusion).
  { intros x y Hxy Heq. now apply (fact_eqb_sound _ _ Heq). }
  destruct Hrule as [[[Hcase|Hcase]|Hcase]|Hcase];
    apply andb_true_iff in Hcase; destruct Hcase as [Hlink Heq];
    eapply Hconclude; [|exact Heq| |exact Heq| |exact Heq| |exact Heq].
  - eapply Htrans; [eapply Hsame; [exact Hlink|exact Hxx]|exact Hyy].
  - eapply Htrans; [eapply Hsame; [exact Hlink|exact Hxx]|now apply Hsym].
  - eapply Htrans; [eapply Hsame; [exact Hlink|now apply Hsym]|exact Hyy].
  - eapply Htrans; [eapply Hsame; [exact Hlink|now apply Hsym]|now apply Hsym].
Qed.

Lemma con_seg_transitive_sound : forall facts i j conclusion,
  Forall Interp facts -> con_seg_transitive facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  eapply transitive_rule_sound; [| | | |exact Hfacts|exact Hrule].
  - intros w x y Hsame Hcong. apply segment_u_eqb_cases in Hsame.
    destruct Hsame as [Heq|Heq]; subst x; [exact Hcong|].
    unfold reverse_segment in Hcong. cbn in Hcong |- *. Cong.
  - intros x y Hcong. cbn in Hcong |- *. Cong.
  - intros x y z Hxy Hyz. cbn in Hxy, Hyz |- *. eapply cong_transitivity; eauto.
  - intros s x y Hpair Hs. destruct s; cbn in Hpair; try discriminate;
      injection Hpair as <- <-; exact Hs.
Qed.

Lemma con_ang_transitive_sound : forall facts i j conclusion,
  Forall Interp facts -> con_ang_transitive facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  eapply transitive_rule_sound; [| | | |exact Hfacts|exact Hrule].
  - intros w x y Hsame Hcong. apply angle_u_eqb_cases in Hsame.
    destruct Hsame as [Heq|Heq]; subst x; [exact Hcong|].
    unfold reverse_angle in Hcong. cbn in Hcong |- *. CongA.
  - intros x y Hcong. cbn in Hcong |- *. now apply conga_sym.
  - intros x y z Hxy Hyz. cbn in Hxy, Hyz |- *. eapply conga_trans; eauto.
  - intros s x y Hpair Hs. destruct s; cbn in Hpair; try discriminate;
      injection Hpair as <- <-; exact Hs.
Qed.

Lemma con_tri_transitive_sound : forall facts i j conclusion,
  Forall Interp facts -> con_tri_transitive facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  eapply transitive_rule_sound; [| | | |exact Hfacts|exact Hrule].
  - intros w x y Hsame Hcong. apply triangle_eqb_eq in Hsame. now subst.
  - intros x y Hcong. cbn in Hcong |- *. now apply triangle_congruent_sym.
  - intros x y z Hxy Hyz. cbn in Hxy, Hyz |- *.
    eapply triangle_congruent_trans; eauto.
  - intros s x y Hpair Hs. destruct s; cbn in Hpair; try discriminate;
      injection Hpair as <- <-; exact Hs.
Qed.

Lemma def_con_right_sound : forall facts i j conclusion,
  Forall Interp facts -> def_con_right facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule. unfold def_con_right in Hrule.
  destruct (lookup_step facts i) as [first|] eqn:Hfirst; try discriminate.
  destruct first; try discriminate.
  destruct (lookup_step facts j) as [second|] eqn:Hsecond; try discriminate.
  destruct second; try discriminate.
  assert (Ha : Interp (RightAng a)) by (eapply lookup_step_sound; eauto).
  assert (Hb : Interp (RightAng a0)) by (eapply lookup_step_sound; eauto).
  cbn in Ha, Hb.
  assert (Hmove : forall x y, angle_u_eqb x y = true -> Interp (RightAng x) ->
            angle_well_formed point y /\ right_angle point y).
  { intros x y Hxy [Hwf Hper]. split.
    - now apply (angle_u_eqb_well_formed _ _ Hxy).
    - now apply (angle_u_eqb_right _ _ Hxy). }
  unfold def_con_right_conclusion in Hrule.
  destruct conclusion; try discriminate;
    apply orb_true_iff in Hrule;
    destruct Hrule as [Hmatch|Hmatch]; apply andb_true_iff in Hmatch;
    destruct Hmatch as [H1 H2];
    [ pose proof (Hmove _ _ H1 Ha) as Hc; pose proof (Hmove _ _ H2 Hb) as Hd
    | pose proof (Hmove _ _ H2 Hb) as Hc; pose proof (Hmove _ _ H1 Ha) as Hd
    | pose proof (Hmove _ _ H1 Ha) as Hc; pose proof (Hmove _ _ H2 Hb) as Hd
    | pose proof (Hmove _ _ H2 Hb) as Hc; pose proof (Hmove _ _ H1 Ha) as Hd ];
    destruct Hc as [[Hcl Hcr] Hcp], Hd as [[Hdl Hdr] Hdp];
    unfold right_angle in Hcp, Hdp; cbn;
    solve [ tauto | now apply l11_16 ].
Qed.

Lemma endpoint_of_col : forall c s,
  endpoint_of c s = true ->
  Col (point c) (point s.(seg_start)) (point s.(seg_end)).
Proof.
  intros c s H. unfold endpoint_of, ascii_eqb in H.
  apply orb_true_iff in H. destruct H as [H|H]; apply Ascii.eqb_eq in H; subst;
    [apply col_trivial_1|apply col_trivial_3].
Qed.

Lemma perp_right_angle_sound : forall s t p a,
  Interp (PerpAt s t p) -> perp_right_angle s t p a = true ->
  right_angle point a.
Proof.
  intros s t p a Hperp H. cbn in Hperp.
  unfold perp_right_angle, ascii_eqb in H.
  apply andb_true_iff in H. destruct H as [Hvertex H].
  apply Ascii.eqb_eq in Hvertex.
  destruct Hperp as [_ [_ [_ [_ Hall]]]].
  unfold right_angle. rewrite Hvertex.
  apply orb_true_iff in H. destruct H as [H|H];
    apply andb_true_iff in H; destruct H as [Hleft Hright];
    apply endpoint_of_col in Hleft; apply endpoint_of_col in Hright.
  - now apply Hall.
  - apply l8_2. now apply Hall.
Qed.

Lemma perp_con_ang_sound : forall decls facts i conclusion,
  declarations_well_formed point decls -> Forall Interp facts ->
  perp_con_ang decls facts i conclusion = true -> Interp conclusion.
Proof.
  intros decls facts i conclusion Hwf Hfacts Hrule.
  unfold perp_con_ang in Hrule.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  assert (Hperp : Interp (PerpAt s s0 p)) by (eapply lookup_step_sound; eauto).
  destruct conclusion; try discriminate.
  - (* con_ang: the declared triangles supply the nondegenerate rays *)
    apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hdb].
    apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hda].
    apply andb_true_iff in Hrule. destruct Hrule as [Hpa Hpb].
    apply (declared_angle_sound decls _ Hwf) in Hda.
    apply (declared_angle_sound decls _ Hwf) in Hdb.
    destruct Hda as [Hal Har]. destruct Hdb as [Hbl Hbr].
    assert (Hra : right_angle point a) by (eapply perp_right_angle_sound; eauto).
    assert (Hrb : right_angle point a0) by (eapply perp_right_angle_sound; eauto).
    unfold right_angle in Hra, Hrb. cbn. now apply l11_16.
  - apply andb_true_iff in Hrule. destruct Hrule as [Hleft Hright].
    split; eapply perp_right_angle_sound; eauto.
Qed.

Lemma def_midpt_sound : forall facts i conclusion,
  Forall Interp facts -> def_midpt facts i conclusion = true -> Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule. unfold def_midpt in Hrule.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  assert (Hmid : Interp (MidptOf s p)) by (eapply lookup_step_sound; eauto).
  apply (fact_eqb_sound _ _ Hrule). cbn in Hmid |- *. apply Hmid.
Qed.

Lemma vertical_angle_pair_sound : forall decls s t p conclusion,
  declarations_well_formed point decls ->
  Interp (IntersectSeg s t p) ->
  vertical_angle_pair decls s t p conclusion = true -> Interp conclusion.
Proof.
  intros decls s t p conclusion Hwf Hcross Hpair.
  cbn in Hcross. destruct Hcross as [Hs Ht].
  unfold vertical_angle_pair in Hpair. apply orb_true_iff in Hpair.
  destruct Hpair as [Hcase|Hcase]; apply andb_true_iff in Hcase;
    destruct Hcase as [Hdeclared Heq]; apply andb_true_iff in Hdeclared;
    destruct Hdeclared as [Hfirst Hsecond];
    apply (declared_angle_sound decls _ Hwf) in Hfirst;
    apply (declared_angle_sound decls _ Hwf) in Hsecond;
    destruct Hfirst as [Hf1 Hf2]; destruct Hsecond as [Hs1 Hs2];
    cbn in Hf1, Hf2, Hs1, Hs2;
    apply (fact_eqb_sound _ _ Heq); cbn.
  - now apply l11_14.
  - apply l11_14; auto. now apply between_symmetry.
Qed.

Lemma vert_ang_sound : forall decls premises label conclusion,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  vert_ang decls premises label conclusion = true -> Interp conclusion.
Proof.
  intros decls premises label conclusion Hwf Hprem Hrule.
  unfold vert_ang in Hrule. apply existsb_exists in Hrule.
  destruct Hrule as [pr [Hin Hmatch]].
  apply andb_true_iff in Hmatch. destruct Hmatch as [_ Hmatch].
  pose proof ((proj1 (@Forall_forall Premise (interp_premise point) premises))
                Hprem pr Hin) as Hpr.
  unfold interp_premise in Hpr.
  destruct (premise_statement pr); try discriminate.
  eapply vertical_angle_pair_sound; eauto.
Qed.

Lemma def_ang_bisect_sound : forall facts i conclusion,
  Forall Interp facts -> def_ang_bisect facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule. unfold def_ang_bisect in Hrule.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  assert (Hbisect : Interp (AngBisectOf a s)) by (eapply lookup_step_sound; eauto).
  cbn in Hbisect.
  apply orb_true_iff in Hrule; destruct Hrule as [Hcase|Hcase];
    apply andb_true_iff in Hcase; destruct Hcase as [Hvertex Heq];
    unfold ascii_eqb in Hvertex; apply Ascii.eqb_eq in Hvertex;
    apply (fact_eqb_sound _ _ Heq); cbn;
    destruct Hbisect as [[Hstart Hc]|[Hend Hc]].
  (* the named endpoint is the vertex, so the other disjunct can only hold when
     both endpoints name it and the two halves therefore coincide *)
  - exact Hc.
  - assert (Hsame : s.(seg_end) = s.(seg_start)) by congruence.
    rewrite Hsame. exact Hc.
  - assert (Hsame : s.(seg_start) = s.(seg_end)) by congruence.
    rewrite Hsame. exact Hc.
  - exact Hc.
Qed.

Lemma on_line_u_sound : forall s t p q,
  segment_u_eqb s t = true -> ascii_eqb p q = true ->
  Interp (OnLine t q) -> Interp (OnLine s p).
Proof.
  intros s t p q Hs Hp Hon. unfold ascii_eqb in Hp. apply Ascii.eqb_eq in Hp.
  subst q. apply segment_u_eqb_cases in Hs.
  destruct Hs as [Heq|Heq]; subst s; [exact Hon|].
  unfold reverse_segment in *. cbn in Hon |- *.
  destruct Hon as [Hne Hcol]. split; [congruence|Col].
Qed.

Lemma midpt_conv_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  midpt_conv premises facts i conclusion = true -> Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hfacts Hrule.
  unfold midpt_conv in Hrule. destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hhalves Hon].
  assert (Hdep : Interp dependency) by (eapply lookup_step_sound; eauto).
  apply (fact_eqb_sound _ _ Hhalves) in Hdep. cbn in Hdep.
  apply existsb_exists in Hon. destruct Hon as [pr [Hin Hmatch]].
  pose proof ((proj1 (@Forall_forall Premise (interp_premise point) premises))
                Hprem pr Hin) as Hpr.
  unfold interp_premise in Hpr.
  destruct (on_line_witness (premise_statement pr)) as [[t q]|] eqn:Hwitness;
    try discriminate.
  assert (Hpremise : premise_statement pr = OnLine t q).
  { unfold on_line_witness in Hwitness.
    destruct (premise_statement pr); try discriminate.
    now injection Hwitness as <- <-. }
  rewrite Hpremise in Hpr.
  apply andb_true_iff in Hmatch. destruct Hmatch as [Hseg Hpoint].
  pose proof (on_line_u_sound s t p q Hseg Hpoint Hpr) as Hline.
  cbn in Hline. destruct Hline as [Hne Hcol]. cbn.
  assert (Hbetween : Col (point s.(seg_start)) (point p) (point s.(seg_end))) by Col.
  assert (Hequal : Cong (point p) (point s.(seg_start))
                        (point p) (point s.(seg_end))) by Cong.
  destruct (l7_20 (point p) (point s.(seg_start)) (point s.(seg_end))
                  Hbetween Hequal) as [Hsame|Hmid]; [contradiction|exact Hmid].
Qed.

Lemma correspondences_congruent : forall t u c,
  In c (correspondences t u) ->
  interp_triangle_congruence point (fst c) (snd c) ->
  interp_triangle_congruence point t u.
Proof.
  intros [A B C] [D E F] c Hin Hcong. unfold correspondences in Hin. cbn in Hin.
  repeat (destruct Hin as [<-|Hin];
    [cbn in Hcong |- *;
     solve [ exact Hcong
           | now apply triangle_congruent_rotate_back
           | now apply triangle_congruent_rotate_back,
                       triangle_congruent_rotate_back
           | now apply triangle_congruent_reverse
           | apply triangle_congruent_reverse;
             now apply triangle_congruent_rotate_back
           | apply triangle_congruent_reverse;
             now apply triangle_congruent_rotate_back,
                       triangle_congruent_rotate_back ]|]).
  contradiction.
Qed.

Lemma schema6_sound : forall decls facts i1 i2 i3 i4 i5 i6 a b c d e f,
  declarations_well_formed point decls -> Forall Interp facts ->
  schema6 decls facts i1 i2 i3 i4 i5 i6 a b c d e f = true ->
  Interp a /\ Interp b /\ Interp c /\ Interp d /\ Interp e /\ Interp f.
Proof.
  intros decls facts i1 i2 i3 i4 i5 i6 a b c d e f Hwf Hall H.
  unfold schema6 in H. apply andb_true_iff in H. destruct H as [H1 H2].
  apply (schema3_sound _ _ _ _ _ _ _ _ Hwf Hall) in H1.
  apply (schema3_sound _ _ _ _ _ _ _ _ Hwf Hall) in H2. tauto.
Qed.

Lemma def_con_tri_sound : forall decls facts i1 i2 i3 i4 i5 i6 conclusion,
  declarations_well_formed point decls -> Forall Interp facts ->
  def_con_tri decls facts i1 i2 i3 i4 i5 i6 conclusion = true ->
  Interp conclusion.
Proof.
  intros decls facts i1 i2 i3 i4 i5 i6 conclusion Hwf Hall Hrule.
  unfold def_con_tri in Hrule. destruct conclusion; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [_ Hrule].
  apply existsb_exists in Hrule. destruct Hrule as [c [Hin Hmatch]].
  change (Interp (ConTri t t0)). apply (correspondences_congruent t t0 c Hin).
  unfold def_con_tri_at in Hmatch.
  apply (schema6_sound _ _ _ _ _ _ _ _ _ _ _ _ _ _ Hwf Hall) in Hmatch.
  destruct (fst c) as [A B C]; destruct (snd c) as [D E F].
  cbn in Hmatch |- *. unfold interp_triangle_congruence, triangle_congruence.
  cbn. tauto.
Qed.

Lemma def_isosceles_sound : forall decls facts i conclusion,
  declarations_well_formed point decls -> Forall Interp facts ->
  def_isosceles decls facts i conclusion = true -> Interp conclusion.
Proof.
  intros decls facts i conclusion Hwf Hall Hrule.
  unfold def_isosceles in Hrule. destruct conclusion; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hdeclared Hrule].
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  assert (Hdep : Interp dependency) by (eapply lookup_step_sound; eauto).
  apply (triangle_declared_sound decls _ Hwf) in Hdeclared.
  apply triangle_well_formed_nondegenerate in Hdeclared.
  apply existsb_exists in Hrule. destruct Hrule as [expected [Hin Heq]].
  apply (fact_eqb_sound _ _ Heq) in Hdep.
  unfold isosceles_pairs in Hin. cbn in Hin. cbn.
  split; [exact Hdeclared|].
  destruct Hin as [<-|[<-|[<-|[]]]]; cbn in Hdep; tauto.
Qed.

Lemma apex_readings_well_formed : forall decls t r,
  declarations_well_formed point decls ->
  triangle_declared decls t = true -> In r (apex_readings t) ->
  triangle_well_formed point t.
Proof. intros decls t r Hwf Hd _. eapply triangle_declared_sound; eauto. Qed.

Lemma base_angle_sound : forall decls facts i conclusion,
  declarations_well_formed point decls -> Forall Interp facts ->
  base_angle decls facts i conclusion = true -> Interp conclusion.
Proof.
  intros decls facts i conclusion Hwf Hall Hrule.
  unfold base_angle in Hrule.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  assert (Hdep : Interp dependency) by (eapply lookup_step_sound; eauto).
  apply existsb_exists in Hrule. destruct Hrule as [t [_ Hmatch]].
  apply andb_true_iff in Hmatch. destruct Hmatch as [Hmatch Hconclusion].
  apply andb_true_iff in Hmatch. destruct Hmatch as [Hdeclared Hsides].
  apply (triangle_declared_sound decls _ Hwf) in Hdeclared.
  apply (fact_eqb_sound _ _ Hsides) in Hdep.
  apply (fact_eqb_sound _ _ Hconclusion).
  destruct t as [A B C]. cbn in Hdep, Hdeclared |- *.
  now apply ender_base_angle.
Qed.

Lemma base_angle_conv_sound : forall decls facts i conclusion,
  declarations_well_formed point decls -> Forall Interp facts ->
  base_angle_conv decls facts i conclusion = true -> Interp conclusion.
Proof.
  intros decls facts i conclusion Hwf Hall Hrule.
  unfold base_angle_conv in Hrule.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  assert (Hdep : Interp dependency) by (eapply lookup_step_sound; eauto).
  apply existsb_exists in Hrule. destruct Hrule as [t [_ Hmatch]].
  apply andb_true_iff in Hmatch. destruct Hmatch as [Hmatch Hconclusion].
  apply andb_true_iff in Hmatch. destruct Hmatch as [Hdeclared Hangles].
  apply (triangle_declared_sound decls _ Hwf) in Hdeclared.
  apply (fact_eqb_sound _ _ Hangles) in Hdep.
  apply (fact_eqb_sound _ _ Hconclusion).
  destruct t as [A B C]. cbn in Hdep, Hdeclared |- *.
  now apply ender_base_angle_conv.
Qed.

Lemma def_equilateral_sound : forall decls facts i j k conclusion,
  declarations_well_formed point decls -> Forall Interp facts ->
  def_equilateral decls facts i j k conclusion = true -> Interp conclusion.
Proof.
  intros decls facts i j k conclusion Hwf Hall Hrule.
  unfold def_equilateral in Hrule. destruct conclusion; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hdeclared Hschema].
  apply (triangle_declared_sound decls _ Hwf) in Hdeclared.
  apply triangle_well_formed_nondegenerate in Hdeclared.
  apply (schema3_sound _ _ _ _ _ _ _ _ Hwf Hall) in Hschema.
  destruct t as [A B C]. cbn in Hschema, Hdeclared |- *. tauto.
Qed.

Lemma def_equiangular_sound : forall decls facts i j k conclusion,
  declarations_well_formed point decls -> Forall Interp facts ->
  def_equiangular decls facts i j k conclusion = true -> Interp conclusion.
Proof.
  intros decls facts i j k conclusion Hwf Hall Hrule.
  unfold def_equiangular in Hrule. destruct conclusion; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hdeclared Hschema].
  apply (triangle_declared_sound decls _ Hwf) in Hdeclared.
  apply triangle_well_formed_nondegenerate in Hdeclared.
  apply (schema3_sound _ _ _ _ _ _ _ _ Hwf Hall) in Hschema.
  destruct t as [A B C]. cbn in Hschema, Hdeclared |- *.
  destruct Hschema as [Hab [Hbc _]]. split; [exact Hdeclared|].
  split; CongA.
Qed.

Lemma equilat_equiang_sound : forall facts i conclusion,
  Forall Interp facts -> equilat_equiang facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hall Hrule. unfold equilat_equiang in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  apply triangle_eqb_eq in Hrule. subst t.
  assert (Hdep : Interp (EquilateralTri t0)) by (eapply lookup_step_sound; eauto).
  destruct t0 as [A B C]. cbn in Hdep |- *.
  destruct Hdep as [Hnd [Hab Hbc]]. split; [exact Hnd|].
  apply ender_equilateral_equiangular; [apply Hnd|exact Hab|exact Hbc].
Qed.

Lemma equiang_equilat_sound : forall facts i conclusion,
  Forall Interp facts -> equiang_equilat facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hall Hrule. unfold equiang_equilat in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  apply triangle_eqb_eq in Hrule. subst t.
  assert (Hdep : Interp (EquiangularTri t0)) by (eapply lookup_step_sound; eauto).
  destruct t0 as [A B C]. cbn in Hdep |- *.
  destruct Hdep as [Hnd [HangA HangB]]. split; [exact Hnd|].
  apply ender_equiangular_equilateral; [apply Hnd|exact HangA|exact HangB].
Qed.

Lemma supplement_realign : forall c b d,
  angle_u_eqb d b = true ->
  Interp (Supplementary c d) -> Interp (Supplementary c b).
Proof.
  intros c b d H Hs. apply angle_u_eqb_cases in H.
  destruct H as [Heq|Heq]; subst d; [exact Hs|].
  unfold reverse_angle in Hs. cbn in Hs |- *. now apply suppa_right_comm.
Qed.

Lemma con_supplements_same_sound : forall facts i j conclusion,
  Forall Interp facts -> con_supplements_same facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hall Hrule. unfold con_supplements_same in Hrule.
  destruct (lookup_step facts i) as [first|] eqn:Hfirst; try discriminate.
  destruct first; try discriminate.
  destruct (lookup_step facts j) as [second|] eqn:Hsecond; try discriminate.
  destruct second; try discriminate.
  assert (Hs1 : Interp (Supplementary a a0)) by (eapply lookup_step_sound; eauto).
  assert (Hs2 : Interp (Supplementary a1 a2)) by (eapply lookup_step_sound; eauto).
  (* [SuppA] is symmetric, so the shared angle may occupy either slot of
     either dependency; realign it into the second slot of both. *)
  assert (Hcancel : forall x y z : Angle,
      Interp (Supplementary x y) -> Interp (Supplementary z y) ->
      Interp (ConAng x z)).
  { intros x y z Hx Hz. cbn in Hx, Hz |- *.
    now apply (suppa2__conga123 _ _ _ (point (ang_left y)) (point (ang_vertex y))
                                (point (ang_right y))). }
  repeat rewrite orb_true_iff in Hrule.
  destruct Hrule as [[[Hcase|Hcase]|Hcase]|Hcase];
    apply andb_true_iff in Hcase; destruct Hcase as [Hshared Hconclusion];
    apply (fact_eqb_sound _ _ Hconclusion).
  (* the shared angle is the second of the first dependency ... *)
  - apply Hcancel with (y := a0);
      [exact Hs1|now apply (supplement_realign a1 a0 a2)].
  - apply Hcancel with (y := a0); [exact Hs1|].
    apply (supplement_realign a2 a0 a1); [exact Hshared|now apply suppa_sym].
  (* ... or its first *)
  - apply Hcancel with (y := a);
      [now apply suppa_sym|now apply (supplement_realign a1 a a2)].
  - apply Hcancel with (y := a); [now apply suppa_sym|].
    apply (supplement_realign a2 a a1); [exact Hshared|now apply suppa_sym].
Qed.

Lemma supplements_transfer : forall x y z w,
  Interp (Supplementary x y) -> Interp (Supplementary z w) ->
  Interp (ConAng y w) -> Interp (ConAng x z).
Proof.
  intros x y z w Hx Hz Hyw. cbn in Hx, Hz, Hyw |- *.
  pose proof (suppa_distincts _ _ _ _ _ _ Hz) as Hd. spliter.
  assert (Hzy : SuppA (point (ang_left z)) (point (ang_vertex z))
                      (point (ang_right z))
                      (point (ang_left y)) (point (ang_vertex y))
                      (point (ang_right y))).
  { apply (conga2_suppa__suppa (point (ang_left z)) (point (ang_vertex z))
             (point (ang_right z)) (point (ang_left w)) (point (ang_vertex w))
             (point (ang_right w)));
      [apply conga_refl; auto|now apply conga_sym|exact Hz]. }
  now apply (suppa2__conga123 _ _ _ (point (ang_left y)) (point (ang_vertex y))
                              (point (ang_right y))).
Qed.

Lemma con_supplements_sound : forall facts i j k conclusion,
  Forall Interp facts -> con_supplements facts i j k conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j k conclusion Hall Hrule. unfold con_supplements in Hrule.
  destruct (lookup_step facts i) as [first|] eqn:Hfirst; try discriminate.
  destruct first; try discriminate.
  destruct (lookup_step facts j) as [second|] eqn:Hsecond; try discriminate.
  destruct second; try discriminate.
  destruct (lookup_step facts k) as [witness|] eqn:Hwitness; try discriminate.
  assert (Hs1 : Interp (Supplementary a a0)) by (eapply lookup_step_sound; eauto).
  assert (Hs2 : Interp (Supplementary a1 a2)) by (eapply lookup_step_sound; eauto).
  assert (Hw : Interp witness) by (eapply lookup_step_sound; eauto).
  (* the witness may relate either angle of one dependency to either of the
     other; the conclusion is then the remaining pair *)
  repeat rewrite orb_true_iff in Hrule.
  destruct Hrule as [[[Hcase|Hcase]|Hcase]|Hcase];
    apply andb_true_iff in Hcase; destruct Hcase as [Hcongruent Hconclusion];
    apply (fact_eqb_sound _ _ Hcongruent) in Hw;
    apply (fact_eqb_sound _ _ Hconclusion).
  - now apply (supplements_transfer a a0 a1 a2).
  - apply (supplements_transfer a a0 a2 a1); [exact Hs1|now apply suppa_sym|exact Hw].
  - apply (supplements_transfer a0 a a1 a2); [now apply suppa_sym|exact Hs2|exact Hw].
  - apply (supplements_transfer a0 a a2 a1);
      [now apply suppa_sym|now apply suppa_sym|exact Hw].
Qed.

Lemma endpoints_determine : forall u p y, p <> y ->
  endpoint_of p u = true -> endpoint_of y u = true ->
  segment_u_eqb (segment p y) u = true.
Proof.
  intros [c1 c2] p y Hne Hp Hy.
  unfold endpoint_of, segment_u_eqb, segment_eqb, reverse_segment,
         ascii_eqb in *. cbn in *.
  destruct (Ascii.eqb p c1) eqn:Hp1, (Ascii.eqb p c2) eqn:Hp2,
           (Ascii.eqb y c1) eqn:Hy1, (Ascii.eqb y c2) eqn:Hy2;
    cbn in *; try discriminate; try reflexivity;
    exfalso; apply Hne;
    repeat match goal with
    | H : Ascii.eqb _ _ = true |- _ => apply Ascii.eqb_eq in H
    end; congruence.
Qed.

Lemma other_endpoint_spec : forall x s, endpoint_of x s = true ->
  segment_u_eqb (segment x (other_endpoint x s)) s = true.
Proof.
  intros x [c1 c2] Hx.
  unfold endpoint_of, other_endpoint, segment_u_eqb, segment_eqb,
         reverse_segment, ascii_eqb in *. cbn in *.
  destruct (Ascii.eqb x c1) eqn:H1; cbn in *.
  - now rewrite Ascii.eqb_refl.
  - rewrite Hx. cbn. now rewrite Ascii.eqb_refl.
Qed.

Lemma def_perp_core : forall u s p x y,
  point x <> point p -> point y <> point p ->
  Per (point x) (point p) (point y) ->
  endpoint_of p u = true -> endpoint_of y u = true ->
  endpoint_of x s = true -> Interp (OnLine s p) -> Interp (PerpAt u s p).
Proof.
  intros u s p x y Hx Hy Hper Hpu Hyu Hxs Hline.
  cbn in Hline. destruct Hline as [Hne Hcol].
  assert (Hbase : Perp_at (point p) (point p) (point y) (point x) (point p))
    by (apply perp_in_sym, per_perp_in; auto).
  assert (Hspec : point x <> point (other_endpoint x s) /\
                  Col (point x) (point p) (point (other_endpoint x s))).
  { unfold other_endpoint, endpoint_of, ascii_eqb in *.
    destruct (Ascii.eqb x (seg_start s)) eqn:Hstart.
    - apply Ascii.eqb_eq in Hstart. rewrite Hstart. split; [exact Hne|Col].
    - apply orb_true_iff in Hxs. destruct Hxs as [Hbad|Hend]; [congruence|].
      apply Ascii.eqb_eq in Hend. rewrite Hend. split; [congruence|Col]. }
  destruct Hspec as [Hdistinct Hcollinear].
  assert (Hext : Interp (PerpAt (segment p y) (segment x (other_endpoint x s)) p)).
  { cbn. eapply perp_in_col_perp_in; [exact Hdistinct|exact Hcollinear|exact Hbase]. }
  apply (perp_at_realign (segment p y) (segment x (other_endpoint x s)) u s p p);
    [ apply endpoints_determine; [intro Heq; apply Hy; now rewrite Heq| |]; auto
    | now apply other_endpoint_spec
    | unfold ascii_eqb; apply Ascii.eqb_refl
    | exact Hext ].
Qed.

Lemma def_perp_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  def_perp premises facts i conclusion = true -> Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hfacts Hrule.
  unfold def_perp in Hrule. destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hshape Hon].
  assert (Hright : Interp (RightAng a)) by (eapply lookup_step_sound; eauto).
  cbn in Hright. destruct Hright as [[Hleft Hright] Hper].
  unfold right_angle in Hper.
  (* the [on_line] premise, realigned onto the conclusion's own segment *)
  apply existsb_exists in Hon. destruct Hon as [pr [Hin Hmatch]].
  pose proof ((proj1 (@Forall_forall Premise (interp_premise point) premises))
                Hprem pr Hin) as Hpr.
  unfold interp_premise in Hpr.
  destruct (on_line_witness (premise_statement pr)) as [[t q]|] eqn:Hwitness;
    try discriminate.
  assert (Hpremise : premise_statement pr = OnLine t q).
  { unfold on_line_witness in Hwitness.
    destruct (premise_statement pr); try discriminate.
    now injection Hwitness as <- <-. }
  rewrite Hpremise in Hpr.
  apply andb_true_iff in Hmatch. destruct Hmatch as [Hseg Hpoint].
  pose proof (on_line_u_sound s0 t p q Hseg Hpoint Hpr) as Hline.
  (* either ray may be the one lying along the perpendicular *)
  apply andb_true_iff in Hshape. destruct Hshape as [Hvertex Hshape].
  unfold ascii_eqb in Hvertex. apply Ascii.eqb_eq in Hvertex. subst p.
  apply orb_true_iff in Hshape. unfold def_perp_shape in Hshape.
  destruct Hshape as [Hcase|Hcase];
    apply andb_true_iff in Hcase; destruct Hcase as [Hcase Hyu];
    apply andb_true_iff in Hcase; destruct Hcase as [Hpu Hxs].
  - eapply (def_perp_core _ _ _ (ang_left a) (ang_right a)); eassumption.
  - eapply (def_perp_core _ _ _ (ang_right a) (ang_left a)); try eassumption.
    now apply l8_2.
Qed.

(** Everything above holds in neutral geometry.  [third_angle] is the first
    rule that genuinely needs the parallel postulate, so the assumption enters
    here rather than at the top of the section; every lemma stated before this
    point is free of it. *)
Context {TE : @Tarski_euclidean Tn TnEQD}.

Lemma schema2_sound : forall decls facts i j a b,
  declarations_well_formed point decls ->
  Forall Interp facts -> schema2 decls facts i j a b = true ->
  Interp a /\ Interp b.
Proof.
  intros decls facts i j a b Hwf Hall H. unfold schema2 in H.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate.
  apply andb_true_iff in H. destruct H as [Ha Hb].
  pose proof (lookup_step_sound facts i x Hall Hx) as HIx.
  pose proof (lookup_step_sound facts j y Hall Hy) as HIy.
  split; eapply dependency_matches_sound; eauto.
Qed.

Lemma correspondences_well_formed : forall t u c,
  In c (correspondences t u) ->
  triangle_well_formed point t -> triangle_well_formed point u ->
  triangle_well_formed point (fst c) /\ triangle_well_formed point (snd c).
Proof.
  intros t u c Hin Ht Hu. unfold correspondences in Hin. cbn in Hin.
  repeat (destruct Hin as [<-|Hin]; [cbn; split;
    solve [ assumption
          | now apply rotated_well_formed
          | now apply reversed_well_formed
          | now apply rotated_well_formed, reversed_well_formed
          | now apply rotated_well_formed, rotated_well_formed
          | now apply rotated_well_formed, rotated_well_formed,
                      reversed_well_formed ]|]).
  contradiction.
Qed.

Lemma third_angle_sound : forall decls facts i j conclusion,
  declarations_well_formed point decls ->
  Forall Interp facts -> third_angle decls facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros decls facts i j conclusion Hwf Hall Hrule.
  unfold third_angle in Hrule.
  apply existsb_exists in Hrule. destruct Hrule as [t [Hint Hrule]].
  apply existsb_exists in Hrule. destruct Hrule as [u [Hinu Hrule]].
  apply existsb_exists in Hrule. destruct Hrule as [c [Hinc Hmatch]].
  assert (Hwft : forall x, In x decls.(decl_triangles) ->
                 triangle_well_formed point x) by apply Hwf.
  pose proof (correspondences_well_formed t u c Hinc (Hwft t Hint) (Hwft u Hinu))
    as [Hwt Hwu].
  apply andb_true_iff in Hmatch. destruct Hmatch as [Hdeps Hconclusion].
  apply (schema2_sound _ _ _ _ _ _ Hwf Hall) in Hdeps.
  destruct Hdeps as [HatA HatB].
  apply (fact_eqb_sound _ _ Hconclusion).
  destruct c as [[A B C] [D E F]]. cbn in HatA, HatB, Hwt, Hwu |- *.
  now apply ender_third_angle.
Qed.

Lemma rule_valid_sound : forall decls premises facts reason conclusion,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  rule_valid decls premises facts reason conclusion = true ->
  Interp conclusion.
Proof.
  intros decls premises facts reason conclusion Hwf Hprem Hfacts Hvalid.
  destruct reason; cbn in Hvalid.
  - destruct (find_premise s premises) eqn:Hfind; try discriminate.
    apply statement_eqb_eq in Hvalid. subst conclusion.
    apply find_premise_sound in Hfind. destruct Hfind as [p [Hin Hp]].
    pose proof ((proj1 (@Forall_forall Premise (interp_premise point) premises))
                  Hprem p Hin) as Hip.
    unfold interp_premise in Hip. now rewrite Hp in Hip.
  - destruct conclusion; try discriminate.
    + apply segment_u_eqb_cases in Hvalid. destruct Hvalid as [Hvalid|Hvalid].
      * subst. cbn. apply cong_reflexivity.
      * subst. unfold reverse_segment. cbn. apply cong_pseudo_reflexivity.
    + (* the declaration is what makes the two rays nondegenerate *)
      apply andb_true_iff in Hvalid. destruct Hvalid as [Hsame Hdeclared].
      apply (declared_angle_sound _ _ Hwf) in Hdeclared.
      apply angle_u_eqb_cases in Hsame.
      destruct Hsame as [Heq|Heq]; subst a;
        [destruct Hdeclared as [Hl Hr]; cbn; now apply conga_refl|].
      unfold reverse_angle in Hdeclared |- *. cbn in Hdeclared |- *.
      destruct Hdeclared as [Hl Hr]. now apply conga_pseudo_refl.
  - destruct conclusion; try discriminate.
    apply andb_true_iff in Hvalid. destruct Hvalid as [Hdecl Hschema].
    apply declared_pair_sound in Hdecl; [|exact Hwf]. destruct Hdecl as [Ht Hu].
    eapply six_correspondences_sound;
      [exact Hwf|exact Hfacts|exact Ht|exact sas_schema_sound|exact Hschema].
  - destruct conclusion; try discriminate.
    apply andb_true_iff in Hvalid. destruct Hvalid as [Hdecl Hschema].
    apply declared_pair_sound in Hdecl; [|exact Hwf]. destruct Hdecl as [Ht Hu].
    eapply six_correspondences_sound;
      [exact Hwf|exact Hfacts|exact Ht|exact sss_schema_sound|exact Hschema].
  - destruct conclusion; try discriminate.
    apply andb_true_iff in Hvalid. destruct Hvalid as [Hdecl Hschema].
    apply declared_pair_sound in Hdecl; [|exact Hwf]. destruct Hdecl as [Ht Hu].
    eapply six_correspondences_sound;
      [exact Hwf|exact Hfacts|exact Ht|exact asa_schema_sound|exact Hschema].
  - destruct conclusion; try discriminate.
    apply andb_true_iff in Hvalid. destruct Hvalid as [Hdecl Hschema].
    apply declared_pair_sound in Hdecl; [|exact Hwf]. destruct Hdecl as [Ht Hu].
    eapply six_correspondences_sound;
      [exact Hwf|exact Hfacts|exact Ht|exact aas_schema_sound|exact Hschema].
  - destruct (lookup_step facts n) as [dependency|] eqn:Hlookup; try discriminate.
    destruct dependency; try discriminate.
    change (is_cpctc_fact t t0 conclusion = true) in Hvalid.
    apply (cpctc_sound t t0 conclusion); [|exact Hvalid].
    change (Interp (ConTri t t0)). eapply lookup_step_sound; eauto.
  - eapply con_seg_transitive_sound; eauto.
  - eapply con_ang_transitive_sound; eauto.
  - eapply con_tri_transitive_sound; eauto.
  - eapply def_con_right_sound; eauto.
  - eapply perp_con_ang_sound; eauto.
  - eapply def_midpt_sound; eauto.
  - eapply vert_ang_sound; eauto.
  - eapply def_ang_bisect_sound; eauto.
  - destruct conclusion; try discriminate.
    apply andb_true_iff in Hvalid. destruct Hvalid as [Hdecl Hschema].
    apply declared_pair_sound in Hdecl; [|exact Hwf]. destruct Hdecl as [Ht Hu].
    eapply six_correspondences_sound;
      [exact Hwf|exact Hfacts|exact Ht|exact rhl_schema_sound|exact Hschema].
  - eapply midpt_conv_sound; eauto.
  - eapply third_angle_sound; eauto.
  - eapply def_con_tri_sound; eauto.
  - eapply def_isosceles_sound; eauto.
  - eapply base_angle_sound; eauto.
  - eapply base_angle_conv_sound; eauto.
  - eapply def_equilateral_sound; eauto.
  - eapply def_equiangular_sound; eauto.
  - eapply equilat_equiang_sound; eauto.
  - eapply equiang_equilat_sound; eauto.
  - eapply con_supplements_sound; eauto.
  - eapply con_supplements_same_sound; eauto.
  - eapply def_perp_sound; eauto.
Qed.

Lemma check_steps_sound : forall decls premises steps facts output,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  check_steps decls premises facts steps = Some output ->
  Forall Interp output.
Proof.
  intros decls premises steps. induction steps as [|s rest IH];
    intros facts output Hwf Hprem Hfacts Hcheck; cbn in Hcheck.
  - injection Hcheck as <-. exact Hfacts.
  - destruct (rule_valid decls premises facts (step_reason s)
              (step_conclusion s)) eqn:Hvalid; try discriminate.
    apply (IH (facts ++ [step_conclusion s]) output); auto.
    apply Forall_app. split; auto. constructor; auto.
    eapply rule_valid_sound; eauto.
Qed.

Theorem check_problem_sound : forall p,
  check_problem p = true ->
  declarations_well_formed point p.(problem_declarations) ->
  Forall (interp_premise point) p.(problem_premises) ->
  Interp p.(problem_goal).
Proof.
  intros p Hcheck Hwf Hprem. unfold check_problem in Hcheck.
  destruct (check_steps (problem_declarations p) (problem_premises p) []
            (problem_steps p)) as [facts|] eqn:Hsteps; try discriminate.
  apply existsb_exists in Hcheck. destruct Hcheck as [goal [Hin Heq]].
  apply statement_eqb_eq in Heq. subst goal.
  pose proof (check_steps_sound _ _ _ _ _ Hwf Hprem (Forall_nil _) Hsteps) as Hall.
  eapply Forall_forall; eauto.
Qed.

End Soundness.
