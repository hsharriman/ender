From Stdlib Require Import String List.
Require Import Ender.Parser Ender.PublicParser Ender.CompleteChecker Ender.CertifiedAPI.
Import ListNotations.
Open Scope string_scope.

Definition common_header (premises goal steps : string) : string :=
  "title: Rocq vertical slice
premises:
pt: A (0,0), B (1,0), C (0,1), D (3,0), E (4,0), F (3,1)
tri: t_ABC t_DEF
" ++ premises ++ "-> " ++ goal ++ "

steps:
" ++ steps.

Definition sas_source := common_header
  "[g_1] con_seg(AB,DE)
[g_2] con_ang(a_BAC,a_EDF)
[g_3] con_seg(AC,DF)
"
  "con_tri(t_ABC,t_DEF)"
  "[01] given(g_1) -> con_seg(AB,DE)
[02] given(g_2) -> con_ang(a_BAC,a_EDF)
[03] given(g_3) -> con_seg(AC,DF)
[04] sas(1,2,3) -> con_tri(t_ABC,t_DEF)".

Definition sss_source := common_header
  "[g_1] con_seg(AB,DE)
[g_2] con_seg(BC,EF)
[g_3] con_seg(CA,FD)
"
  "con_tri(t_ABC,t_DEF)"
  "[01] given(g_1) -> con_seg(AB,DE)
[02] given(g_2) -> con_seg(BC,EF)
[03] given(g_3) -> con_seg(CA,FD)
[04] sss(1,2,3) -> con_tri(t_ABC,t_DEF)".

Definition asa_source := common_header
  "[g_1] con_ang(a_BAC,a_EDF)
[g_2] con_seg(AB,DE)
[g_3] con_ang(a_ABC,a_DEF)
"
  "con_tri(t_ABC,t_DEF)"
  "[01] given(g_1) -> con_ang(a_BAC,a_EDF)
[02] given(g_2) -> con_seg(AB,DE)
[03] given(g_3) -> con_ang(a_ABC,a_DEF)
[04] asa(1,2,3) -> con_tri(t_ABC,t_DEF)".

Definition aas_source := common_header
  "[g_1] con_ang(a_ACB,a_DFE)
[g_2] con_ang(a_ABC,a_DEF)
[g_3] con_seg(AB,DE)
"
  "con_tri(t_ABC,t_DEF)"
  "[01] given(g_1) -> con_ang(a_ACB,a_DFE)
[02] given(g_2) -> con_ang(a_ABC,a_DEF)
[03] given(g_3) -> con_seg(AB,DE)
[04] aas(1,2,3) -> con_tri(t_ABC,t_DEF)".

Definition cpctc_source := common_header
  "[g_1] con_seg(AB,DE)
[g_2] con_seg(BC,EF)
[g_3] con_seg(CA,FD)
"
  "con_ang(a_BAC,a_EDF)"
  "[01] given(g_1) -> con_seg(AB,DE)
[02] given(g_2) -> con_seg(BC,EF)
[03] given(g_3) -> con_seg(CA,FD)
[04] sss(1,2,3) -> con_tri(t_ABC,t_DEF)
[05] cpctc(4) -> con_ang(a_BAC,a_EDF)".

Definition repository_tutorial :=
  "// pass
title: Tutorial
premises:
pt: A (5.5, 9), B (2, 3), C (5.5, 1), D (9, 3)
tri: t_ABC t_ADC
[g_1] con_seg(AB,AD)
[g_2] con_ang(a_BAC,a_DAC)
-> con_tri(t_ABC,t_ADC)

steps:
[01] given(g_1) -> con_seg(AB,AD)
[02] given(g_2) -> con_ang(a_BAC,a_DAC)
[03] reflex() -> ref_seg(AC, AC)
[04] sas(1, 2, 3) -> con_tri(t_ABC,t_ADC)".

Example sas_accepts : check_source sas_source = true. Proof. vm_compute. reflexivity. Qed.
Example sss_accepts : check_source sss_source = true. Proof. vm_compute. reflexivity. Qed.
Example asa_accepts : check_source asa_source = true. Proof. vm_compute. reflexivity. Qed.
Example aas_accepts : check_source aas_source = true. Proof. vm_compute. reflexivity. Qed.
Example cpctc_accepts : check_source cpctc_source = true. Proof. vm_compute. reflexivity. Qed.
Example repository_tutorial_accepts : check_source repository_tutorial = true.
Proof. vm_compute. reflexivity. Qed.

Example complete_sas_accepts : complete_checker sas_source = true.
Proof. vm_compute. reflexivity. Qed.
Example complete_sss_accepts : complete_checker sss_source = true.
Proof. vm_compute. reflexivity. Qed.
Example complete_asa_accepts : complete_checker asa_source = true.
Proof. vm_compute. reflexivity. Qed.
Example complete_aas_accepts : complete_checker aas_source = true.
Proof. vm_compute. reflexivity. Qed.
Example complete_cpctc_accepts : complete_checker cpctc_source = true.
Proof. vm_compute. reflexivity. Qed.
Example complete_repository_tutorial_accepts :
  complete_checker repository_tutorial = true.
Proof. vm_compute. reflexivity. Qed.

Example certified_rich_report_accepts :
  (CertifiedAPI.check sas_source).(Audit.report_verdict) =
    Audit.Accepted.
Proof. vm_compute. reflexivity. Qed.

Example certified_boolean_is_report_projection : forall source,
  CertifiedAPI.checker source =
    Audit.accepted (CertifiedAPI.check source).
Proof. reflexivity. Qed.

Example presentation_parser_retains_untrusted_display_data :
  match CertifiedAPI.parsePresentation
    "title: Display title
premises:
pt: A (-1.5, 2.0, tl), B (3, 4, br)
tri: t_ABC
[g_1] con_seg(AB,AC)
-> con_seg(AB,AC)

steps:
[01] given(g_1) -> con_seg(AB,AC)" with
  | Some file =>
      file.(Audit.presentation_title) = Some "Display title" /\
      length file.(Audit.presentation_points) = 2 /\
      length file.(Audit.presentation_declarations) = 1 /\
      length file.(Audit.presentation_givens) = 1 /\
      length file.(Audit.presentation_steps) = 1
  | None => False
  end.
Proof. vm_compute. repeat split; reflexivity. Qed.

(** The complete public parser already covers statement forms outside the
    currently executable reason kernel, including nested arc syntax. *)
Example public_arc_statement_parses :
  match parse_public_statement
    "con_arc(minor_arc(c_OA,A,B),major_arc(c_OD,D,E))" with
  | Some (Audit.ConArc _ _) => true
  | _ => false
  end = true.
Proof. vm_compute. reflexivity. Qed.

Example lowercase_point_label_is_rejected :
  parse_public_statement "con_seg(aB,CD)" = None.
Proof. vm_compute. reflexivity. Qed.

Example public_statement_parser_is_complete : forall text statement,
  Audit.StatementText text statement ->
  parse_public_statement text = Some statement.
Proof. exact parse_public_statement_complete. Qed.

Definition public_header := "tri: t_ABC t_DEF
[g_1] con_seg(AB,DE)
-> con_tri(t_ABC,t_DEF)
".

Example complete_public_header_parses :
  match parsePublicProblem public_header with Some _ => true | None => false end = true.
Proof. vm_compute. reflexivity. Qed.

Definition bad_sss_source := common_header
  "[g_1] con_seg(AB,DE)
[g_2] con_ang(a_BAC,a_EDF)
[g_3] con_seg(AC,DF)
"
  "con_tri(t_ABC,t_DEF)"
  "[01] given(g_1) -> con_seg(AB,DE)
[02] given(g_2) -> con_ang(a_BAC,a_EDF)
[03] given(g_3) -> con_seg(AC,DF)
[04] sss(1,2,3) -> con_tri(t_ABC,t_DEF)".

Example wrong_reason_rejects : check_source bad_sss_source = false.
Proof. vm_compute. reflexivity. Qed.

Example complete_wrong_reason_rejects : complete_checker bad_sss_source = false.
Proof. vm_compute. reflexivity. Qed.
Example complete_wrong_reason_is_proof_rejection :
  classify_source bad_sss_source = ProofRejected.
Proof. vm_compute. reflexivity. Qed.

Example certified_sss_type_mismatch_is_structured :
  (CertifiedAPI.check bad_sss_source).(Audit.report_issues) =
    [(Audit.issue 12 "reason_dep_type_mismatch"
      (Audit.JsonObject
        [("reason", Audit.JsonString "sss");
         ("index", Audit.JsonNumber 1);
         ("ref", Audit.JsonString "2");
         ("expectedType", Audit.JsonString "con_seg");
         ("allowedTypes", Audit.JsonArray
            [Audit.JsonString "ref_seg"]);
         ("receivedType", Audit.JsonString "con_ang");
         ("steps", Audit.JsonArray
            [Audit.JsonString "4"])]))].
Proof. vm_compute. reflexivity. Qed.

(** Transitivity of congruence, for each supported object kind. *)
Definition transitive_header (declarations premises goal steps : string) : string :=
  "title: Transitivity
premises:
pt: A (0,0), B (1,0), C (2,0), D (3,0), E (4,0), F (5,0), G (6,0), H (7,0), I (8,0), J (9,0), K (10,0), L (11,0)
" ++ declarations ++ premises ++ "-> " ++ goal ++ "

steps:
" ++ steps.

Definition con_seg_transitive_source := transitive_header "seg: AB CD EF
"
  "[g_1] con_seg(AB,CD)
[g_2] con_seg(CD,EF)
"
  "con_seg(AB,EF)"
  "[01] given(g_1) -> con_seg(AB,CD)
[02] given(g_2) -> con_seg(CD,EF)
[03] con_seg_transitive(1,2) -> con_seg(AB,EF)".

