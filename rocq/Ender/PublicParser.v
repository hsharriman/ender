From Coq Require Import Ascii String List Bool.
Require Import Ender.Audit.
Import ListNotations.
Import FinalAudit.
Open Scope string_scope.

Definition PChars := list ascii.

Fixpoint chars_eqb (a b : PChars) : bool :=
  match a, b with
  | [], [] => true
  | x :: xs, y :: ys => Ascii.eqb x y && chars_eqb xs ys
  | _, _ => false
  end.

Lemma chars_eqb_eq : forall a b, chars_eqb a b = true <-> a = b.
Proof.
  induction a as [|x xs IH]; destruct b as [|y ys]; cbn; try easy.
  rewrite andb_true_iff, Ascii.eqb_eq, IH. split.
  - intros [-> ->]. reflexivity.
  - intros H. inversion H. auto.
Qed.

Fixpoint split_arguments_aux (depth : nat) (current : PChars)
    (arguments : list PChars) (text : PChars) : option (list PChars) :=
  match text with
  | [] =>
      match depth with
      | O => Some (rev (rev current :: arguments))
      | _ => None
      end
  | c :: rest =>
      if Ascii.eqb c "("%char then
        split_arguments_aux (S depth) (c :: current) arguments rest
      else if Ascii.eqb c ")"%char then
        match depth with
        | O => None
        | S d => split_arguments_aux d (c :: current) arguments rest
        end
      else if Ascii.eqb c ","%char then
        match depth with
        | O => split_arguments_aux O [] (rev current :: arguments) rest
        | _ => split_arguments_aux depth (c :: current) arguments rest
        end
      else split_arguments_aux depth (c :: current) arguments rest
  end.

Definition split_arguments (text : PChars) : option (list PChars) :=
  match text with [] => Some [] | _ => split_arguments_aux O [] [] text end.

Definition parse_call (text : PChars) : option (PChars * list PChars) :=
  match ProblemPart.take_before ["("%char] text,
        ProblemPart.find_after ["("%char] text with
  | Some name, Some after_open =>
      match rev after_open with
      | ")"%char :: reversed_body =>
          match split_arguments (rev reversed_body) with
          | Some arguments => Some (name, arguments)
          | None => None
          end
      | _ => None
      end
  | _, _ => None
  end.

Definition parse_point (text : PChars) : option PointName :=
  match text with [p] => Some p | _ => None end.
Definition parse_segment (text : PChars) : option SegmentName :=
  match text with [a; b] => Some (segment_name a b) | _ => None end.
Definition parse_angle (text : PChars) : option AngleName :=
  match text with ["a"%char; "_"%char; a; o; b] => Some (angle_name a o b) | _ => None end.
Definition parse_triangle (text : PChars) : option TriangleName :=
  match text with ["t"%char; "_"%char; a; b; c] => Some (triangle_name a b c) | _ => None end.
Definition parse_quadrilateral (text : PChars) : option QuadrilateralName :=
  match text with ["q"%char; "_"%char; a; b; c; d] =>
    Some (quadrilateral_name a b c d) | _ => None end.
Definition parse_circle (text : PChars) : option CircleName :=
  match text with ["c"%char; "_"%char; o; r] => Some (circle_name o r) | _ => None end.

Definition parse_arc (text : PChars) : option ArcName :=
  match parse_call text with
  | Some (name, [c; a; b]) =>
      match parse_circle c, parse_point a, parse_point b with
      | Some circle, Some first, Some last =>
          if chars_eqb name (list_ascii_of_string "minor_arc")
          then Some (arc_name MinorArc circle first last)
          else if chars_eqb name (list_ascii_of_string "major_arc")
               then Some (arc_name MajorArc circle first last) else None
      | _, _, _ => None
      end
  | _ => None
  end.

