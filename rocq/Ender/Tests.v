From Coq Require Import String.
Require Import Ender.Parser Ender.PublicParser Ender.CompleteChecker.
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

(** The complete public parser already covers statement forms outside the
    currently executable reason kernel, including nested arc syntax. *)
Example public_arc_statement_parses :
  match parse_public_statement
    "con_arc(minor_arc(c_OA,A,B),major_arc(c_OD,D,E))" with
  | Some (Audit.FinalAudit.ConArc _ _) => true
  | _ => false
  end = true.
Proof. vm_compute. reflexivity. Qed.

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

Definition unsupported_goal_source := common_header "" "right(a_BAC)" "".
Example parsed_but_unimplemented_goal_rejects :
  match Audit.ProblemPart.problemPart unsupported_goal_source with
  | Some part =>
      match parsePublicProblem part with Some _ => true | None => false end
  | None => false
  end = true /\ complete_checker unsupported_goal_source = false.
Proof. vm_compute. split; reflexivity. Qed.

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
  Audit.ProblemPart.problemPart "title: ignored
pt: A (100,200)
tri: t_ABC
-> ref_seg(AB,AB)

steps:
[01] reflex() -> ref_seg(AB,AB)" =
  Some "tri: t_ABC
-> ref_seg(AB,AB)

".
Proof. vm_compute. reflexivity. Qed.

Print Assumptions check_source_sound.
Print Assumptions CompleteVerifiedChecker.checker_sound.