(** Segment names are unoriented, and either dependency may list the shared
    segment on either side. *)
Definition con_seg_transitive_reordered_source := transitive_header "seg: AB CD EF
"
  "[g_1] con_seg(CD,AB)
[g_2] con_seg(EF,DC)
"
  "con_seg(BA,EF)"
  "[01] given(g_1) -> con_seg(CD,AB)
[02] given(g_2) -> con_seg(EF,DC)
[03] con_seg_transitive(1,2) -> con_seg(BA,EF)".

Definition con_seg_transitive_unshared_source := transitive_header "seg: AB CD EF GH
"
  "[g_1] con_seg(AB,CD)
[g_2] con_seg(EF,GH)
"
  "con_seg(AB,EF)"
  "[01] given(g_1) -> con_seg(AB,CD)
[02] given(g_2) -> con_seg(EF,GH)
[03] con_seg_transitive(1,2) -> con_seg(AB,EF)".

Definition con_ang_transitive_source := transitive_header "tri: t_ABC t_DEF t_GHI
"
  "[g_1] con_ang(a_BAC,a_EDF)
[g_2] con_ang(a_EDF,a_HGI)
"
  "con_ang(a_BAC,a_HGI)"
  "[01] given(g_1) -> con_ang(a_BAC,a_EDF)
[02] given(g_2) -> con_ang(a_EDF,a_HGI)
[03] con_ang_transitive(1,2) -> con_ang(a_BAC,a_HGI)".

(** [a_XYZ] and [a_ZYX] name the same angle, so a reversed middle angle is
    still the shared one. *)
Definition con_ang_transitive_reversed_source := transitive_header "tri: t_ABC t_DEF t_GHI
"
  "[g_1] con_ang(a_BAC,a_EDF)
[g_2] con_ang(a_FDE,a_HGI)
"
  "con_ang(a_BAC,a_HGI)"
  "[01] given(g_1) -> con_ang(a_BAC,a_EDF)
[02] given(g_2) -> con_ang(a_FDE,a_HGI)
[03] con_ang_transitive(1,2) -> con_ang(a_BAC,a_HGI)".

Definition con_ang_transitive_unshared_source :=
  transitive_header "tri: t_ABC t_DEF t_GHI t_JKL
"
  "[g_1] con_ang(a_BAC,a_EDF)
[g_2] con_ang(a_HGI,a_KJL)
"
  "con_ang(a_BAC,a_HGI)"
  "[01] given(g_1) -> con_ang(a_BAC,a_EDF)
[02] given(g_2) -> con_ang(a_HGI,a_KJL)
[03] con_ang_transitive(1,2) -> con_ang(a_BAC,a_HGI)".

Definition con_tri_transitive_source := transitive_header "tri: t_ABC t_DEF t_GHI
"
  "[g_1] con_tri(t_ABC,t_DEF)
[g_2] con_tri(t_DEF,t_GHI)
"
  "con_tri(t_ABC,t_GHI)"
  "[01] given(g_1) -> con_tri(t_ABC,t_DEF)
[02] given(g_2) -> con_tri(t_DEF,t_GHI)
[03] con_tri_transitive(1,2) -> con_tri(t_ABC,t_GHI)".

(** The shared triangle may appear on either side of either dependency. *)
Definition con_tri_transitive_crossed_source := transitive_header "tri: t_ABC t_DEF t_GHI
"
  "[g_1] con_tri(t_ABC,t_DEF)
[g_2] con_tri(t_GHI,t_ABC)
"
  "con_tri(t_DEF,t_GHI)"
  "[01] given(g_1) -> con_tri(t_ABC,t_DEF)
[02] given(g_2) -> con_tri(t_GHI,t_ABC)
[03] con_tri_transitive(1,2) -> con_tri(t_DEF,t_GHI)".

Definition con_tri_transitive_unshared_source :=
  transitive_header "tri: t_ABC t_DEF t_GHI t_JKL
"
  "[g_1] con_tri(t_ABC,t_DEF)
[g_2] con_tri(t_GHI,t_JKL)
"
  "con_tri(t_ABC,t_GHI)"
  "[01] given(g_1) -> con_tri(t_ABC,t_DEF)
[02] given(g_2) -> con_tri(t_GHI,t_JKL)
[03] con_tri_transitive(1,2) -> con_tri(t_ABC,t_GHI)".

Example con_seg_transitive_accepts :
  complete_checker con_seg_transitive_source = true.
Proof. vm_compute. reflexivity. Qed.
Example con_seg_transitive_reordered_accepts :
  complete_checker con_seg_transitive_reordered_source = true.
Proof. vm_compute. reflexivity. Qed.
Example con_seg_transitive_unshared_rejects :
  complete_checker con_seg_transitive_unshared_source = false.
Proof. vm_compute. reflexivity. Qed.
Example con_ang_transitive_accepts :
  complete_checker con_ang_transitive_source = true.
Proof. vm_compute. reflexivity. Qed.
Example con_ang_transitive_reversed_accepts :
  complete_checker con_ang_transitive_reversed_source = true.
Proof. vm_compute. reflexivity. Qed.
Example con_ang_transitive_unshared_rejects :
  complete_checker con_ang_transitive_unshared_source = false.
Proof. vm_compute. reflexivity. Qed.
Example con_tri_transitive_accepts :
  complete_checker con_tri_transitive_source = true.
Proof. vm_compute. reflexivity. Qed.
Example con_tri_transitive_crossed_accepts :
  complete_checker con_tri_transitive_crossed_source = true.
Proof. vm_compute. reflexivity. Qed.
Example con_tri_transitive_unshared_rejects :
  complete_checker con_tri_transitive_unshared_source = false.
Proof. vm_compute. reflexivity. Qed.

(** A transitivity dependency of the wrong statement kind fails closed and is
    reported through the audited issue channel. *)
Definition con_seg_transitive_wrong_kind_source := transitive_header "tri: t_ABC t_DEF t_GHI
"
  "[g_1] con_seg(AB,CD)
[g_2] con_ang(a_BAC,a_EDF)
"
  "con_seg(AB,EF)"
  "[01] given(g_1) -> con_seg(AB,CD)
[02] given(g_2) -> con_ang(a_BAC,a_EDF)
[03] con_seg_transitive(1,2) -> con_seg(AB,EF)".

Example con_seg_transitive_wrong_kind_rejects :
  complete_checker con_seg_transitive_wrong_kind_source = false.
Proof. vm_compute. reflexivity. Qed.

Example con_seg_transitive_wrong_kind_is_structured :
  (CertifiedAPI.check con_seg_transitive_wrong_kind_source)
    .(Audit.report_issues) =
    [(Audit.issue 12 "reason_dep_type_mismatch"
      (Audit.JsonObject
        [("reason", Audit.JsonString "con_seg_transitive");
         ("index", Audit.JsonNumber 1);
         ("ref", Audit.JsonString "2");
         ("expectedType", Audit.JsonString "con_seg");
         ("allowedTypes", Audit.JsonArray
            [Audit.JsonString "ref_seg"]);
         ("receivedType", Audit.JsonString "con_ang");
         ("steps", Audit.JsonArray
            [Audit.JsonString "3"])]))].
Proof. vm_compute. reflexivity. Qed.

(** Right angles and perpendicularity. *)
Definition def_con_right_source := transitive_header ""
  "[g_1] right(a_CAB)
[g_2] right(a_FDE)
"
  "con_ang(a_CAB,a_FDE)"
  "[01] given(g_1) -> right(a_CAB)
[02] given(g_2) -> right(a_FDE)
[03] def_con_right(1,2) -> con_ang(a_CAB,a_FDE)".

Definition def_con_right_con_right_source := transitive_header ""
  "[g_1] right(a_CAB)
[g_2] right(a_FDE)
"
  "con_right(a_CAB,a_FDE)"
  "[01] given(g_1) -> right(a_CAB)
[02] given(g_2) -> right(a_FDE)
[03] def_con_right(1,2) -> con_right(a_CAB,a_FDE)".

(** The concluded angles must be the ones stated to be right. *)
Definition def_con_right_other_angle_source := transitive_header ""
  "[g_1] right(a_CAB)
[g_2] right(a_FDE)
"
  "con_ang(a_ABC,a_FDE)"
  "[01] given(g_1) -> right(a_CAB)
[02] given(g_2) -> right(a_FDE)
[03] def_con_right(1,2) -> con_ang(a_ABC,a_FDE)".

Definition perp_con_ang_source := transitive_header "tri: t_ABD t_CBD
"
  "[g_1] perp(BD,AC,D)
"
  "con_right(a_ADB,a_BDC)"
  "[01] given(g_1) -> perp(BD,AC,D)
[02] perp_con_ang(1) -> con_right(a_ADB,a_BDC)".

(** Both concluded angles must have the foot of the perpendicular as vertex. *)
Definition perp_con_ang_wrong_vertex_source := transitive_header "tri: t_ABD t_CBD
"
  "[g_1] perp(BD,AC,D)
"
  "con_right(a_ADB,a_ABD)"
  "[01] given(g_1) -> perp(BD,AC,D)
[02] perp_con_ang(1) -> con_right(a_ADB,a_ABD)".

(** Each ray must reach one of the two perpendicular segments. *)
Definition perp_con_ang_foreign_ray_source := transitive_header "tri: t_ABD t_CBD
"
  "[g_1] perp(BD,AC,D)
"
  "con_right(a_ADB,a_EDB)"
  "[01] given(g_1) -> perp(BD,AC,D)
[02] perp_con_ang(1) -> con_right(a_ADB,a_EDB)".

(** Perpendicularity alone does not supply nondegenerate rays, but declared
    triangles spanning both angles do. *)
Definition perp_con_ang_con_ang_source := transitive_header "tri: t_ABD t_CBD
"
  "[g_1] perp(BD,AC,D)