Definition parse_public_statement_chars_generic (text : PChars) : option PublicStatement :=
  match parse_call text with
  | None => None
  | Some (name, args) =>
    let named (s : string) := chars_eqb name (list_ascii_of_string s) in
    if named "on_line" then match args with [s;p] =>
      match parse_segment s, parse_point p with Some x, Some y => Some (OnLine x y) | _,_ => None end | _ => None end else
    if named "transversal" then match args with [a;b;t1;i1;c;d;t2;i2] =>
      match parse_point a, parse_point b, parse_point t1, parse_point i1,
            parse_point c, parse_point d, parse_point t2, parse_point i2 with
      | Some A,Some B,Some T1,Some I1,Some C,Some D,Some T2,Some I2 =>
          Some (Transversal A B T1 I1 C D T2 I2) | _,_,_,_,_,_,_,_ => None end | _ => None end else
    if named "intersect_seg" then match args with [a;b;p] =>
      match parse_segment a,parse_segment b,parse_point p with Some A,Some B,Some P => Some (IntersectSeg A B P)|_,_,_=>None end|_=>None end else
    if named "trapezoid_premise" then match args with [q;a;b] =>
      match parse_quadrilateral q,parse_segment a,parse_segment b with Some Q,Some A,Some B=>Some(TrapezoidPremise Q A B)|_,_,_=>None end|_=>None end else
    if named "kite_premise" then match args with [q;a;b] =>
      match parse_quadrilateral q,parse_angle a,parse_angle b with Some Q,Some A,Some B=>Some(KitePremise Q A B)|_,_,_=>None end|_=>None end else
    if named "isos_trapezoid_premise" then match args with [q;a;b] =>
      match parse_quadrilateral q,parse_segment a,parse_segment b with Some Q,Some A,Some B=>Some(IsosTrapezoidPremise Q A B)|_,_,_=>None end|_=>None end else
    if named "right" then match args with [a] => match parse_angle a with Some A=>Some(Right A)|_=>None end|_=>None end else
    if named "con_seg" then match args with [a;b] => match parse_segment a,parse_segment b with Some A,Some B=>Some(ConSeg A B)|_,_=>None end|_=>None end else
    if named "con_ang" then match args with [a;b] => match parse_angle a,parse_angle b with Some A,Some B=>Some(ConAng A B)|_,_=>None end|_=>None end else
    if named "con_tri" then match args with [a;b] => match parse_triangle a,parse_triangle b with Some A,Some B=>Some(ConTri A B)|_,_=>None end|_=>None end else
    if named "con_right" then match args with [a;b] => match parse_angle a,parse_angle b with Some A,Some B=>Some(ConRight A B)|_,_=>None end|_=>None end else
    if named "para" then match args with [a;b] => match parse_segment a,parse_segment b with Some A,Some B=>Some(Para A B)|_,_=>None end|_=>None end else
    if named "isosceles" then match args with [t] => match parse_triangle t with Some T=>Some(Isosceles T)|_=>None end|_=>None end else
    if named "perp" then match args with [a;b;p] => match parse_segment a,parse_segment b,parse_point p with Some A,Some B,Some P=>Some(Perp A B P)|_,_,_=>None end|_=>None end else
    if named "midpt" then match args with [s;p] => match parse_segment s,parse_point p with Some ss,Some P=>Some(Midpt ss P)|_,_=>None end|_=>None end else
    if named "ang_bisect" then match args with [a;s] => match parse_angle a,parse_segment s with Some A,Some ss=>Some(AngBisect A ss)|_,_=>None end|_=>None end else
    if named "rectangle" then match args with [q] => match parse_quadrilateral q with Some Q=>Some(Rectangle Q)|_=>None end|_=>None end else
    if named "parallelogram" then match args with [q] => match parse_quadrilateral q with Some Q=>Some(Parallelogram Q)|_=>None end|_=>None end else
    if named "proportion" then match args with [a;b;c;d] => match parse_segment a,parse_segment b,parse_segment c,parse_segment d with Some A,Some B,Some C,Some D=>Some(Proportion A B C D)|_,_,_,_=>None end|_=>None end else
    if named "sim_tri" then match args with [a;b] => match parse_triangle a,parse_triangle b with Some A,Some B=>Some(SimTri A B)|_,_=>None end|_=>None end else
    if named "equilateral" then match args with [t] => match parse_triangle t with Some T=>Some(Equilateral T)|_=>None end|_=>None end else
    if named "supplementary" then match args with [a;b] => match parse_angle a,parse_angle b with Some A,Some B=>Some(Supplementary A B)|_,_=>None end|_=>None end else
    if named "complementary" then match args with [a;b] => match parse_angle a,parse_angle b with Some A,Some B=>Some(Complementary A B)|_,_=>None end|_=>None end else
    if named "linear_pair" then match args with [a;b] => match parse_angle a,parse_angle b with Some A,Some B=>Some(LinearPair A B)|_,_=>None end|_=>None end else
    if named "equiangular" then match args with [t] => match parse_triangle t with Some T=>Some(Equiangular T)|_=>None end|_=>None end else
    if named "circumcenter" then match args with [p;t] => match parse_point p,parse_triangle t with Some P,Some T=>Some(Circumcenter P T)|_,_=>None end|_=>None end else
    if named "incenter" then match args with [p;t] => match parse_point p,parse_triangle t with Some P,Some T=>Some(Incenter P T)|_,_=>None end|_=>None end else
    if named "perp_bisector" then match args with [a;b;p] => match parse_segment a,parse_segment b,parse_point p with Some A,Some B,Some P=>Some(PerpBisector A B P)|_,_,_=>None end|_=>None end else
    if named "seg_bisect" then match args with [a;b;p] => match parse_segment a,parse_segment b,parse_point p with Some A,Some B,Some P=>Some(SegBisect A B P)|_,_,_=>None end|_=>None end else
    if named "isos_trapezoid" then match args with [q] => match parse_quadrilateral q with Some Q=>Some(IsosTrapezoid Q)|_=>None end|_=>None end else
    if named "rhombus" then match args with [q] => match parse_quadrilateral q with Some Q=>Some(Rhombus Q)|_=>None end|_=>None end else
    if named "tangent" then match args with [c;s;p] => match parse_circle c,parse_segment s,parse_point p with Some C,Some ss,Some P=>Some(Tangent C ss P)|_,_,_=>None end|_=>None end else
    if named "chord" then match args with [c;s] => match parse_circle c,parse_segment s with Some C,Some ss=>Some(Chord C ss)|_,_=>None end|_=>None end else
    if named "minor_arc" then match args with [c;a;b] => match parse_circle c,parse_point a,parse_point b with Some C,Some A,Some B=>Some(ArcStatement(arc_name MinorArc C A B))|_,_,_=>None end|_=>None end else
    if named "major_arc" then match args with [c;a;b] => match parse_circle c,parse_point a,parse_point b with Some C,Some A,Some B=>Some(ArcStatement(arc_name MajorArc C A B))|_,_,_=>None end|_=>None end else
    if named "radius" then match args with [c;p] => match parse_circle c,parse_point p with Some C,Some P=>Some(Radius C P)|_,_=>None end|_=>None end else
    if named "diameter" then match args with [c;s] => match parse_circle c,parse_segment s with Some C,Some ss=>Some(Diameter C ss)|_,_=>None end|_=>None end else
    if named "inscribed_angle" then match args with [c;a] => match parse_circle c,parse_angle a with Some C,Some A=>Some(InscribedAngle C A)|_,_=>None end|_=>None end else
    if named "ref_seg" then match args with [a;b] => match parse_segment a,parse_segment b with Some A,Some B=>Some(RefSeg A B)|_,_=>None end|_=>None end else
    if named "ref_ang" then match args with [a;b] => match parse_angle a,parse_angle b with Some A,Some B=>Some(RefAng A B)|_,_=>None end|_=>None end else
    if named "con_arc" then match args with [a;b] => match parse_arc a,parse_arc b with Some A,Some B=>Some(ConArc A B)|_,_=>None end|_=>None end else None
  end.

