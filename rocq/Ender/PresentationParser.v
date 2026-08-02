From Coq Require Import Ascii String List Bool Nat.
Require Import Ender.Audit Ender.PublicParser.
Import ListNotations.
Module FA := Audit.FinalAudit.
Open Scope string_scope.

Definition C := list ascii.

Fixpoint split_lines (text current : C) : list C :=
  match text with
  | [] => [rev current]
  | c :: rest => if Ascii.eqb c "010"%char
      then rev current :: split_lines rest []
      else split_lines rest (c :: current)
  end.

Fixpoint take_call_prefix (text : C) (depth : nat) (seen_open : bool)
    (acc : C) : option C :=
  match text with
  | [] => None
  | c :: rest =>
      if Ascii.eqb c "("%char then
        take_call_prefix rest (S depth) true (c :: acc)
      else if Ascii.eqb c ")"%char then
        match depth with
        | O => None
        | S O => if seen_open then Some (rev (c :: acc)) else None
        | S depth' => take_call_prefix rest depth' seen_open (c :: acc)
        end
      else take_call_prefix rest depth seen_open (c :: acc)
  end.

Definition surface_call_of_chars (text : C) : option FA.SurfaceCall :=
  let compact := FA.removeWhitespace (FA.codeBeforeComment text) in
  match take_call_prefix compact 0 false [] with
  | None => None
  | Some call_text => match parse_call call_text with
  | Some (name, arguments) =>
      Some (FA.surface_call (string_of_list_ascii name)
        (map string_of_list_ascii arguments))
  | None => None
  end
  end.

Definition parseSurfaceCall (text : string) : option FA.SurfaceCall :=
  surface_call_of_chars (list_ascii_of_string text).

Fixpoint chunks_aux (fuel width : nat) (text : C) : option (list string) :=
  match fuel, text with
  | _, [] => Some []
  | O, _ => None
  | S fuel', _ =>
      let token := firstn width text in
      if Nat.eqb (length token) width then
        match chunks_aux fuel' width (skipn width text) with
        | Some rest => Some (string_of_list_ascii token :: rest)
        | None => None
        end
      else None
  end.

Definition chunks (width : nat) (text : C) : option (list string) :=
  chunks_aux (length text) width text.

Definition declaration_tokens (kind : FA.DisplayObjectKind) (text : C)
    : option (list string) :=
  match kind with
  | FA.DisplaySegment => chunks 2 text
  | FA.DisplayAngle => chunks 5 text
  | FA.DisplayTriangle => chunks 5 text
  | FA.DisplayQuadrilateral => chunks 6 text
  | FA.DisplayCircle => chunks 4 text
  end.

Definition parse_declaration (prefix : string) (kind : FA.DisplayObjectKind)
    (line : C) : option FA.DisplayDeclaration :=
  let compact := FA.removeWhitespace (FA.codeBeforeComment line) in
  match Audit.ProblemPart.find_after (list_ascii_of_string prefix) compact with
  | Some body =>
      match declaration_tokens kind body with
      | Some objects => Some (FA.display_declaration kind objects)
      | None => None
      end
  | None => None
  end.

Fixpoint parse_points_chars_aux (fuel : nat) (text : C)
    : option (list FA.DisplayPoint) :=
  match fuel, text with
  | _, [] => Some []
  | O, _ => None
  | S fuel', ","%char :: rest => parse_points_chars_aux fuel' rest
  | S fuel', label :: "("%char :: rest =>
      match Audit.ProblemPart.take_before [")"%char] rest,
            Audit.ProblemPart.find_after [")"%char] rest with
      | Some placement, Some remaining =>
          match split_arguments placement with
          | Some [x; y] =>
              match parse_points_chars_aux fuel' remaining with
              | Some points => Some (FA.display_point label
                  (string_of_list_ascii x) (string_of_list_ascii y) None :: points)
              | None => None
              end
          | Some [x; y; offset] =>
              match parse_points_chars_aux fuel' remaining with
              | Some points => Some (FA.display_point label
                  (string_of_list_ascii x) (string_of_list_ascii y)
                  (Some (string_of_list_ascii offset)) :: points)
              | None => None
              end
          | _ => None
          end
      | _, _ => None
      end
  | _, _ => None
  end.