"
  "con_ang(a_ADB,a_BDC)"
  "[01] given(g_1) -> perp(BD,AC,D)
[02] perp_con_ang(1) -> con_ang(a_ADB,a_BDC)".

(** Without a declared triangle to span them, the rays may be degenerate and
    the angle-congruence conclusion stays fail-closed. *)
Definition perp_con_ang_con_ang_undeclared_source := transitive_header "seg: AC
"
  "[g_1] perp(BD,AC,D)
"
  "con_ang(a_ADB,a_BDC)"
  "[01] given(g_1) -> perp(BD,AC,D)
[02] perp_con_ang(1) -> con_ang(a_ADB,a_BDC)".

Example def_con_right_accepts : complete_checker def_con_right_source = true.
Proof. vm_compute. reflexivity. Qed.
Example def_con_right_con_right_accepts :
  complete_checker def_con_right_con_right_source = true.
Proof. vm_compute. reflexivity. Qed.
Example def_con_right_other_angle_rejects :
  complete_checker def_con_right_other_angle_source = false.
Proof. vm_compute. reflexivity. Qed.
Example perp_con_ang_accepts : complete_checker perp_con_ang_source = true.
Proof. vm_compute. reflexivity. Qed.
Example perp_con_ang_wrong_vertex_rejects :
  complete_checker perp_con_ang_wrong_vertex_source = false.
Proof. vm_compute. reflexivity. Qed.
Example perp_con_ang_foreign_ray_rejects :
  complete_checker perp_con_ang_foreign_ray_source = false.
Proof. vm_compute. reflexivity. Qed.
Example perp_con_ang_con_ang_accepts :
  complete_checker perp_con_ang_con_ang_source = true.
Proof. vm_compute. reflexivity. Qed.
Example perp_con_ang_con_ang_undeclared_rejects :
  complete_checker perp_con_ang_con_ang_undeclared_source = false.
Proof. vm_compute. reflexivity. Qed.

(** A triangle criterion may consume a right-angle pair where it expects an
    angle congruence, may name a declared triangle by any permutation of its
    vertices, may reverse an angle name, and may use the reversed vertex
    correspondence. *)
Definition right_angle_criterion_source := transitive_header "tri: t_ABC t_ABD
"
  "[g_1] perp(CD,AB,B)
[g_2] con_ang(a_CAB,a_DAB)
"
  "con_tri(t_CBA,t_DBA)"
  "[01] given(g_1) -> perp(CD,AB,B)
[02] given(g_2) -> con_ang(a_CAB,a_DAB)
[03] perp_con_ang(1) -> con_right(a_ABC,a_ABD)
[04] reflex() -> ref_seg(AB,AB)
[05] asa(2,4,3) -> con_tri(t_CBA,t_DBA)".

(** An undeclared triangle is never noncollinear by assumption. *)
Definition undeclared_triangle_source := transitive_header "tri: t_ABC
"
  "[g_1] perp(CD,AB,B)
[g_2] con_ang(a_CAB,a_DAB)
"
  "con_tri(t_CBA,t_DBA)"
  "[01] given(g_1) -> perp(CD,AB,B)
[02] given(g_2) -> con_ang(a_CAB,a_DAB)
[03] perp_con_ang(1) -> con_right(a_ABC,a_ABD)
[04] reflex() -> ref_seg(AB,AB)
[05] asa(2,4,3) -> con_tri(t_CBA,t_DBA)".

(** The right angles must correspond the way the criterion needs them. *)
Definition mismatched_right_angle_source := transitive_header "tri: t_ABC t_ABD
"
  "[g_1] perp(CD,AB,B)
[g_2] con_ang(a_CAB,a_DAB)
"
  "con_tri(t_CBA,t_DBA)"
  "[01] given(g_1) -> perp(CD,AB,B)
[02] given(g_2) -> con_ang(a_CAB,a_DAB)
[03] perp_con_ang(1) -> con_right(a_ABD,a_ABC)
[04] reflex() -> ref_seg(AB,AB)
[05] asa(2,4,3) -> con_tri(t_CBA,t_DBA)".

Example right_angle_criterion_accepts :
  complete_checker right_angle_criterion_source = true.
Proof. vm_compute. reflexivity. Qed.
Example undeclared_triangle_rejects :
  complete_checker undeclared_triangle_source = false.
Proof. vm_compute. reflexivity. Qed.
Example mismatched_right_angle_rejects :
  complete_checker mismatched_right_angle_source = false.
Proof. vm_compute. reflexivity. Qed.

(** A midpoint halves its segment; the halves must be the two it defines. *)
Definition def_midpt_source := transitive_header "seg: AC
"
  "[g_1] midpt(AC,B)
"
  "con_seg(AB,BC)"
  "[01] given(g_1) -> midpt(AC,B)
[02] def_midpt(1) -> con_seg(AB,BC)".

Definition def_midpt_reversed_source := transitive_header "seg: AC
"
  "[g_1] midpt(CA,B)
"
  "con_seg(CB,BA)"
  "[01] given(g_1) -> midpt(CA,B)
[02] def_midpt(1) -> con_seg(CB,BA)".

Definition def_midpt_other_segment_source := transitive_header "seg: AC
"
  "[g_1] midpt(AC,B)
"
  "con_seg(AB,BD)"
  "[01] given(g_1) -> midpt(AC,B)
[02] def_midpt(1) -> con_seg(AB,BD)".

(** A midpoint goal is only reached by a rule that actually produces one. *)
Definition midpt_goal_source := transitive_header "seg: AC
"
  "[g_1] midpt(AC,B)
"
  "midpt(AC,B)"
  "[01] given(g_1) -> midpt(AC,B)".

Example def_midpt_accepts : complete_checker def_midpt_source = true.
Proof. vm_compute. reflexivity. Qed.
Example def_midpt_reversed_accepts :
  complete_checker def_midpt_reversed_source = true.
Proof. vm_compute. reflexivity. Qed.
Example def_midpt_other_segment_rejects :
  complete_checker def_midpt_other_segment_source = false.
Proof. vm_compute. reflexivity. Qed.
Example midpt_goal_accepts : complete_checker midpt_goal_source = true.
Proof. vm_compute. reflexivity. Qed.

(** Vertical angles, taken from the diagram premise rather than a step. *)
Definition vert_ang_source := transitive_header "tri: t_ACE t_BDE
"
  "[d_01] intersect_seg(AB,CD,E)
"
  "con_ang(a_CEA,a_DEB)"
  "[01] vert_ang() -> con_ang(a_CEA,a_DEB)".

(** The other opposite pair is equally valid. *)
Definition vert_ang_other_pair_source := transitive_header "tri: t_ADE t_BCE
"
  "[d_01] intersect_seg(AB,CD,E)
"
  "con_ang(a_AED,a_BEC)"
  "[01] vert_ang() -> con_ang(a_AED,a_BEC)".

(** Adjacent angles at the crossing are not vertical angles. *)
Definition vert_ang_adjacent_source := transitive_header "tri: t_ACE t_BDE
"
  "[d_01] intersect_seg(AB,CD,E)
"
  "con_ang(a_CEA,a_CEB)"
  "[01] vert_ang() -> con_ang(a_CEA,a_CEB)".

(** Without declared triangles the rays may be degenerate. *)
Definition vert_ang_undeclared_source := transitive_header "seg: AB
"
  "[d_01] intersect_seg(AB,CD,E)
"
  "con_ang(a_CEA,a_DEB)"
  "[01] vert_ang() -> con_ang(a_CEA,a_DEB)".

(** No crossing in the diagram means no vertical angles. *)
Definition vert_ang_no_crossing_source := transitive_header "tri: t_ACE t_BDE
"
  "[g_1] con_seg(AB,CD)
"
  "con_ang(a_CEA,a_DEB)"
  "[01] vert_ang() -> con_ang(a_CEA,a_DEB)".

Example vert_ang_accepts : complete_checker vert_ang_source = true.
Proof. vm_compute. reflexivity. Qed.
Example vert_ang_other_pair_accepts :
  complete_checker vert_ang_other_pair_source = true.
Proof. vm_compute. reflexivity. Qed.
Example vert_ang_adjacent_rejects :
  complete_checker vert_ang_adjacent_source = false.
Proof. vm_compute. reflexivity. Qed.
Example vert_ang_undeclared_rejects :
  complete_checker vert_ang_undeclared_source = false.
Proof. vm_compute. reflexivity. Qed.
Example vert_ang_no_crossing_rejects :
  complete_checker vert_ang_no_crossing_source = false.
Proof. vm_compute. reflexivity. Qed.

(** An angle bisector halves its angle. *)
Definition def_ang_bisect_source := transitive_header "ang: a_ABC
"
  "[g_1] ang_bisect(a_ABC,BD)
"
  "con_ang(a_ABD,a_DBC)"
  "[01] given(g_1) -> ang_bisect(a_ABC,BD)
[02] def_ang_bisect(1) -> con_ang(a_ABD,a_DBC)".

(** The ray may be written with the vertex second. *)
Definition def_ang_bisect_reversed_source := transitive_header "ang: a_ABC
"
  "[g_1] ang_bisect(a_ABC,DB)
"
  "con_ang(a_ABD,a_DBC)"
  "[01] given(g_1) -> ang_bisect(a_ABC,DB)
[02] def_ang_bisect(1) -> con_ang(a_ABD,a_DBC)".

(** The halves must be the ones the bisector actually defines. *)
Definition def_ang_bisect_wrong_halves_source := transitive_header "ang: a_ABC
"
  "[g_1] ang_bisect(a_ABC,BD)
"
  "con_ang(a_ABD,a_DBE)"
  "[01] given(g_1) -> ang_bisect(a_ABC,BD)
[02] def_ang_bisect(1) -> con_ang(a_ABD,a_DBE)".