(** A direct decoder for canonical renderings.  Besides making the common path
    cheaper, this gives the completeness proof a small structural round trip;
    the generic call parser remains the fallback for diagnostics and evolution. *)
Definition parse_rendered_statement (x : PChars) : option PublicStatement :=
  match x with
  | ["o"%char;"n"%char;"_"%char;"l"%char;"i"%char;"n"%char;"e"%char;"("%char;a;b;","%char;p;")"%char] => Some (OnLine (segment_name a b) p)
  | ["t"%char;"r"%char;"a"%char;"n"%char;"s"%char;"v"%char;"e"%char;"r"%char;"s"%char;"a"%char;"l"%char;"("%char;a;","%char;b;","%char;t1;","%char;i1;","%char;c;","%char;d;","%char;t2;","%char;i2;")"%char] => Some (Transversal a b t1 i1 c d t2 i2)
  | ["i"%char;"n"%char;"t"%char;"e"%char;"r"%char;"s"%char;"e"%char;"c"%char;"t"%char;"_"%char;"s"%char;"e"%char;"g"%char;"("%char;a;b;","%char;c;d;","%char;p;")"%char] => Some (IntersectSeg (segment_name a b) (segment_name c d) p)
  | ["t"%char;"r"%char;"a"%char;"p"%char;"e"%char;"z"%char;"o"%char;"i"%char;"d"%char;"_"%char;"p"%char;"r"%char;"e"%char;"m"%char;"i"%char;"s"%char;"e"%char;"("%char;"q"%char;"_"%char;a;b;c;d;","%char;e;f;","%char;g;h;")"%char] => Some (TrapezoidPremise (quadrilateral_name a b c d) (segment_name e f) (segment_name g h))
  | ["k"%char;"i"%char;"t"%char;"e"%char;"_"%char;"p"%char;"r"%char;"e"%char;"m"%char;"i"%char;"s"%char;"e"%char;"("%char;"q"%char;"_"%char;a;b;c;d;","%char;"a"%char;"_"%char;e;f;g;","%char;"a"%char;"_"%char;h;i;j;")"%char] => Some (KitePremise (quadrilateral_name a b c d) (angle_name e f g) (angle_name h i j))
  | ["i"%char;"s"%char;"o"%char;"s"%char;"_"%char;"t"%char;"r"%char;"a"%char;"p"%char;"e"%char;"z"%char;"o"%char;"i"%char;"d"%char;"_"%char;"p"%char;"r"%char;"e"%char;"m"%char;"i"%char;"s"%char;"e"%char;"("%char;"q"%char;"_"%char;a;b;c;d;","%char;e;f;","%char;g;h;")"%char] => Some (IsosTrapezoidPremise (quadrilateral_name a b c d) (segment_name e f) (segment_name g h))
  | ["r"%char;"i"%char;"g"%char;"h"%char;"t"%char;"("%char;"a"%char;"_"%char;a;b;c;")"%char] => Some (Right (angle_name a b c))
  | ["c"%char;"o"%char;"n"%char;"_"%char;"s"%char;"e"%char;"g"%char;"("%char;a;b;","%char;c;d;")"%char] => Some (ConSeg (segment_name a b) (segment_name c d))
  | ["c"%char;"o"%char;"n"%char;"_"%char;"a"%char;"n"%char;"g"%char;"("%char;"a"%char;"_"%char;a;b;c;","%char;"a"%char;"_"%char;d;e;f;")"%char] => Some (ConAng (angle_name a b c) (angle_name d e f))
  | ["c"%char;"o"%char;"n"%char;"_"%char;"t"%char;"r"%char;"i"%char;"("%char;"t"%char;"_"%char;a;b;c;","%char;"t"%char;"_"%char;d;e;f;")"%char] => Some (ConTri (triangle_name a b c) (triangle_name d e f))
  | ["c"%char;"o"%char;"n"%char;"_"%char;"r"%char;"i"%char;"g"%char;"h"%char;"t"%char;"("%char;"a"%char;"_"%char;a;b;c;","%char;"a"%char;"_"%char;d;e;f;")"%char] => Some (ConRight (angle_name a b c) (angle_name d e f))
  | ["p"%char;"a"%char;"r"%char;"a"%char;"("%char;a;b;","%char;c;d;")"%char] => Some (Para (segment_name a b) (segment_name c d))
  | ["i"%char;"s"%char;"o"%char;"s"%char;"c"%char;"e"%char;"l"%char;"e"%char;"s"%char;"("%char;"t"%char;"_"%char;a;b;c;")"%char] => Some (Isosceles (triangle_name a b c))
  | ["p"%char;"e"%char;"r"%char;"p"%char;"("%char;a;b;","%char;c;d;","%char;p;")"%char] => Some (Perp (segment_name a b) (segment_name c d) p)
  | ["m"%char;"i"%char;"d"%char;"p"%char;"t"%char;"("%char;a;b;","%char;p;")"%char] => Some (Midpt (segment_name a b) p)
  | ["a"%char;"n"%char;"g"%char;"_"%char;"b"%char;"i"%char;"s"%char;"e"%char;"c"%char;"t"%char;"("%char;"a"%char;"_"%char;a;b;c;","%char;d;e;")"%char] => Some (AngBisect (angle_name a b c) (segment_name d e))
  | ["r"%char;"e"%char;"c"%char;"t"%char;"a"%char;"n"%char;"g"%char;"l"%char;"e"%char;"("%char;"q"%char;"_"%char;a;b;c;d;")"%char] => Some (Rectangle (quadrilateral_name a b c d))
  | ["p"%char;"a"%char;"r"%char;"a"%char;"l"%char;"l"%char;"e"%char;"l"%char;"o"%char;"g"%char;"r"%char;"a"%char;"m"%char;"("%char;"q"%char;"_"%char;a;b;c;d;")"%char] => Some (Parallelogram (quadrilateral_name a b c d))
  | ["p"%char;"r"%char;"o"%char;"p"%char;"o"%char;"r"%char;"t"%char;"i"%char;"o"%char;"n"%char;"("%char;a;b;","%char;c;d;","%char;e;f;","%char;g;h;")"%char] => Some (Proportion (segment_name a b) (segment_name c d) (segment_name e f) (segment_name g h))
  | ["s"%char;"i"%char;"m"%char;"_"%char;"t"%char;"r"%char;"i"%char;"("%char;"t"%char;"_"%char;a;b;c;","%char;"t"%char;"_"%char;d;e;f;")"%char] => Some (SimTri (triangle_name a b c) (triangle_name d e f))
  | ["e"%char;"q"%char;"u"%char;"i"%char;"l"%char;"a"%char;"t"%char;"e"%char;"r"%char;"a"%char;"l"%char;"("%char;"t"%char;"_"%char;a;b;c;")"%char] => Some (Equilateral (triangle_name a b c))
  | ["s"%char;"u"%char;"p"%char;"p"%char;"l"%char;"e"%char;"m"%char;"e"%char;"n"%char;"t"%char;"a"%char;"r"%char;"y"%char;"("%char;"a"%char;"_"%char;a;b;c;","%char;"a"%char;"_"%char;d;e;f;")"%char] => Some (Supplementary (angle_name a b c) (angle_name d e f))
  | ["c"%char;"o"%char;"m"%char;"p"%char;"l"%char;"e"%char;"m"%char;"e"%char;"n"%char;"t"%char;"a"%char;"r"%char;"y"%char;"("%char;"a"%char;"_"%char;a;b;c;","%char;"a"%char;"_"%char;d;e;f;")"%char] => Some (Complementary (angle_name a b c) (angle_name d e f))
  | ["l"%char;"i"%char;"n"%char;"e"%char;"a"%char;"r"%char;"_"%char;"p"%char;"a"%char;"i"%char;"r"%char;"("%char;"a"%char;"_"%char;a;b;c;","%char;"a"%char;"_"%char;d;e;f;")"%char] => Some (LinearPair (angle_name a b c) (angle_name d e f))
  | ["e"%char;"q"%char;"u"%char;"i"%char;"a"%char;"n"%char;"g"%char;"u"%char;"l"%char;"a"%char;"r"%char;"("%char;"t"%char;"_"%char;a;b;c;")"%char] => Some (Equiangular (triangle_name a b c))
  | ["c"%char;"i"%char;"r"%char;"c"%char;"u"%char;"m"%char;"c"%char;"e"%char;"n"%char;"t"%char;"e"%char;"r"%char;"("%char;p;","%char;"t"%char;"_"%char;a;b;c;")"%char] => Some (Circumcenter p (triangle_name a b c))
  | ["i"%char;"n"%char;"c"%char;"e"%char;"n"%char;"t"%char;"e"%char;"r"%char;"("%char;p;","%char;"t"%char;"_"%char;a;b;c;")"%char] => Some (Incenter p (triangle_name a b c))
  | ["p"%char;"e"%char;"r"%char;"p"%char;"_"%char;"b"%char;"i"%char;"s"%char;"e"%char;"c"%char;"t"%char;"o"%char;"r"%char;"("%char;a;b;","%char;c;d;","%char;p;")"%char] => Some (PerpBisector (segment_name a b) (segment_name c d) p)
  | ["s"%char;"e"%char;"g"%char;"_"%char;"b"%char;"i"%char;"s"%char;"e"%char;"c"%char;"t"%char;"("%char;a;b;","%char;c;d;","%char;p;")"%char] => Some (SegBisect (segment_name a b) (segment_name c d) p)
  | ["i"%char;"s"%char;"o"%char;"s"%char;"_"%char;"t"%char;"r"%char;"a"%char;"p"%char;"e"%char;"z"%char;"o"%char;"i"%char;"d"%char;"("%char;"q"%char;"_"%char;a;b;c;d;")"%char] => Some (IsosTrapezoid (quadrilateral_name a b c d))
  | ["r"%char;"h"%char;"o"%char;"m"%char;"b"%char;"u"%char;"s"%char;"("%char;"q"%char;"_"%char;a;b;c;d;")"%char] => Some (Rhombus (quadrilateral_name a b c d))
  | ["t"%char;"a"%char;"n"%char;"g"%char;"e"%char;"n"%char;"t"%char;"("%char;"c"%char;"_"%char;o;r;","%char;a;b;","%char;p;")"%char] => Some (Tangent (circle_name o r) (segment_name a b) p)
  | ["c"%char;"h"%char;"o"%char;"r"%char;"d"%char;"("%char;"c"%char;"_"%char;o;r;","%char;a;b;")"%char] => Some (Chord (circle_name o r) (segment_name a b))
  | ["m"%char;"i"%char;"n"%char;"o"%char;"r"%char;"_"%char;"a"%char;"r"%char;"c"%char;"("%char;"c"%char;"_"%char;o;r;","%char;a;","%char;b;")"%char] => Some (ArcStatement (arc_name MinorArc (circle_name o r) a b))
  | ["m"%char;"a"%char;"j"%char;"o"%char;"r"%char;"_"%char;"a"%char;"r"%char;"c"%char;"("%char;"c"%char;"_"%char;o;r;","%char;a;","%char;b;")"%char] => Some (ArcStatement (arc_name MajorArc (circle_name o r) a b))
  | ["r"%char;"a"%char;"d"%char;"i"%char;"u"%char;"s"%char;"("%char;"c"%char;"_"%char;o;r;","%char;p;")"%char] => Some (Radius (circle_name o r) p)
  | ["d"%char;"i"%char;"a"%char;"m"%char;"e"%char;"t"%char;"e"%char;"r"%char;"("%char;"c"%char;"_"%char;o;r;","%char;a;b;")"%char] => Some (Diameter (circle_name o r) (segment_name a b))
  | ["i"%char;"n"%char;"s"%char;"c"%char;"r"%char;"i"%char;"b"%char;"e"%char;"d"%char;"_"%char;"a"%char;"n"%char;"g"%char;"l"%char;"e"%char;"("%char;"c"%char;"_"%char;o;r;","%char;"a"%char;"_"%char;a;b;c;")"%char] => Some (InscribedAngle (circle_name o r) (angle_name a b c))
  | ["r"%char;"e"%char;"f"%char;"_"%char;"s"%char;"e"%char;"g"%char;"("%char;a;b;","%char;c;d;")"%char] => Some (RefSeg (segment_name a b) (segment_name c d))
  | ["r"%char;"e"%char;"f"%char;"_"%char;"a"%char;"n"%char;"g"%char;"("%char;"a"%char;"_"%char;a;b;c;","%char;"a"%char;"_"%char;d;e;f;")"%char] => Some (RefAng (angle_name a b c) (angle_name d e f))
  | ["c"%char;"o"%char;"n"%char;"_"%char;"a"%char;"r"%char;"c"%char;"("%char;"m"%char;"i"%char;"n"%char;"o"%char;"r"%char;"_"%char;"a"%char;"r"%char;"c"%char;"("%char;"c"%char;"_"%char;o1;r1;","%char;a1;","%char;b1;")"%char;","%char;"m"%char;"i"%char;"n"%char;"o"%char;"r"%char;"_"%char;"a"%char;"r"%char;"c"%char;"("%char;"c"%char;"_"%char;o2;r2;","%char;a2;","%char;b2;")"%char;")"%char] => Some (ConArc (arc_name MinorArc (circle_name o1 r1) a1 b1) (arc_name MinorArc (circle_name o2 r2) a2 b2))
  | ["c"%char;"o"%char;"n"%char;"_"%char;"a"%char;"r"%char;"c"%char;"("%char;"m"%char;"i"%char;"n"%char;"o"%char;"r"%char;"_"%char;"a"%char;"r"%char;"c"%char;"("%char;"c"%char;"_"%char;o1;r1;","%char;a1;","%char;b1;")"%char;","%char;"m"%char;"a"%char;"j"%char;"o"%char;"r"%char;"_"%char;"a"%char;"r"%char;"c"%char;"("%char;"c"%char;"_"%char;o2;r2;","%char;a2;","%char;b2;")"%char;")"%char] => Some (ConArc (arc_name MinorArc (circle_name o1 r1) a1 b1) (arc_name MajorArc (circle_name o2 r2) a2 b2))
  | ["c"%char;"o"%char;"n"%char;"_"%char;"a"%char;"r"%char;"c"%char;"("%char;"m"%char;"a"%char;"j"%char;"o"%char;"r"%char;"_"%char;"a"%char;"r"%char;"c"%char;"("%char;"c"%char;"_"%char;o1;r1;","%char;a1;","%char;b1;")"%char;","%char;"m"%char;"i"%char;"n"%char;"o"%char;"r"%char;"_"%char;"a"%char;"r"%char;"c"%char;"("%char;"c"%char;"_"%char;o2;r2;","%char;a2;","%char;b2;")"%char;")"%char] => Some (ConArc (arc_name MajorArc (circle_name o1 r1) a1 b1) (arc_name MinorArc (circle_name o2 r2) a2 b2))
  | ["c"%char;"o"%char;"n"%char;"_"%char;"a"%char;"r"%char;"c"%char;"("%char;"m"%char;"a"%char;"j"%char;"o"%char;"r"%char;"_"%char;"a"%char;"r"%char;"c"%char;"("%char;"c"%char;"_"%char;o1;r1;","%char;a1;","%char;b1;")"%char;","%char;"m"%char;"a"%char;"j"%char;"o"%char;"r"%char;"_"%char;"a"%char;"r"%char;"c"%char;"("%char;"c"%char;"_"%char;o2;r2;","%char;a2;","%char;b2;")"%char;")"%char] => Some (ConArc (arc_name MajorArc (circle_name o1 r1) a1 b1) (arc_name MajorArc (circle_name o2 r2) a2 b2))
  | _ => None
  end.