Definition parse_points_chars (text : C) : option (list FA.DisplayPoint) :=
  parse_points_chars_aux (length text) text.

Definition parse_points_line (line : C) : option (list FA.DisplayPoint) :=
  let compact := FA.removeWhitespace (FA.codeBeforeComment line) in
  match Audit.ProblemPart.find_after (list_ascii_of_string "pt:") compact with
  | Some body => parse_points_chars body
  | None => None
  end.

Definition strip_quotes (text : C) : C :=
  match text with
  | "034"%char :: rest =>
      match rev rest with "034"%char :: middle => rev middle | _ => text end
  | _ => text
  end.

Fixpoint trim_left (text : C) : C :=
  match text with
  | c :: rest => if FA.whitespace c then trim_left rest else text
  | [] => []
  end.
Definition trim (text : C) : C := rev (trim_left (rev (trim_left text))).

Definition parse_title_line (line : C) : option string :=
  match Audit.ProblemPart.find_after (list_ascii_of_string "title:") line with
  | Some title => Some (string_of_list_ascii (strip_quotes (trim title)))
  | None => None
  end.

Definition labeled_body (line : C) : option (string * C) :=
  match line with
  | "["%char :: rest =>
      match Audit.ProblemPart.take_before ["]"%char] rest,
            Audit.ProblemPart.find_after ["]"%char] rest with
      | Some label, Some body => Some (string_of_list_ascii label, body)
      | _, _ => None
      end
  | _ => None
  end.

Definition parse_labeled_call (line : C) : option FA.LabeledSurfaceCall :=
  match labeled_body line with
  | Some (label, body) =>
      match surface_call_of_chars body with
      | Some call => Some (FA.labeled_surface_call label call)
      | None => None
      end
  | None => None
  end.

Definition parse_goal_line (line : C) : option FA.SurfaceCall :=
  match Audit.ProblemPart.find_after (list_ascii_of_string "->") line with
  | Some body => surface_call_of_chars body
  | None => None
  end.

Definition parse_step_line (line : C) : option FA.PresentationStep :=
  match labeled_body line with
  | Some (label, body) =>
      match Audit.ProblemPart.take_before (list_ascii_of_string "->") body,
            Audit.ProblemPart.find_after (list_ascii_of_string "->") body with
      | Some reason, Some conclusion =>
          Some (FA.presentation_step label (surface_call_of_chars reason)
            (surface_call_of_chars conclusion))
      | _, _ => Some (FA.presentation_step label
          (surface_call_of_chars body) None)
      end
  | None => None
  end.

Record PresentationState := presentation_state {
  ps_in_steps : bool;
  ps_title : option string;
  ps_points : list FA.DisplayPoint;
  ps_declarations : list FA.DisplayDeclaration;
  ps_diagram : list FA.LabeledSurfaceCall;
  ps_givens : list FA.LabeledSurfaceCall;
  ps_goal : option FA.SurfaceCall;
  ps_steps : list FA.PresentationStep
}.

Definition initial_presentation_state :=
  presentation_state false None [] [] [] [] None [].

Definition add_declaration (state : PresentationState)
    (declaration : FA.DisplayDeclaration) : PresentationState :=
  presentation_state state.(ps_in_steps) state.(ps_title) state.(ps_points)
    (declaration :: state.(ps_declarations)) state.(ps_diagram)
    state.(ps_givens) state.(ps_goal) state.(ps_steps).