(** A ray that misses the vertex bisects nothing. *)
Definition def_ang_bisect_detached_source := transitive_header "ang: a_ABC
"
  "[g_1] ang_bisect(a_ABC,DE)
"
  "con_ang(a_ABD,a_DBC)"
  "[01] given(g_1) -> ang_bisect(a_ABC,DE)
[02] def_ang_bisect(1) -> con_ang(a_ABD,a_DBC)".

Example def_ang_bisect_accepts : complete_checker def_ang_bisect_source = true.
Proof. vm_compute. reflexivity. Qed.
Example def_ang_bisect_reversed_accepts :
  complete_checker def_ang_bisect_reversed_source = true.
Proof. vm_compute. reflexivity. Qed.
Example def_ang_bisect_wrong_halves_rejects :
  complete_checker def_ang_bisect_wrong_halves_source = false.
Proof. vm_compute. reflexivity. Qed.
Example def_ang_bisect_detached_rejects :
  complete_checker def_ang_bisect_detached_source = false.
Proof. vm_compute. reflexivity. Qed.

(** The converse accepts only the ray syntactically shared by the two
    congruent halves of the concluded outer angle. *)
Definition ang_bisect_conv_source := transitive_header "ang: a_ABC a_ABD a_DBC
"
  "[g_1] con_ang(a_ABD,a_DBC)
"
  "ang_bisect(a_ABC,BD)"
  "[01] given(g_1) -> con_ang(a_ABD,a_DBC)
[02] ang_bisect_conv(1) -> ang_bisect(a_ABC,BD)".

Definition ang_bisect_conv_reversed_source := transitive_header
  "ang: a_ABC a_ABD a_DBC
"
  "[g_1] con_ang(a_ABD,a_DBC)
"
  "ang_bisect(a_ABC,DB)"
  "[01] given(g_1) -> con_ang(a_ABD,a_DBC)
[02] ang_bisect_conv(1) -> ang_bisect(a_ABC,DB)".

(** A different segment cannot be inferred from the congruence. *)
Definition ang_bisect_conv_wrong_ray_source := transitive_header
  "ang: a_ABC a_ABD a_DBC
"
  "[g_1] con_ang(a_ABD,a_DBC)
"
  "ang_bisect(a_ABC,BE)"
  "[01] given(g_1) -> con_ang(a_ABD,a_DBC)
[02] ang_bisect_conv(1) -> ang_bisect(a_ABC,BE)".

(** Nor can congruent angles that do not form the named halves establish a
    bisector. *)
Definition ang_bisect_conv_unrelated_source := transitive_header
  "ang: a_ABC a_EFG a_HIJ
"
  "[g_1] con_ang(a_EFG,a_HIJ)
"
  "ang_bisect(a_ABC,BD)"
  "[01] given(g_1) -> con_ang(a_EFG,a_HIJ)
[02] ang_bisect_conv(1) -> ang_bisect(a_ABC,BD)".

Example ang_bisect_conv_accepts :
  complete_checker ang_bisect_conv_source = true.
Proof. vm_compute. reflexivity. Qed.
Example ang_bisect_conv_reversed_accepts :
  complete_checker ang_bisect_conv_reversed_source = true.
Proof. vm_compute. reflexivity. Qed.
Example ang_bisect_conv_wrong_ray_rejects :
  complete_checker ang_bisect_conv_wrong_ray_source = false.
Proof. vm_compute. reflexivity. Qed.
Example ang_bisect_conv_unrelated_rejects :
  complete_checker ang_bisect_conv_unrelated_source = false.
Proof. vm_compute. reflexivity. Qed.

(** Right-hypotenuse-leg, in both of the dependency orders the corpus uses. *)
Definition rhl_hypotenuse_first_source := transitive_header "tri: t_KLM t_MNK
"
  "[g_1] con_right(a_KLM,a_MNK)
[g_2] con_seg(LM,NK)
"
  "con_tri(t_KLM,t_MNK)"
  "[01] given(g_1) -> con_right(a_KLM,a_MNK)
[02] given(g_2) -> con_seg(LM,NK)
[03] reflex() -> ref_seg(MK,MK)
[04] rhl(1,3,2) -> con_tri(t_KLM,t_MNK)".

Definition rhl_leg_first_source := transitive_header "tri: t_KLM t_MNK
"
  "[g_1] con_right(a_KLM,a_MNK)
[g_2] con_seg(LM,NK)
"
  "con_tri(t_KLM,t_MNK)"
  "[01] given(g_1) -> con_right(a_KLM,a_MNK)
[02] given(g_2) -> con_seg(LM,NK)
[03] reflex() -> ref_seg(MK,MK)
[04] rhl(1,2,3) -> con_tri(t_KLM,t_MNK)".

(** Two legs are not a hypotenuse and a leg. *)
Definition rhl_two_legs_source := transitive_header "tri: t_KLM t_MNK
"
  "[g_1] con_right(a_KLM,a_MNK)
[g_2] con_seg(LM,NK)
[g_3] con_seg(KL,MN)
"
  "con_tri(t_KLM,t_MNK)"
  "[01] given(g_1) -> con_right(a_KLM,a_MNK)
[02] given(g_2) -> con_seg(LM,NK)
[03] given(g_3) -> con_seg(KL,MN)
[04] rhl(1,2,3) -> con_tri(t_KLM,t_MNK)".

(** The cited angles must be the ones at the corresponding vertices. *)
Definition rhl_wrong_vertex_source := transitive_header "tri: t_KLM t_MNK
"
  "[g_1] con_right(a_LMK,a_MNK)
[g_2] con_seg(LM,NK)
"
  "con_tri(t_KLM,t_MNK)"
  "[01] given(g_1) -> con_right(a_LMK,a_MNK)
[02] given(g_2) -> con_seg(LM,NK)
[03] reflex() -> ref_seg(MK,MK)
[04] rhl(1,3,2) -> con_tri(t_KLM,t_MNK)".

Example rhl_hypotenuse_first_accepts :
  complete_checker rhl_hypotenuse_first_source = true.
Proof. vm_compute. reflexivity. Qed.
Example rhl_leg_first_accepts : complete_checker rhl_leg_first_source = true.
Proof. vm_compute. reflexivity. Qed.
Example rhl_two_legs_rejects : complete_checker rhl_two_legs_source = false.
Proof. vm_compute. reflexivity. Qed.
Example rhl_wrong_vertex_rejects :
  complete_checker rhl_wrong_vertex_source = false.
Proof. vm_compute. reflexivity. Qed.

(** Converse of the midpoint definition: congruent halves plus an [on_line]
    diagram premise. *)
Definition midpt_conv_source := transitive_header "seg: AC
"
  "[d_01] on_line(AC,B)
[g_1] con_seg(AB,BC)
"
  "midpt(AC,B)"
  "[01] given(g_1) -> con_seg(AB,BC)
[02] midpt_conv(1) -> midpt(AC,B)".

(** Congruent halves alone place no point between the endpoints. *)
Definition midpt_conv_no_line_source := transitive_header "seg: AC
"
  "[g_1] con_seg(AB,BC)
"
  "midpt(AC,B)"
  "[01] given(g_1) -> con_seg(AB,BC)
[02] midpt_conv(1) -> midpt(AC,B)".

(** The collinear point must be the one the conclusion names. *)
Definition midpt_conv_other_point_source := transitive_header "seg: AC
"
  "[d_01] on_line(AC,D)
[g_1] con_seg(AB,BC)
"
  "midpt(AC,B)"
  "[01] given(g_1) -> con_seg(AB,BC)
[02] midpt_conv(1) -> midpt(AC,B)".

(** The cited congruence must be of the two halves. *)
Definition midpt_conv_wrong_halves_source := transitive_header "seg: AC
"
  "[d_01] on_line(AC,B)
[g_1] con_seg(AB,BD)
"
  "midpt(AC,B)"
  "[01] given(g_1) -> con_seg(AB,BD)
[02] midpt_conv(1) -> midpt(AC,B)".

Example midpt_conv_accepts : complete_checker midpt_conv_source = true.
Proof. vm_compute. reflexivity. Qed.
Example midpt_conv_no_line_rejects :
  complete_checker midpt_conv_no_line_source = false.
Proof. vm_compute. reflexivity. Qed.
Example midpt_conv_other_point_rejects :
  complete_checker midpt_conv_other_point_source = false.
Proof. vm_compute. reflexivity. Qed.
Example midpt_conv_wrong_halves_rejects :
  complete_checker midpt_conv_wrong_halves_source = false.
Proof. vm_compute. reflexivity. Qed.

(** Two angles of a triangle determine the third.  This is the only
    implemented rule that needs the parallel postulate. *)
Definition third_angle_source := transitive_header "tri: t_ABC t_DEF
"
  "[g_1] con_ang(a_BAC,a_EDF)
[g_2] con_ang(a_ABC,a_DEF)
"
  "con_ang(a_BCA,a_EFD)"
  "[01] given(g_1) -> con_ang(a_BAC,a_EDF)
[02] given(g_2) -> con_ang(a_ABC,a_DEF)
[03] third_angle(1,2) -> con_ang(a_BCA,a_EFD)".

(** The rule needs both triangles to be declared; otherwise they may be
    degenerate and have no angle sum. *)
Definition third_angle_undeclared_source := transitive_header "tri: t_ABC
"
  "[g_1] con_ang(a_BAC,a_EDF)
[g_2] con_ang(a_ABC,a_DEF)
"
  "con_ang(a_BCA,a_EFD)"
  "[01] given(g_1) -> con_ang(a_BAC,a_EDF)
[02] given(g_2) -> con_ang(a_ABC,a_DEF)
[03] third_angle(1,2) -> con_ang(a_BCA,a_EFD)".

(** The concluded pair must be the remaining vertices. *)
Definition third_angle_wrong_pair_source := transitive_header "tri: t_ABC t_DEF
"
  "[g_1] con_ang(a_BAC,a_EDF)