Definition parse_public_statement_chars (text : PChars) : option PublicStatement :=
  match parse_rendered_statement text with
  | Some statement => Some statement
  | None => parse_public_statement_chars_generic text
  end.

Definition parse_public_statement (text : string) : option PublicStatement :=
  let input := normalized text in
  match parse_public_statement_chars input with
  | Some statement =>
      if pointsValid (statementPoints statement) then
        if chars_eqb input (list_ascii_of_string (statementText statement))
        then Some statement else None
      else None
  | None => None
  end.

Ltac solve_statement_render :=
  repeat match goal with
  | s : SegmentName |- _ => destruct s
  | a : AngleName |- _ => destruct a
  | t : TriangleName |- _ => destruct t
  | q : QuadrilateralName |- _ => destruct q
  | c : CircleName |- _ => destruct c
  | a : ArcName |- _ => destruct a
  | k : ArcKind |- _ => destruct k
  end;
  reflexivity.

Lemma parse_public_statement_chars_render : forall statement,
  pointsValid (statementPoints statement) = true ->
  parse_public_statement_chars
    (list_ascii_of_string (statementText statement)) = Some statement.
Proof.
  intros statement Hvalid. destruct statement.
  all: abstract solve_statement_render.
Qed.

Theorem parse_public_statement_complete : forall text statement,
  StatementText text statement -> parse_public_statement text = Some statement.