Definition parse_presentation_line (line : C) (state : PresentationState)
    : option PresentationState :=
  let compact := FA.removeWhitespace (FA.codeBeforeComment line) in
  if Audit.ProblemPart.starts_with (list_ascii_of_string "steps:") compact then
    Some (presentation_state true state.(ps_title) state.(ps_points)
      state.(ps_declarations) state.(ps_diagram) state.(ps_givens)
      state.(ps_goal) state.(ps_steps))
  else if Audit.ProblemPart.starts_with (list_ascii_of_string "title:") compact then
    match parse_title_line line with
    | Some title => Some (presentation_state state.(ps_in_steps) (Some title)
        state.(ps_points) state.(ps_declarations) state.(ps_diagram)
        state.(ps_givens) state.(ps_goal) state.(ps_steps))
    | None => None
    end
  else if Audit.ProblemPart.starts_with (list_ascii_of_string "pt:") compact then
    match parse_points_line line with
    | Some points => Some (presentation_state state.(ps_in_steps) state.(ps_title)
        (rev points ++ state.(ps_points)) state.(ps_declarations)
        state.(ps_diagram) state.(ps_givens) state.(ps_goal) state.(ps_steps))
    | None => None
    end
  else if Audit.ProblemPart.starts_with (list_ascii_of_string "tri:") compact then
    match parse_declaration "tri:" FA.DisplayTriangle line with
    | Some d => Some (add_declaration state d) | None => None end
  else if Audit.ProblemPart.starts_with (list_ascii_of_string "quad:") compact then
    match parse_declaration "quad:" FA.DisplayQuadrilateral line with
    | Some d => Some (add_declaration state d) | None => None end
  else if Audit.ProblemPart.starts_with (list_ascii_of_string "seg:") compact then
    match parse_declaration "seg:" FA.DisplaySegment line with
    | Some d => Some (add_declaration state d) | None => None end
  else if Audit.ProblemPart.starts_with (list_ascii_of_string "ang:") compact then
    match parse_declaration "ang:" FA.DisplayAngle line with
    | Some d => Some (add_declaration state d) | None => None end
  else if Audit.ProblemPart.starts_with (list_ascii_of_string "circ:") compact then
    match parse_declaration "circ:" FA.DisplayCircle line with
    | Some d => Some (add_declaration state d) | None => None end
  else if state.(ps_in_steps) then
    match parse_step_line line with
    | Some step => Some (presentation_state true state.(ps_title) state.(ps_points)
        state.(ps_declarations) state.(ps_diagram) state.(ps_givens)
        state.(ps_goal) (step :: state.(ps_steps)))
    | None => Some state
    end
  else if Audit.ProblemPart.starts_with (list_ascii_of_string "[d_") compact then
    match parse_labeled_call line with
    | Some call => Some (presentation_state false state.(ps_title) state.(ps_points)
        state.(ps_declarations) (call :: state.(ps_diagram)) state.(ps_givens)
        state.(ps_goal) state.(ps_steps))
    | None => None
    end
  else if Audit.ProblemPart.starts_with (list_ascii_of_string "[g_") compact then
    match parse_labeled_call line with
    | Some call => Some (presentation_state false state.(ps_title) state.(ps_points)
        state.(ps_declarations) state.(ps_diagram) (call :: state.(ps_givens))
        state.(ps_goal) state.(ps_steps))
    | None => None
    end
  else if Audit.ProblemPart.starts_with (list_ascii_of_string "->") compact then
    match parse_goal_line line with
    | Some goal => Some (presentation_state false state.(ps_title) state.(ps_points)
        state.(ps_declarations) state.(ps_diagram) state.(ps_givens)
        (Some goal) state.(ps_steps))
    | None => None
    end
  else Some state.

Fixpoint parse_presentation_lines (lines : list C) (state : PresentationState)
    : option PresentationState :=
  match lines with
  | [] => Some state
  | line :: rest =>
      match parse_presentation_line line state with
      | Some next => parse_presentation_lines rest next
      | None => None
      end
  end.

Definition parsePresentation (source : string) : option FA.PresentationFile :=
  match parse_presentation_lines
    (split_lines (list_ascii_of_string source) []) initial_presentation_state with
  | Some state => Some (FA.presentation_file state.(ps_title)
      (rev state.(ps_points)) (rev state.(ps_declarations))
      (rev state.(ps_diagram)) (rev state.(ps_givens)) state.(ps_goal)
      (rev state.(ps_steps)))
  | None => None
  end.