[g_2] con_ang(a_ABC,a_DEF)
"
  "con_ang(a_BCA,a_DEF)"
  "[01] given(g_1) -> con_ang(a_BAC,a_EDF)
[02] given(g_2) -> con_ang(a_ABC,a_DEF)
[03] third_angle(1,2) -> con_ang(a_BCA,a_DEF)".

(** Two angles of the same triangle prove nothing about another. *)
Definition third_angle_same_vertex_source := transitive_header "tri: t_ABC t_DEF
"
  "[g_1] con_ang(a_BAC,a_EDF)
"
  "con_ang(a_BCA,a_EFD)"
  "[01] given(g_1) -> con_ang(a_BAC,a_EDF)
[02] third_angle(1,1) -> con_ang(a_BCA,a_EFD)".

Example third_angle_accepts : complete_checker third_angle_source = true.
Proof. vm_compute. reflexivity. Qed.
Example third_angle_undeclared_rejects :
  complete_checker third_angle_undeclared_source = false.
Proof. vm_compute. reflexivity. Qed.
Example third_angle_wrong_pair_rejects :
  complete_checker third_angle_wrong_pair_source = false.
Proof. vm_compute. reflexivity. Qed.
Example third_angle_same_vertex_rejects :
  complete_checker third_angle_same_vertex_source = false.
Proof. vm_compute. reflexivity. Qed.

(** Triangle shape statements and the reasons that produce or consume them. *)
Definition shape_header (premises goal steps : string) : string :=
  transitive_header "tri: t_ABC
" premises goal steps.

Definition def_isosceles_source := shape_header
  "[g_1] con_seg(AB,BC)
"
  "isosceles(t_ABC)"
  "[01] given(g_1) -> con_seg(AB,BC)
[02] def_isosceles(1) -> isosceles(t_ABC)".

(** A congruence between sides of two different triangles proves nothing about
    the shape of this one. *)
Definition def_isosceles_foreign_side_source := shape_header
  "[g_1] con_seg(AB,DE)
"
  "isosceles(t_ABC)"
  "[01] given(g_1) -> con_seg(AB,DE)
[02] def_isosceles(1) -> isosceles(t_ABC)".

Definition base_angle_source := shape_header
  "[g_1] con_seg(AB,AC)
"
  "con_ang(a_ABC,a_ACB)"
  "[01] given(g_1) -> con_seg(AB,AC)
[02] base_angle(1) -> con_ang(a_ABC,a_ACB)".

(** The two sides must share the apex. *)
Definition base_angle_no_apex_source := shape_header
  "[g_1] con_seg(AB,BC)
"
  "con_ang(a_ABC,a_ACB)"
  "[01] given(g_1) -> con_seg(AB,BC)
[02] base_angle(1) -> con_ang(a_ABC,a_ACB)".

Definition base_angle_conv_source := shape_header
  "[g_1] con_ang(a_ABC,a_ACB)
"
  "con_seg(AB,AC)"
  "[01] given(g_1) -> con_ang(a_ABC,a_ACB)
[02] base_angle_conv(1) -> con_seg(AB,AC)".

Definition def_equilateral_source := shape_header
  "[g_1] con_seg(AB,BC)
[g_2] con_seg(BC,AC)
"
  "equilateral(t_ABC)"
  "[01] given(g_1) -> con_seg(AB,BC)
[02] given(g_2) -> con_seg(BC,AC)
[03] con_seg_transitive(1,2) -> con_seg(AC,AB)
[04] def_equilateral(1,2,3) -> equilateral(t_ABC)".

Definition def_equiangular_source := shape_header
  "[g_1] con_ang(a_BAC,a_ABC)
[g_2] con_ang(a_ABC,a_ACB)
"
  "equiangular(t_ABC)"
  "[01] given(g_1) -> con_ang(a_BAC,a_ABC)
[02] given(g_2) -> con_ang(a_ABC,a_ACB)
[03] con_ang_transitive(1,2) -> con_ang(a_ACB,a_BAC)
[04] def_equiangular(1,2,3) -> equiangular(t_ABC)".

Definition equilat_equiang_source := shape_header
  "[g_1] equilateral(t_ABC)
"
  "equiangular(t_ABC)"
  "[01] given(g_1) -> equilateral(t_ABC)
[02] equilat_equiang(1) -> equiangular(t_ABC)".

Definition equiang_equilat_source := shape_header
  "[g_1] equiangular(t_ABC)
"
  "equilateral(t_ABC)"
  "[01] given(g_1) -> equiangular(t_ABC)
[02] equiang_equilat(1) -> equilateral(t_ABC)".

(** The conclusion must be about the triangle the dependency is about. *)
Definition equilat_equiang_other_triangle_source := transitive_header
  "tri: t_ABC t_DEF
"
  "[g_1] equilateral(t_ABC)
"
  "equiangular(t_DEF)"
  "[01] given(g_1) -> equilateral(t_ABC)
[02] equilat_equiang(1) -> equiangular(t_DEF)".

Definition def_con_tri_source := transitive_header "tri: t_ABC t_DEF
"
  "[g_1] con_seg(AB,DE)
[g_2] con_seg(BC,EF)
[g_3] con_seg(AC,DF)
[g_4] con_ang(a_BAC,a_EDF)
[g_5] con_ang(a_ABC,a_DEF)
[g_6] con_ang(a_ACB,a_DFE)
"
  "con_tri(t_ABC,t_DEF)"
  "[01] given(g_1) -> con_seg(AB,DE)
[02] given(g_2) -> con_seg(BC,EF)
[03] given(g_3) -> con_seg(AC,DF)
[04] given(g_4) -> con_ang(a_BAC,a_EDF)
[05] given(g_5) -> con_ang(a_ABC,a_DEF)
[06] given(g_6) -> con_ang(a_ACB,a_DFE)
[07] def_con_tri(1,2,3,4,5,6) -> con_tri(t_ABC,t_DEF)".

(** One mismatched part is enough to refuse the congruence. *)
Definition def_con_tri_wrong_part_source := transitive_header "tri: t_ABC t_DEF
"
  "[g_1] con_seg(AB,DE)
[g_2] con_seg(BC,EF)
[g_3] con_seg(AC,DF)
[g_4] con_ang(a_BAC,a_EDF)
[g_5] con_ang(a_ABC,a_DEF)
[g_6] con_ang(a_ACB,a_DEF)
"
  "con_tri(t_ABC,t_DEF)"
  "[01] given(g_1) -> con_seg(AB,DE)
[02] given(g_2) -> con_seg(BC,EF)
[03] given(g_3) -> con_seg(AC,DF)
[04] given(g_4) -> con_ang(a_BAC,a_EDF)
[05] given(g_5) -> con_ang(a_ABC,a_DEF)
[06] given(g_6) -> con_ang(a_ACB,a_DEF)
[07] def_con_tri(1,2,3,4,5,6) -> con_tri(t_ABC,t_DEF)".

Example def_isosceles_accepts : complete_checker def_isosceles_source = true.
Proof. vm_compute. reflexivity. Qed.
Example def_isosceles_foreign_side_rejects :
  complete_checker def_isosceles_foreign_side_source = false.
Proof. vm_compute. reflexivity. Qed.
Example base_angle_accepts : complete_checker base_angle_source = true.
Proof. vm_compute. reflexivity. Qed.
Example base_angle_no_apex_rejects :
  complete_checker base_angle_no_apex_source = false.
Proof. vm_compute. reflexivity. Qed.
Example base_angle_conv_accepts :
  complete_checker base_angle_conv_source = true.
Proof. vm_compute. reflexivity. Qed.
Example def_equilateral_accepts :
  complete_checker def_equilateral_source = true.
Proof. vm_compute. reflexivity. Qed.
Example def_equiangular_accepts :
  complete_checker def_equiangular_source = true.
Proof. vm_compute. reflexivity. Qed.
Example equilat_equiang_accepts :
  complete_checker equilat_equiang_source = true.
Proof. vm_compute. reflexivity. Qed.
Example equiang_equilat_accepts :
  complete_checker equiang_equilat_source = true.
Proof. vm_compute. reflexivity. Qed.
Example equilat_equiang_other_triangle_rejects :
  complete_checker equilat_equiang_other_triangle_source = false.
Proof. vm_compute. reflexivity. Qed.
Example def_con_tri_accepts : complete_checker def_con_tri_source = true.
Proof. vm_compute. reflexivity. Qed.
Example def_con_tri_wrong_part_rejects :
  complete_checker def_con_tri_wrong_part_source = false.
Proof. vm_compute. reflexivity. Qed.

(** Supplements of congruent angles, and of the same angle. *)
Definition con_supplements_source := transitive_header "ang: a_ACD a_DCB a_EGH a_HGF
"
  "[g_1] supplementary(a_ACD,a_DCB)
[g_2] supplementary(a_EGH,a_HGF)
[g_3] con_ang(a_DCB,a_HGF)
"
  "con_ang(a_ACD,a_EGH)"
  "[01] given(g_1) -> supplementary(a_ACD,a_DCB)
[02] given(g_2) -> supplementary(a_EGH,a_HGF)
[03] given(g_3) -> con_ang(a_DCB,a_HGF)
[04] con_supplements(1,2,3) -> con_ang(a_ACD,a_EGH)".

(** Without the congruence of the two supplements nothing follows. *)
Definition con_supplements_unrelated_source :=
  transitive_header "ang: a_ACD a_DCB a_EGH a_HGF
"
  "[g_1] supplementary(a_ACD,a_DCB)
[g_2] supplementary(a_EGH,a_HGF)
[g_3] con_ang(a_ACD,a_HGF)
"
  "con_ang(a_ACD,a_EGH)"
  "[01] given(g_1) -> supplementary(a_ACD,a_DCB)