Proof.
  intros text statement [Hvalid Htext]. unfold parse_public_statement.
  rewrite Htext, parse_public_statement_chars_render by exact Hvalid.
  rewrite Hvalid, (proj2 (chars_eqb_eq _ _) eq_refl). reflexivity.
Qed.

Theorem parse_public_statement_sound : forall text statement,
  parse_public_statement text = Some statement -> StatementText text statement.
Proof.
  intros text statement H. unfold parse_public_statement in H.
  destruct (parse_public_statement_chars (normalized text)) as [parsed|] eqn:Hparsed;
    try discriminate.
  destruct (pointsValid (statementPoints parsed)) eqn:Hvalid; cbn in H;
    try discriminate.
  destruct (chars_eqb (normalized text)
             (list_ascii_of_string (statementText parsed))) eqn:Heq;
    try discriminate.
  injection H as <-. split; [exact Hvalid|]. now apply chars_eqb_eq in Heq.
Qed.

Fixpoint parse_segment_declarations (text : PChars) : option (list PublicDeclaration) :=
  match text with []=>Some[] | a::b::rest => match parse_segment_declarations rest with Some ds=>Some(SegmentDeclaration(segment_name a b)::ds)|_=>None end | _=>None end.
Fixpoint parse_angle_declarations (text : PChars) : option (list PublicDeclaration) :=
  match text with []=>Some[] | "a"%char::"_"%char::a::o::b::rest => match parse_angle_declarations rest with Some ds=>Some(AngleDeclaration(angle_name a o b)::ds)|_=>None end | _=>None end.
Fixpoint parse_triangle_declarations (text : PChars) : option (list PublicDeclaration) :=
  match text with []=>Some[] | "t"%char::"_"%char::a::b::c::rest => match parse_triangle_declarations rest with Some ds=>Some(TriangleDeclaration(triangle_name a b c)::ds)|_=>None end | _=>None end.
Fixpoint parse_quad_declarations (text : PChars) : option (list PublicDeclaration) :=
  match text with []=>Some[] | "q"%char::"_"%char::a::b::c::d::rest => match parse_quad_declarations rest with Some ds=>Some(QuadrilateralDeclaration(quadrilateral_name a b c d)::ds)|_=>None end | _=>None end.
Fixpoint parse_circle_declarations (text : PChars) : option (list PublicDeclaration) :=
  match text with []=>Some[] | "c"%char::"_"%char::o::r::rest => match parse_circle_declarations rest with Some ds=>Some(CircleDeclaration(circle_name o r)::ds)|_=>None end | _=>None end.

Lemma concat_empty_cons : forall first rest,
  String.concat "" (first :: rest) = first ++ String.concat "" rest.
Proof. intros first rest. destruct rest; cbn; induction first; cbn; congruence. Qed.

Lemma list_ascii_append : forall a b,
  list_ascii_of_string (a ++ b) =
  List.app (list_ascii_of_string a) (list_ascii_of_string b).
Proof. induction a; cbn; intros; [reflexivity|now rewrite IHa]. Qed.

Lemma parse_segment_declarations_render : forall declarations,
  Forall (fun d => declarationTag d = "seg:") declarations ->
  parse_segment_declarations
    (list_ascii_of_string (String.concat "" (map declarationObjectText declarations))) =
  Some declarations.
Proof.
  intros declarations H. induction H as [|d ds Hd Hds IH]; [reflexivity|].
  cbn [map]. rewrite concat_empty_cons, list_ascii_append.
  destruct d; cbn in Hd; try discriminate. destruct s. cbn. now rewrite IH.
Qed.

Lemma parse_angle_declarations_render : forall declarations,
  Forall (fun d => declarationTag d = "ang:") declarations ->
  parse_angle_declarations
    (list_ascii_of_string (String.concat "" (map declarationObjectText declarations))) =
  Some declarations.
Proof.
  intros declarations H. induction H as [|d ds Hd Hds IH]; [reflexivity|].
  cbn [map]. rewrite concat_empty_cons, list_ascii_append.
  destruct d; cbn in Hd; try discriminate. destruct a. cbn. now rewrite IH.
Qed.

Lemma parse_triangle_declarations_render : forall declarations,
  Forall (fun d => declarationTag d = "tri:") declarations ->
  parse_triangle_declarations
    (list_ascii_of_string (String.concat "" (map declarationObjectText declarations))) =
  Some declarations.
Proof.
  intros declarations H. induction H as [|d ds Hd Hds IH]; [reflexivity|].
  cbn [map]. rewrite concat_empty_cons, list_ascii_append.
  destruct d; cbn in Hd; try discriminate. destruct t. cbn. now rewrite IH.
Qed.

Lemma parse_quad_declarations_render : forall declarations,
  Forall (fun d => declarationTag d = "quad:") declarations ->
  parse_quad_declarations
    (list_ascii_of_string (String.concat "" (map declarationObjectText declarations))) =
  Some declarations.
Proof.
  intros declarations H. induction H as [|d ds Hd Hds IH]; [reflexivity|].
  cbn [map]. rewrite concat_empty_cons, list_ascii_append.
  destruct d; cbn in Hd; try discriminate. destruct q. cbn. now rewrite IH.
Qed.

Lemma parse_circle_declarations_render : forall declarations,
  Forall (fun d => declarationTag d = "circ:") declarations ->
  parse_circle_declarations
    (list_ascii_of_string (String.concat "" (map declarationObjectText declarations))) =
  Some declarations.