[02] given(g_2) -> supplementary(a_EGH,a_HGF)
[03] given(g_3) -> con_ang(a_ACD,a_HGF)
[04] con_supplements(1,2,3) -> con_ang(a_ACD,a_EGH)".

Definition con_supplements_same_source := transitive_header "ang: a_ACD a_DCB a_ACE
"
  "[g_1] supplementary(a_ACD,a_DCB)
[g_2] supplementary(a_ACE,a_DCB)
"
  "con_ang(a_ACD,a_ACE)"
  "[01] given(g_1) -> supplementary(a_ACD,a_DCB)
[02] given(g_2) -> supplementary(a_ACE,a_DCB)
[03] con_supplements_same(1,2) -> con_ang(a_ACD,a_ACE)".

(** The shared supplement really has to be shared. *)
Definition con_supplements_same_unshared_source :=
  transitive_header "ang: a_ACD a_DCB a_ACE a_ECB
"
  "[g_1] supplementary(a_ACD,a_DCB)
[g_2] supplementary(a_ACE,a_ECB)
"
  "con_ang(a_ACD,a_ACE)"
  "[01] given(g_1) -> supplementary(a_ACD,a_DCB)
[02] given(g_2) -> supplementary(a_ACE,a_ECB)
[03] con_supplements_same(1,2) -> con_ang(a_ACD,a_ACE)".

Example con_supplements_accepts :
  complete_checker con_supplements_source = true.
Proof. vm_compute. reflexivity. Qed.
Example con_supplements_unrelated_rejects :
  complete_checker con_supplements_unrelated_source = false.
Proof. vm_compute. reflexivity. Qed.
(** The shared supplement may sit in the first slot of the second dependency,
    which is how the textbook corpus chains them. *)
Definition con_supplements_same_chained_source :=
  transitive_header "ang: a_ACD a_DCB a_ACE
"
  "[g_1] supplementary(a_ACD,a_DCB)
[g_2] supplementary(a_DCB,a_ACE)
"
  "con_ang(a_ACD,a_ACE)"
  "[01] given(g_1) -> supplementary(a_ACD,a_DCB)
[02] given(g_2) -> supplementary(a_DCB,a_ACE)
[03] con_supplements_same(1,2) -> con_ang(a_ACD,a_ACE)".

Example con_supplements_same_chained_accepts :
  complete_checker con_supplements_same_chained_source = true.
Proof. vm_compute. reflexivity. Qed.
Example con_supplements_same_accepts :
  complete_checker con_supplements_same_source = true.
Proof. vm_compute. reflexivity. Qed.
Example con_supplements_same_unshared_rejects :
  complete_checker con_supplements_same_unshared_source = false.
Proof. vm_compute. reflexivity. Qed.

(** A syntactic linear pair is supplementary; another pair cannot be mixed
    into the conclusion. *)
Definition def_linear_pair_source := transitive_header "ang: a_ACD a_DCB
"
  "[g_1] linear_pair(a_ACD,a_DCB)
"
  "supplementary(a_ACD,a_DCB)"
  "[01] given(g_1) -> linear_pair(a_ACD,a_DCB)
[02] def_linear_pair(1) -> supplementary(a_ACD,a_DCB)".

Definition def_linear_pair_mixed_source := transitive_header
  "ang: a_ACD a_DCB a_ECB
"
  "[g_1] linear_pair(a_ACD,a_DCB)
"
  "supplementary(a_ACD,a_ECB)"
  "[01] given(g_1) -> linear_pair(a_ACD,a_DCB)
[02] def_linear_pair(1) -> supplementary(a_ACD,a_ECB)".

Example def_linear_pair_accepts :
  complete_checker def_linear_pair_source = true.
Proof. vm_compute. reflexivity. Qed.
Example def_linear_pair_mixed_rejects :
  complete_checker def_linear_pair_mixed_source = false.
Proof. vm_compute. reflexivity. Qed.

(** A parallelogram exposes exactly its two pairs of opposite corners. *)
Definition pgram_opp_angles_source := transitive_header "quad: q_ABCD
"
  "[g_1] parallelogram(q_ABCD)
"
  "con_ang(a_ABC,a_CDA)"
  "[01] given(g_1) -> parallelogram(q_ABCD)
[02] pgram_opp_angs(1) -> con_ang(a_ABC,a_CDA)".

Definition pgram_consecutive_angles_source := transitive_header "quad: q_ABCD
"
  "[g_1] parallelogram(q_ABCD)
"
  "con_ang(a_ABC,a_BCD)"
  "[01] given(g_1) -> parallelogram(q_ABCD)
[02] pgram_opp_angs(1) -> con_ang(a_ABC,a_BCD)".

Example pgram_opp_angles_accepts :
  complete_checker pgram_opp_angles_source = true.
Proof. vm_compute. reflexivity. Qed.
Example pgram_consecutive_angles_rejects :
  complete_checker pgram_consecutive_angles_source = false.
Proof. vm_compute. reflexivity. Qed.

(** A rhombus exposes every pair from its four-side congruence chain. *)
Definition rhombus_def_source := transitive_header "quad: q_ABCD
"
  "[g_1] rhombus(q_ABCD)
"
  "con_seg(AB,DA)"
  "[01] given(g_1) -> rhombus(q_ABCD)
[02] rhombus(1) -> con_seg(AB,DA)".

Definition rhombus_def_diagonal_source := transitive_header "quad: q_ABCD
"
  "[g_1] rhombus(q_ABCD)
"
  "con_seg(AB,AC)"
  "[01] given(g_1) -> rhombus(q_ABCD)
[02] rhombus(1) -> con_seg(AB,AC)".

Example rhombus_def_accepts : complete_checker rhombus_def_source = true.
Proof. vm_compute. reflexivity. Qed.
Example rhombus_def_diagonal_rejects :
  complete_checker rhombus_def_diagonal_source = false.
Proof. vm_compute. reflexivity. Qed.

(** Either diagonal of a rhombus bisects the two corners it runs between; a
    side is not a diagonal, and a diagonal says nothing about the corners it
    misses. *)
Definition rhombus_opp_bisect_source := transitive_header "quad: q_ABCD
"
  "[g_1] rhombus(q_ABCD)
"
  "ang_bisect(a_DAB,AC)"
  "[01] given(g_1) -> rhombus(q_ABCD)
[02] rhombus_opp_bisect(1) -> ang_bisect(a_DAB,AC)".

Definition rhombus_opp_bisect_far_corner_source := transitive_header "quad: q_ABCD
"
  "[g_1] rhombus(q_ABCD)
"
  "ang_bisect(a_ABC,AC)"
  "[01] given(g_1) -> rhombus(q_ABCD)
[02] rhombus_opp_bisect(1) -> ang_bisect(a_ABC,AC)".

Definition rhombus_opp_bisect_side_source := transitive_header "quad: q_ABCD
"
  "[g_1] rhombus(q_ABCD)
"
  "ang_bisect(a_DAB,AB)"
  "[01] given(g_1) -> rhombus(q_ABCD)
[02] rhombus_opp_bisect(1) -> ang_bisect(a_DAB,AB)".

Example rhombus_opp_bisect_accepts :
  complete_checker rhombus_opp_bisect_source = true.
Proof. vm_compute. reflexivity. Qed.
Example rhombus_opp_bisect_far_corner_rejects :
  complete_checker rhombus_opp_bisect_far_corner_source = false.
Proof. vm_compute. reflexivity. Qed.
Example rhombus_opp_bisect_side_rejects :
  complete_checker rhombus_opp_bisect_side_source = false.
Proof. vm_compute. reflexivity. Qed.

(** A rectangle's two diagonals are congruent; its opposite sides are too,
    but that is not what this reason concludes. *)
Definition rect_diag_con_source := transitive_header "quad: q_ABCD
"
  "[g_1] rectangle(q_ABCD)
"
  "con_seg(AC,BD)"
  "[01] given(g_1) -> rectangle(q_ABCD)
[02] rect_diag_con(1) -> con_seg(AC,BD)".

Definition rect_diag_con_sides_source := transitive_header "quad: q_ABCD
"
  "[g_1] rectangle(q_ABCD)
"
  "con_seg(AB,CD)"
  "[01] given(g_1) -> rectangle(q_ABCD)
[02] rect_diag_con(1) -> con_seg(AB,CD)".

(** Complements of congruent angles are congruent, and so are two complements
    of the same angle; a shared angle is what the second rule needs. *)
Definition con_complements_source := transitive_header "ang: a_ABC a_CBD a_EFG a_GFH
"
  "[g_1] complementary(a_ABC,a_CBD)
[g_2] complementary(a_EFG,a_GFH)
[g_3] con_ang(a_CBD,a_GFH)
"
  "con_ang(a_ABC,a_EFG)"
  "[01] given(g_1) -> complementary(a_ABC,a_CBD)
[02] given(g_2) -> complementary(a_EFG,a_GFH)
[03] given(g_3) -> con_ang(a_CBD,a_GFH)
[04] con_complements(1,2,3) -> con_ang(a_ABC,a_EFG)".

Definition con_complements_same_source := transitive_header "ang: a_ABC a_CBD a_DBE
"
  "[g_1] complementary(a_ABC,a_CBD)
[g_2] complementary(a_DBE,a_CBD)
"
  "con_ang(a_ABC,a_DBE)"
  "[01] given(g_1) -> complementary(a_ABC,a_CBD)
[02] given(g_2) -> complementary(a_DBE,a_CBD)
[03] con_complements_same(1,2) -> con_ang(a_ABC,a_DBE)".

Definition con_complements_unshared_source := transitive_header "ang: a_ABC a_CBD a_DBE a_EBF
"
  "[g_1] complementary(a_ABC,a_CBD)