Proof.
  intros declarations H. induction H as [|d ds Hd Hds IH]; [reflexivity|].
  cbn [map]. rewrite concat_empty_cons, list_ascii_append.
  destruct d; cbn in Hd; try discriminate. destruct c. cbn. now rewrite IH.
Qed.

Definition parse_declaration_line_raw_chars (text : PChars)
    : option (list PublicDeclaration) :=
  if ProblemPart.starts_with (list_ascii_of_string "seg:") text then parse_segment_declarations(ProblemPart.drop_chars 4 text) else
  if ProblemPart.starts_with (list_ascii_of_string "ang:") text then parse_angle_declarations(ProblemPart.drop_chars 4 text) else
  if ProblemPart.starts_with (list_ascii_of_string "tri:") text then parse_triangle_declarations(ProblemPart.drop_chars 4 text) else
  if ProblemPart.starts_with (list_ascii_of_string "quad:") text then parse_quad_declarations(ProblemPart.drop_chars 5 text) else
  if ProblemPart.starts_with (list_ascii_of_string "circ:") text then parse_circle_declarations(ProblemPart.drop_chars 5 text) else None.

Definition parse_declaration_line_raw (line : string) : option (list PublicDeclaration) :=
  parse_declaration_line_raw_chars (normalized line).

Lemma parse_declaration_line_raw_chars_render : forall first rest,
  Forall (fun declaration => declarationTag declaration = declarationTag first) rest ->
  parse_declaration_line_raw_chars
    (list_ascii_of_string (declarationTag first ++
      String.concat "" (map declarationObjectText (first :: rest)))) =
  Some (first :: rest).
Proof.
  intros first rest Htags. cbn [map].
  rewrite concat_empty_cons, !list_ascii_append.
  destruct first; cbn in Htags |- *.
  - destruct s. cbn. now rewrite parse_segment_declarations_render by exact Htags.
  - destruct a. cbn. now rewrite parse_angle_declarations_render by exact Htags.
  - destruct t. cbn. now rewrite parse_triangle_declarations_render by exact Htags.
  - destruct q. cbn. now rewrite parse_quad_declarations_render by exact Htags.
  - destruct c. cbn. now rewrite parse_circle_declarations_render by exact Htags.
Qed.

Definition declarations_text (declarations : list PublicDeclaration) : option string :=
  match declarations with
  | [] => None
  | first :: rest =>
      if forallb (fun declaration =>
           String.eqb (declarationTag declaration) (declarationTag first)) rest
      then Some (declarationTag first ++
        String.concat "" (map declarationObjectText declarations))
      else None
  end.

Definition declarations_valid (declarations : list PublicDeclaration) : bool :=
  forallb (fun declaration => pointsValid (declarationPoints declaration)) declarations.

Definition parse_declaration_line (line : string) : option (list PublicDeclaration) :=
  match parse_declaration_line_raw line with
  | Some declarations =>
      match declarations_text declarations with
      | Some rendered =>
          if declarations_valid declarations then
            if chars_eqb (normalized line) (list_ascii_of_string rendered)
            then Some declarations else None
          else None
      | None => None
      end
  | None => None
  end.

Theorem parse_declaration_line_complete : forall line declarations,
  DeclarationText line declarations ->
  parse_declaration_line line = Some declarations.
Proof.
  intros line declarations
    [first [rest [-> [Htags [Hvalid Htext]]]]].
  unfold parse_declaration_line.
  unfold parse_declaration_line_raw.
  rewrite Htext.
  rewrite parse_declaration_line_raw_chars_render by exact Htags.
  unfold declarations_text.
  rewrite (proj2 (forallb_forall _ _) (fun declaration Hin =>
    proj2 (String.eqb_eq _ _)
      (proj1 (Forall_forall _ _) Htags declaration Hin))).
  unfold declarations_valid. rewrite (proj2 (forallb_forall _ _) (fun declaration Hin =>
    proj1 (Forall_forall _ _) Hvalid declaration Hin)).
  rewrite (proj2 (chars_eqb_eq _ _) eq_refl). reflexivity.
Qed.

Theorem parse_declaration_line_sound : forall line declarations,
  parse_declaration_line line = Some declarations ->
  DeclarationText line declarations.
Proof.
  intros line declarations H. unfold parse_declaration_line in H.
  destruct (parse_declaration_line_raw line) as [parsed|] eqn:Hraw;
    try discriminate.
  unfold declarations_text in H.
  destruct parsed as [|first rest]; try discriminate.
  destruct (forallb (fun declaration =>
    String.eqb (declarationTag declaration) (declarationTag first)) rest)
    eqn:Htags; try discriminate.
  destruct (declarations_valid (first :: rest))
    eqn:Hvalid.
  2: discriminate.
  destruct (chars_eqb (normalized line)
    (list_ascii_of_string
      (declarationTag first ++
       String.concat "" (map declarationObjectText (first :: rest)))))
    eqn:Heq; try discriminate.
  cbn in Heq. injection H as <-.
  exists first, rest. split; [reflexivity|]. split.
  - rewrite forallb_forall in Htags. apply Forall_forall. intros declaration Hin.
    specialize (Htags declaration Hin). now apply String.eqb_eq in Htags.
  - split.
    + unfold declarations_valid in Hvalid. apply Forall_forall.
      rewrite forallb_forall in Hvalid. exact Hvalid.
    + now apply chars_eqb_eq in Heq.
Qed.

Definition HeaderContribution :=
  (list PublicDeclaration * list PublicStatement * option PublicStatement)%type.

Definition parse_public_line (line : string) : option HeaderContribution :=
  match premiseBody line with
  | Some body =>
      match parse_public_statement body with
      | Some statement => Some ([], [statement], None)
      | None => None
      end
  | None =>
      match goalBody line with
      | Some body =>
          match parse_public_statement body with
          | Some statement => Some ([], [], Some statement)
          | None => None
          end
      | None =>
          match parse_declaration_line line with
          | Some declarations => Some (declarations, [], None)
          | None => if chars_eqb (normalized line) []
                    then Some ([], [], None) else None
          end
      end
  end.