[g_2] complementary(a_DBE,a_EBF)
"
  "con_ang(a_ABC,a_DBE)"
  "[01] given(g_1) -> complementary(a_ABC,a_CBD)
[02] given(g_2) -> complementary(a_DBE,a_EBF)
[03] con_complements_same(1,2) -> con_ang(a_ABC,a_DBE)".

Example con_complements_accepts :
  complete_checker con_complements_source = true.
Proof. vm_compute. reflexivity. Qed.
Example con_complements_same_accepts :
  complete_checker con_complements_same_source = true.
Proof. vm_compute. reflexivity. Qed.
Example con_complements_unshared_rejects :
  complete_checker con_complements_unshared_source = false.
Proof. vm_compute. reflexivity. Qed.

(** Corners of a parallelogram that share a side are supplementary; opposite
    corners are congruent, which is a different reason. *)
Definition pgram_consec_angs_source := transitive_header "quad: q_ABCD
"
  "[g_1] parallelogram(q_ABCD)
"
  "supplementary(a_ABC,a_BCD)"
  "[01] given(g_1) -> parallelogram(q_ABCD)
[02] pgram_consec_angs(1) -> supplementary(a_ABC,a_BCD)".

Definition pgram_consec_angs_opposite_source := transitive_header "quad: q_ABCD
"
  "[g_1] parallelogram(q_ABCD)
"
  "supplementary(a_ABC,a_CDA)"
  "[01] given(g_1) -> parallelogram(q_ABCD)
[02] pgram_consec_angs(1) -> supplementary(a_ABC,a_CDA)".

Example pgram_consec_angs_accepts :
  complete_checker pgram_consec_angs_source = true.
Proof. vm_compute. reflexivity. Qed.
Example pgram_consec_angs_opposite_rejects :
  complete_checker pgram_consec_angs_opposite_source = false.
Proof. vm_compute. reflexivity. Qed.

Example rect_diag_con_accepts :
  complete_checker rect_diag_con_source = true.
Proof. vm_compute. reflexivity. Qed.
Example rect_diag_con_sides_rejects :
  complete_checker rect_diag_con_sides_source = false.
Proof. vm_compute. reflexivity. Qed.

(** Rectangle corners are mutually congruent and opposite sides are
    congruent; a diagonal ray is not a corner. *)
Definition rectangle_def_angle_source := transitive_header
  "quad: q_EFGH
ang: a_FEH a_GHE
"
  "[g_1] rectangle(q_EFGH)
"
  "con_ang(a_FEH,a_GHE)"
  "[01] given(g_1) -> rectangle(q_EFGH)
[02] rectangle(1) -> con_ang(a_FEH,a_GHE)".

Definition rectangle_def_side_source := transitive_header "quad: q_EFGH
"
  "[g_1] rectangle(q_EFGH)
"
  "con_seg(EF,GH)"
  "[01] given(g_1) -> rectangle(q_EFGH)
[02] rectangle(1) -> con_seg(EF,GH)".

Definition rectangle_def_noncorner_source := transitive_header
  "quad: q_EFGH
ang: a_FEH a_FGE
"
  "[g_1] rectangle(q_EFGH)
"
  "con_ang(a_FEH,a_FGE)"
  "[01] given(g_1) -> rectangle(q_EFGH)
[02] rectangle(1) -> con_ang(a_FEH,a_FGE)".

Definition rectangle_def_midpoint_rays_source := transitive_header
  "tri: t_FEJ t_JGH
quad: q_EFGH
"
  "[g_1] rectangle(q_EFGH)
[g_2] midpt(EH,J)
"
  "con_right(a_FEJ,a_JHG)"
  "[01] given(g_1) -> rectangle(q_EFGH)
[02] given(g_2) -> midpt(EH,J)
[03] rectangle(1) -> con_right(a_FEJ,a_JHG)".

Definition rectangle_def_unrelated_midpoint_source := transitive_header
  "tri: t_FEJ t_JGH
quad: q_EFGH
"
  "[g_1] rectangle(q_EFGH)
[g_2] midpt(KL,J)
"
  "con_right(a_FEJ,a_JHG)"
  "[01] given(g_1) -> rectangle(q_EFGH)
[02] given(g_2) -> midpt(KL,J)
[03] rectangle(1) -> con_right(a_FEJ,a_JHG)".

Example rectangle_def_angle_accepts :
  complete_checker rectangle_def_angle_source = true.
Proof. vm_compute. reflexivity. Qed.
Example rectangle_def_side_accepts :
  complete_checker rectangle_def_side_source = true.
Proof. vm_compute. reflexivity. Qed.
Example rectangle_def_noncorner_rejects :
  complete_checker rectangle_def_noncorner_source = false.
Proof. vm_compute. reflexivity. Qed.
Example rectangle_def_midpoint_rays_accepts :
  complete_checker rectangle_def_midpoint_rays_source = true.
Proof. vm_compute. reflexivity. Qed.
Example rectangle_def_unrelated_midpoint_rejects :
  complete_checker rectangle_def_unrelated_midpoint_source = false.
Proof. vm_compute. reflexivity. Qed.

(** A right angle at a point of a line makes the two lines perpendicular
    there.  The [on_line] premise is what carries the right angle from the ray
    to the whole line. *)
Definition def_perp_source := transitive_header "seg: AC
"
  "[g_1] right(a_ADB)
[d_01] on_line(AC,D)
"
  "perp(BD,AC,D)"
  "[01] given(g_1) -> right(a_ADB)
[02] def_perp(1) -> perp(BD,AC,D)".

(** Without knowing the foot lies on the line, the right angle says nothing
    about the rest of it. *)
Definition def_perp_no_line_source := transitive_header "seg: AC
"
  "[g_1] right(a_ADB)
"
  "perp(BD,AC,D)"
  "[01] given(g_1) -> right(a_ADB)
[02] def_perp(1) -> perp(BD,AC,D)".

(** Each ray has to reach one of the two lines. *)
Definition def_perp_foreign_ray_source := transitive_header "seg: AC
"
  "[g_1] right(a_EDB)
[d_01] on_line(AC,D)
"
  "perp(BD,AC,D)"
  "[01] given(g_1) -> right(a_EDB)
[02] def_perp(1) -> perp(BD,AC,D)".

(** The right angle must be at the stated foot. *)
Definition def_perp_wrong_vertex_source := transitive_header "seg: AC
"
  "[g_1] right(a_ABD)
[d_01] on_line(AC,D)
"
  "perp(BD,AC,D)"
  "[01] given(g_1) -> right(a_ABD)
[02] def_perp(1) -> perp(BD,AC,D)".

Example def_perp_accepts : complete_checker def_perp_source = true.
Proof. vm_compute. reflexivity. Qed.
Example def_perp_no_line_rejects :
  complete_checker def_perp_no_line_source = false.
Proof. vm_compute. reflexivity. Qed.
Example def_perp_foreign_ray_rejects :
  complete_checker def_perp_foreign_ray_source = false.
Proof. vm_compute. reflexivity. Qed.
Example def_perp_wrong_vertex_rejects :
  complete_checker def_perp_wrong_vertex_source = false.
Proof. vm_compute. reflexivity. Qed.

(** AAS may cite its two angles in either order. *)
Definition aas_swapped_source := transitive_header "tri: t_ABC t_DEF
"
  "[g_1] con_ang(a_ACB,a_DFE)
[g_2] con_ang(a_ABC,a_DEF)
[g_3] con_seg(AB,DE)
"
  "con_tri(t_ABC,t_DEF)"
  "[01] given(g_1) -> con_ang(a_ACB,a_DFE)
[02] given(g_2) -> con_ang(a_ABC,a_DEF)
[03] given(g_3) -> con_seg(AB,DE)
[04] aas(2,1,3) -> con_tri(t_ABC,t_DEF)".

Example aas_swapped_accepts : complete_checker aas_swapped_source = true.
Proof. vm_compute. reflexivity. Qed.

(** The witness congruence may relate either angle of one supplementary
    dependency to either angle of the other. *)
Definition con_supplements_crossed_source :=
  transitive_header "ang: a_ACD a_DCB a_EGH a_HGF
"
  "[g_1] supplementary(a_ACD,a_DCB)
[g_2] supplementary(a_EGH,a_HGF)
[g_3] con_ang(a_DCB,a_EGH)
"
  "con_ang(a_ACD,a_HGF)"
  "[01] given(g_1) -> supplementary(a_ACD,a_DCB)
[02] given(g_2) -> supplementary(a_EGH,a_HGF)
[03] given(g_3) -> con_ang(a_DCB,a_EGH)
[04] con_supplements(1,2,3) -> con_ang(a_ACD,a_HGF)".

Example con_supplements_crossed_accepts :
  complete_checker con_supplements_crossed_source = true.
Proof. vm_compute. reflexivity. Qed.

(** [vert_ang] may name the diagram premise it relies on. *)
Definition vert_ang_labelled_source := transitive_header "tri: t_ACE t_BDE
"
  "[d_01] intersect_seg(AB,CD,E)
"
  "con_ang(a_CEA,a_DEB)"
  "[01] vert_ang(d_01) -> con_ang(a_CEA,a_DEB)".

(** Naming a premise that is not a crossing proves nothing. *)
Definition vert_ang_wrong_label_source := transitive_header "tri: t_ACE t_BDE
"
  "[d_01] intersect_seg(AB,CD,E)
[g_1] con_seg(AB,CD)
"
  "con_ang(a_CEA,a_DEB)"
  "[01] vert_ang(g_1) -> con_ang(a_CEA,a_DEB)".

Example vert_ang_labelled_accepts :
  complete_checker vert_ang_labelled_source = true.
Proof. vm_compute. reflexivity. Qed.
Example vert_ang_wrong_label_rejects :
  complete_checker vert_ang_wrong_label_source = false.
Proof. vm_compute. reflexivity. Qed.

(** Angle reflexivity, once an [ang:] declaration supplies the nondegenerate
    rays: the audited meaning of an angle declaration is exactly
    [AngleWellFormed], which is what [conga_refl] needs.  [ref_ang] cannot be a
    goal, so these pin the behaviour by which step the checker blames: with the
    declaration it gets past step 1 and blames the deliberately broken step 2;
    without it, it stops at step 1. *)
Definition ref_ang_declared_source := transitive_header "ang: a_ABC
" ""
  "con_seg(AB,AB)"
  "[01] reflex() -> ref_ang(a_ABC,a_ABC)
[02] reflex() -> ref_seg(AB,CD)".

Definition ref_ang_undeclared_source := transitive_header "seg: AB
" ""
  "con_seg(AB,AB)"
  "[01] reflex() -> ref_ang(a_ABC,a_ABC)
[02] reflex() -> ref_seg(AB,CD)".

Definition blamed_step (n : string) : list Audit.Issue :=
  [Audit.issue 1 "reason_application_error"
    (Audit.JsonObject
      [("steps", Audit.JsonArray [Audit.JsonString n])])].

Example ref_ang_declared_clears_its_step :
  (CertifiedAPI.check ref_ang_declared_source).(Audit.report_issues) =
    blamed_step "2".
Proof. vm_compute. reflexivity. Qed.

Example ref_ang_undeclared_stops_at_its_step :
  (CertifiedAPI.check ref_ang_undeclared_source).(Audit.report_issues) =
    blamed_step "1".
Proof. vm_compute. reflexivity. Qed.

(** A declared angle says nothing about a different one. *)
Definition ref_ang_other_angle_source := transitive_header "ang: a_ABC
" ""
  "con_seg(AB,AB)"
  "[01] reflex() -> ref_ang(a_DEF,a_DEF)
[02] reflex() -> ref_seg(AB,CD)".

Example ref_ang_other_angle_stops_at_its_step :
  (CertifiedAPI.check ref_ang_other_angle_source).(Audit.report_issues) =
    blamed_step "1".
Proof. vm_compute. reflexivity. Qed.

Example malformed_problem_is_parse_failure :
  classify_source "this is not an Ender problem" = ParseFailure.
Proof. vm_compute. reflexivity. Qed.

Definition unsupported_goal_source := common_header "" "right(a_BAC)" "".
Example parsed_but_unimplemented_goal_rejects :
  match Audit.problemPart unsupported_goal_source with
  | Some part =>
      match parsePublicProblem part with Some _ => true | None => false end
  | None => false
  end = true /\ complete_checker unsupported_goal_source = false.
Proof. vm_compute. split; reflexivity. Qed.

Example parsed_but_unimplemented_goal_is_proof_rejection :
  classify_source unsupported_goal_source = ProofRejected.
Proof. vm_compute. reflexivity. Qed.

Example bad_dependency_rejects :
  check_source (common_header
    "[g_1] con_seg(AB,DE)
[g_2] con_ang(a_BAC,a_EDF)
[g_3] con_seg(AC,DF)
" "con_tri(t_ABC,t_DEF)"
    "[01] given(g_1) -> con_seg(AB,DE)
[02] given(g_2) -> con_ang(a_BAC,a_EDF)
[03] given(g_3) -> con_seg(AC,DF)
[04] sas(1,2,99) -> con_tri(t_ABC,t_DEF)") = false.
Proof. vm_compute. reflexivity. Qed.

Example problem_part_excludes_coordinates_and_steps :
  Audit.problemPart "title: ignored
pt: A (100,200)
tri: t_ABC
-> ref_seg(AB,AB)

steps:
[01] reflex() -> ref_seg(AB,AB)" =
  Some "tri: t_ABC
-> ref_seg(AB,AB)

".
Proof. vm_compute. reflexivity. Qed.

(** The quadrilateral statement layer: declarations, premises of every new
    form, a [given] step, and a [parallelogram] goal, through both checker
    paths. *)
Definition quad_layer_source := "title: quadrilateral statements
premises:
pt: A (0,0), B (4,0), C (6,3), D (2,3)
quad: q_ABCD
[g_1] parallelogram(q_ABCD)
[g_2] trapezoid_premise(q_ABCD, AB, CD)
[g_3] kite_premise(q_ABCD, a_ABC, a_ADC)
[g_4] para(AB, CD)
[g_5] rhombus(q_ABCD)
[g_6] isos_trapezoid_premise(q_ABCD, AB, CD)
[g_7] rectangle(q_ABCD)
[g_8] isos_trapezoid(q_ABCD)
-> parallelogram(q_ABCD)

steps:
[01] given(g_1) -> parallelogram(q_ABCD)".

Example quad_layer_accepts : check_source quad_layer_source = true.
Proof. vm_compute. reflexivity. Qed.
Example complete_quad_layer_accepts : complete_checker quad_layer_source = true.
Proof. vm_compute. reflexivity. Qed.

(** The transversal statement parses as a diagram premise and feeds a goal
    through a [given] step. *)
Definition transversal_layer_source := "title: transversal statement
premises:
pt: A (2,8), B (15,8), C (2,2), D (15,2), E (12,8), F (6,2), T (13,9), R (5,1)
[d_1] transversal(A, B, T, E, C, D, R, F)
[g_1] para(AB, CD)
-> para(AB, CD)

steps:
[01] given(g_1) -> para(AB, CD)".

Example transversal_layer_accepts :
  check_source transversal_layer_source = true.
Proof. vm_compute. reflexivity. Qed.
Example complete_transversal_layer_accepts :
  complete_checker transversal_layer_source = true.
Proof. vm_compute. reflexivity. Qed.

(** Historical files may retain an explicit diagram label after the logical
    step dependency.  The rule still validates the actual transversal. *)
Definition labelled_altint_source := "title: labelled alternate angles
premises:
pt: A (2,8), B (15,8), C (2,2), D (15,2), E (12,8), F (6,2), T (13,9), R (5,1)
[d_01] transversal(A,B,T,E,C,D,R,F)
[g_1] para(AB,CD)
-> con_ang(a_AEF,a_DFE)

steps:
[01] given(g_1) -> para(AB,CD)
[02] altint(1,d_01) -> con_ang(a_AEF,a_DFE)".

Example labelled_altint_accepts :
  complete_checker labelled_altint_source = true.
Proof. vm_compute. reflexivity. Qed.

(** A point known to lie on the transversal segment may spell the same ray
    in a converse proof. *)
Definition intersect_ray_altint_conv_source := "title: intersection ray spelling
premises:
pt: A (2,8), B (15,8), C (2,2), D (15,2), E (12,8), F (6,2), T (13,9), R (5,1), X (9,5), G (9,1), H (9,9)
[d_01] transversal(A,B,T,E,C,D,R,F)
[d_02] intersect_seg(EF,GH,X)
[g_1] con_ang(a_AEX,a_DFE)
-> para(AB,CD)

steps:
[01] given(g_1) -> con_ang(a_AEX,a_DFE)
[02] altint_conv(1) -> para(AB,CD)".

Definition unlinked_ray_altint_conv_source := "title: unlinked ray spelling
premises:
pt: A (2,8), B (15,8), C (2,2), D (15,2), E (12,8), F (6,2), T (13,9), R (5,1), X (9,5)
[d_01] transversal(A,B,T,E,C,D,R,F)
[g_1] con_ang(a_AEX,a_DFE)
-> para(AB,CD)

steps:
[01] given(g_1) -> con_ang(a_AEX,a_DFE)
[02] altint_conv(1) -> para(AB,CD)".

Example intersect_ray_altint_conv_accepts :
  complete_checker intersect_ray_altint_conv_source = true.
Proof. vm_compute. reflexivity. Qed.
Example unlinked_ray_altint_conv_rejects :
  complete_checker unlinked_ray_altint_conv_source = false.
Proof. vm_compute. reflexivity. Qed.

(** The circle statement layer: a circle declaration, premises of every new
    form including the nested arc spelling, a [def_radius] step, and a
    congruent-radii goal, through both checker paths. *)
Definition circle_layer_source := "title: circle statements
premises:
pt: O (5,5), A (5,9), B (9,5), C (1,5), P (5,1)
circ: c_OA
[g_1] radius(c_OA, B)
[g_2] chord(c_OA, AB)
[g_3] diameter(c_OA, AP)
[g_4] tangent(c_OA, CB, A)
[g_5] inscribed_angle(c_OA, a_ABP)
[g_6] con_arc(minor_arc(c_OA, A, B), minor_arc(c_OA, B, P))
[g_7] minor_arc(c_OA, A, B)
-> con_seg(OB, OA)

steps:
[01] given(g_1) -> radius(c_OA, B)
[02] def_radius(1) -> con_seg(OB, OA)".

Example circle_layer_accepts : check_source circle_layer_source = true.
Proof. vm_compute. reflexivity. Qed.
Example complete_circle_layer_accepts :
  complete_checker circle_layer_source = true.
Proof. vm_compute. reflexivity. Qed.

(** The goal is closed by a derived fact spelled with reversed segments,
    under exactly the spellings step-to-step matching accepts. *)
Definition reversed_goal_source := "title: reversed goal spelling
premises:
pt: A (0,0), M (2,0), B (4,0)
[g_1] midpt(AB, M)
-> con_seg(MA, BM)

steps:
[01] given(g_1) -> midpt(AB, M)
[02] def_midpt(1) -> con_seg(AM, MB)".

Example reversed_goal_accepts : check_source reversed_goal_source = true.
Proof. vm_compute. reflexivity. Qed.
Example complete_reversed_goal_accepts :
  complete_checker reversed_goal_source = true.
Proof. vm_compute. reflexivity. Qed.

Print Assumptions check_source_sound.
Print Assumptions CompleteVerifiedChecker.checker_sound.