Theorem parse_public_line_sound : forall line contribution,
  parse_public_line line = Some contribution -> HeaderLine line contribution.
Proof.
  intros line contribution H. unfold parse_public_line in H.
  destruct (premiseBody line) as [body|] eqn:Hpremise.
  - destruct (parse_public_statement body) as [statement|] eqn:Hstatement;
      try discriminate. injection H as <-. econstructor; eauto using parse_public_statement_sound.
  - destruct (goalBody line) as [body|] eqn:Hgoal.
    + destruct (parse_public_statement body) as [statement|] eqn:Hstatement;
        try discriminate. injection H as <-. econstructor; eauto using parse_public_statement_sound.
    + destruct (parse_declaration_line line) as [declarations|] eqn:Hdeclarations.
      * injection H as <-. constructor; eauto using parse_declaration_line_sound.
      * destruct (chars_eqb (normalized line) []) eqn:Hblank; try discriminate.
        injection H as <-. apply IgnoredBlankLine; try assumption.
        exact (proj1 (chars_eqb_eq _ _) Hblank).
Qed.

Theorem parse_public_line_complete : forall line contribution,
  HeaderLine line contribution -> parse_public_line line = Some contribution.
Proof.
  intros line contribution H. inversion H; subst; unfold parse_public_line.
  - rewrite H0, H1, (parse_declaration_line_complete line declarations H2).
    reflexivity.
  - rewrite H0, (parse_public_statement_complete body statement H1). reflexivity.
  - rewrite H0, H1, (parse_public_statement_complete body statement H2).
    reflexivity.
  - rewrite H0, H1. destruct (parse_declaration_line line) eqn:Hdeclaration.
    + exfalso. apply parse_declaration_line_sound in Hdeclaration.
      destruct Hdeclaration as [first [rest [_ [_ [_ Htext]]]]].
      rewrite H2 in Htext. destruct first; discriminate.
    + rewrite (proj2 (chars_eqb_eq _ _) H2). reflexivity.
Qed.

Fixpoint parse_public_lines (lines : list string) : option HeaderContribution :=
  match lines with
  | [] => Some ([], [], None)
  | line :: rest =>
      match parse_public_line line, parse_public_lines rest with
      | Some (lineDeclarations, linePremises, lineGoal),
        Some (declarations, premises, goal) =>
          match lineGoal, goal with
          | Some _, Some _ => None
          | _, _ => Some (List.app lineDeclarations declarations,
                          List.app linePremises premises,
                          match lineGoal with Some s => Some s | None => goal end)
          end
      | _, _ => None
      end
  end.

Theorem parse_public_lines_sound : forall lines declarations premises goal,
  parse_public_lines lines = Some (declarations, premises, goal) ->
  HeaderLines lines declarations premises goal.
Proof.
  induction lines as [|line rest IH]; intros declarations premises goal H; cbn in H.
  - injection H as <- <- <-. constructor.
  - destruct (parse_public_line line) as [[[lineDeclarations linePremises] lineGoal]|]
      eqn:Hline; try discriminate.
    destruct (parse_public_lines rest) as [[[restDeclarations restPremises] restGoal]|]
      eqn:Hrest; try discriminate.
    destruct lineGoal as [lineStatement|], restGoal as [restStatement|];
      try discriminate; injection H as <- <- <-.
    + refine (@MoreHeaderLines line rest lineDeclarations linePremises
          (Some lineStatement) restDeclarations restPremises None _ _ _).
      * now eapply parse_public_line_sound.
      * now apply IH.
      * right; reflexivity.
    + refine (@MoreHeaderLines line rest lineDeclarations linePremises
          None restDeclarations restPremises (Some restStatement) _ _ _).
      * now eapply parse_public_line_sound.
      * now apply IH.
      * left; reflexivity.
    + refine (@MoreHeaderLines line rest lineDeclarations linePremises
          None restDeclarations restPremises None _ _ _).
      * now eapply parse_public_line_sound.
      * now apply IH.
      * left; reflexivity.
Qed.

Theorem parse_public_lines_complete : forall lines declarations premises goal,
  HeaderLines lines declarations premises goal ->
  parse_public_lines lines = Some (declarations, premises, goal).
Proof.
  intros lines declarations premises goal H. induction H.
  - reflexivity.
  - cbn. rewrite (parse_public_line_complete line
      (lineDeclarations, linePremises, lineGoal) H).
    rewrite IHHeaderLines. destruct lineGoal, goal; cbn in *; try reflexivity.
    destruct H1; discriminate.
Qed.

Definition parsePublicProblem (source:string) : option PublicProblem :=
  match parse_public_lines (splitLines source) with
  |Some (declarations, premises, Some goal) =>
      Some (public_problem declarations premises goal)
  |Some (_, _, None) => None
  |None=>None end.

Theorem parsePublicProblem_sound : forall source problem,
  parsePublicProblem source = Some problem -> ProblemGrammar source problem.
Proof.
  intros source problem H. unfold parsePublicProblem in H.
  destruct (parse_public_lines (splitLines source)) as [[[declarations premises] goal]|]
    eqn:Hlines; try discriminate.
  destruct goal as [conclusion|]; try discriminate. injection H as <-.
  constructor. now eapply parse_public_lines_sound.
Qed.

Theorem parsePublicProblem_complete : forall source problem,
  ProblemGrammar source problem -> parsePublicProblem source = Some problem.
Proof.
  intros source problem H. inversion H; subst. unfold parsePublicProblem.
  rewrite (parse_public_lines_complete (splitLines source) declarations premises
    (Some conclusion) H0). reflexivity.
Qed.
