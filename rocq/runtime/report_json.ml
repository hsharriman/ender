let text chars = String.of_seq (List.to_seq chars)

let rec json_value = function
  | EnderChecker.FA.JsonNull -> `Null
  | EnderChecker.FA.JsonBool value -> `Bool value
  | EnderChecker.FA.JsonNumber value -> `Int value
  | EnderChecker.FA.JsonString value -> `String (text value)
  | EnderChecker.FA.JsonArray values -> `List (List.map json_value values)
  | EnderChecker.FA.JsonObject fields ->
      `Assoc (List.map (fun (key, value) -> text key, json_value value) fields)

let issue_json issue =
  `Assoc
    [ ("type", `Int issue.EnderChecker.FA.issue_type)
    ; ("code", `String (text issue.EnderChecker.FA.issue_code))
    ; ("details", json_value issue.EnderChecker.FA.issue_details)
    ]

let output_json is_correct field issues =
  let value = `Assoc
    [ ("isCorrect", `Bool is_correct)
    ; (field, `List (List.map issue_json issues))
    ] in
  let buffer = Buffer.create 256 in
  let formatter = Format.formatter_of_buffer buffer in
  Format.pp_set_margin formatter 20;
  Yojson.Safe.pretty_print formatter value;
  Format.pp_print_flush formatter ();
  Buffer.contents buffer

let checker_output source =
  let report = EnderChecker.CertifiedChecker.check source in
  match report.EnderChecker.FA.report_verdict with
  | EnderChecker.FA.Accepted ->
      output_json true "issues" report.EnderChecker.FA.report_issues
  | EnderChecker.FA.RejectedProof ->
      output_json false "issues" report.EnderChecker.FA.report_issues
  | EnderChecker.FA.FailedToParseProblem ->
      output_json false "errors" report.EnderChecker.FA.report_errors

let surface_call_json call =
  `Assoc
    [ ("name", `String (text call.EnderChecker.FA.surface_call_name))
    ; ("arguments", `List (List.map
        (fun argument -> `String (text argument))
        call.EnderChecker.FA.surface_call_arguments))
    ]

let optional_json encode = function Some value -> encode value | None -> `Null

let display_point_json point =
  `Assoc
    [ ("label", `String (String.make 1 point.EnderChecker.FA.display_point_name))
    ; ("x", `String (text point.EnderChecker.FA.display_point_x))
    ; ("y", `String (text point.EnderChecker.FA.display_point_y))
    ; ("offsetCode", optional_json
        (fun value -> `String (text value))
        point.EnderChecker.FA.display_point_offset)
    ]

let declaration_kind = function
  | EnderChecker.FA.DisplaySegment -> "segment"
  | EnderChecker.FA.DisplayAngle -> "angle"
  | EnderChecker.FA.DisplayTriangle -> "triangle"
  | EnderChecker.FA.DisplayQuadrilateral -> "quadrilateral"
  | EnderChecker.FA.DisplayCircle -> "circle"

let declaration_json declaration =
  `Assoc
    [ ("kind", `String (declaration_kind
        declaration.EnderChecker.FA.display_declaration_kind))
    ; ("objects", `List (List.map
        (fun value -> `String (text value))
        declaration.EnderChecker.FA.display_declaration_objects))
    ]

let labeled_call_json labeled =
  `Assoc
    [ ("label", `String (text labeled.EnderChecker.FA.surface_label))
    ; ("call", surface_call_json labeled.EnderChecker.FA.surface_labeled_call)
    ]

let presentation_step_json step =
  `Assoc
    [ ("label", `String (text step.EnderChecker.FA.presentation_step_label))
    ; ("reason", optional_json surface_call_json
        step.EnderChecker.FA.presentation_step_reason)
    ; ("conclusion", optional_json surface_call_json
        step.EnderChecker.FA.presentation_step_conclusion)
    ]

let presentation_json file =
  `Assoc
    [ ("title", optional_json (fun value -> `String (text value))
        file.EnderChecker.FA.presentation_title)
    ; ("points", `List (List.map display_point_json
        file.EnderChecker.FA.presentation_points))
    ; ("declarations", `List (List.map declaration_json
        file.EnderChecker.FA.presentation_declarations))
    ; ("diagramPremises", `List (List.map labeled_call_json
        file.EnderChecker.FA.presentation_diagram_premises))
    ; ("givens", `List (List.map labeled_call_json
        file.EnderChecker.FA.presentation_givens))
    ; ("goal", optional_json surface_call_json
        file.EnderChecker.FA.presentation_goal)
    ; ("steps", `List (List.map presentation_step_json
        file.EnderChecker.FA.presentation_steps))
    ]

let presentation_output source =
  match EnderChecker.CertifiedChecker.parsePresentation source with
  | Some file -> Yojson.Safe.to_string (presentation_json file)
  | None -> "null"

let verdict_name = function
  | EnderChecker.FA.FailedToParseProblem -> "failed_to_parse_problem"
  | EnderChecker.FA.RejectedProof -> "rejected_proof"
  | EnderChecker.FA.Accepted -> "accepted"

let phase_name = function
  | EnderChecker.FA.ProblemParsing -> "problem_parsing"
  | EnderChecker.FA.ProofParsing -> "proof_parsing"
  | EnderChecker.FA.ProofChecking -> "proof_checking"

let severity_name = function
  | EnderChecker.FA.DiagnosticInfo -> "info"
  | EnderChecker.FA.DiagnosticWarning -> "warning"
  | EnderChecker.FA.DiagnosticError -> "error"

let diagnostic_code_name = function
  | EnderChecker.FA.MalformedProblem -> "malformed_problem"
  | EnderChecker.FA.MalformedProof -> "malformed_proof"
  | EnderChecker.FA.UnsupportedStatement -> "unsupported_statement"
  | EnderChecker.FA.HeaderMismatch -> "header_mismatch"
  | EnderChecker.FA.ProofNotAccepted -> "proof_not_accepted"
  | EnderChecker.FA.InvalidReason -> "invalid_reason"
  | EnderChecker.FA.MissingDependency -> "missing_dependency"
  | EnderChecker.FA.GoalNotProved -> "goal_not_proved"

let diagnostic_json diagnostic =
  `Assoc
    [ ("phase", `String (phase_name diagnostic.EnderChecker.FA.diagnostic_phase))
    ; ("severity", `String (severity_name diagnostic.EnderChecker.FA.diagnostic_severity))
    ; ("code", `String (diagnostic_code_name diagnostic.EnderChecker.FA.diagnostic_code))
    ; ("message", `String (text diagnostic.EnderChecker.FA.diagnostic_message))
    ]

let statement_json statement =
  `String (text (EnderChecker.FA.statementText statement))

let declaration_json_semantic declaration =
  `String (text (EnderChecker.FA.declarationTag declaration)
           ^ text (EnderChecker.FA.declarationObjectText declaration))

let problem_json problem =
  `Assoc
    [ ("declarations", `List (List.map declaration_json_semantic
        problem.EnderChecker.FA.public_declarations))
    ; ("premises", `List (List.map statement_json
        problem.EnderChecker.FA.public_premises))
    ; ("conclusion", statement_json problem.EnderChecker.FA.public_conclusion)
    ]

let step_status_name = function
  | EnderChecker.FA.StepAccepted -> "accepted"
  | EnderChecker.FA.StepRejected -> "rejected"
  | EnderChecker.FA.StepBlocked -> "blocked"

let slot_status_name = function
  | EnderChecker.FA.SlotSatisfied -> "satisfied"
  | EnderChecker.FA.SlotMissing -> "missing"
  | EnderChecker.FA.SlotConflicting -> "conflicting"

let suggestion_slot_json slot =
  `Assoc
    [ ("status", `String (slot_status_name slot.EnderChecker.FA.suggestion_slot_status))
    ; ("description", `String (text slot.EnderChecker.FA.suggestion_slot_description))
    ; ("sources", `List (List.map (fun n -> `Int n)
        slot.EnderChecker.FA.suggestion_slot_sources))
    ]

let suggestion_json suggestion =
  `Assoc
    [ ("reason", `String (text suggestion.EnderChecker.FA.suggestion_reason))
    ; ("slots", `List (List.map suggestion_slot_json
        suggestion.EnderChecker.FA.suggestion_slots))
    ; ("complete", `Bool suggestion.EnderChecker.FA.suggestion_complete)
    ]

let step_report_json step =
  `Assoc
    [ ("number", `Int step.EnderChecker.FA.step_number)
    ; ("source", `String (text step.EnderChecker.FA.step_source))
    ; ("reason", optional_json (fun value -> `String (text value))
        step.EnderChecker.FA.step_reason_name)
    ; ("conclusion", optional_json statement_json
        step.EnderChecker.FA.step_conclusion)
    ; ("status", `String (step_status_name step.EnderChecker.FA.step_status))
    ; ("dependencies", `List (List.map (fun n -> `Int n)
        step.EnderChecker.FA.step_dependencies))
    ; ("diagramDependencies", `List (List.map statement_json
        step.EnderChecker.FA.step_diagram_dependencies))
    ; ("diagnostics", `List (List.map diagnostic_json
        step.EnderChecker.FA.step_diagnostics))
    ; ("suggestions", `List (List.map suggestion_json
        step.EnderChecker.FA.step_suggestions))
    ]

let graph_json graph =
  let edge_json (source, target) = `List [`Int source; `Int target] in
  `Assoc
    [ ("nodes", `List (List.map (fun n -> `Int n)
        graph.EnderChecker.FA.graph_nodes))
    ; ("edges", `List (List.map edge_json graph.EnderChecker.FA.graph_edges))
    ; ("cycles", `List (List.map
        (fun cycle -> `List (List.map (fun n -> `Int n) cycle))
        graph.EnderChecker.FA.graph_cycles))
    ; ("unusedSteps", `List (List.map (fun n -> `Int n)
        graph.EnderChecker.FA.graph_unused_steps))
    ]

let origin_json = function
  | EnderChecker.FA.PremiseOrigin label ->
      `Assoc [("kind", `String "premise"); ("label", `String (text label))]
  | EnderChecker.FA.StepOrigin step ->
      `Assoc [("kind", `String "step"); ("step", `Int step)]

let duplicate_json duplicate =
  `Assoc
    [ ("statement", statement_json duplicate.EnderChecker.FA.duplicate_statement)
    ; ("first", origin_json duplicate.EnderChecker.FA.duplicate_first)
    ; ("again", origin_json duplicate.EnderChecker.FA.duplicate_again)
    ]

let goal_json goal =
  `Assoc
    [ ("provedBy", optional_json (fun n -> `Int n)
        goal.EnderChecker.FA.goal_proved_by)
    ; ("diagnostics", `List (List.map diagnostic_json
        goal.EnderChecker.FA.goal_diagnostics))
    ; ("suggestions", `List (List.map suggestion_json
        goal.EnderChecker.FA.goal_suggestions))
    ]

let report_json report =
  `Assoc
    [ ("verdict", `String (verdict_name report.EnderChecker.FA.report_verdict))
    ; ("problem", optional_json problem_json report.EnderChecker.FA.report_problem)
    ; ("presentation", optional_json presentation_json
        report.EnderChecker.FA.report_presentation)
    ; ("steps", `List (List.map step_report_json report.EnderChecker.FA.report_steps))
    ; ("graph", graph_json report.EnderChecker.FA.report_graph)
    ; ("duplicates", `List (List.map duplicate_json
        report.EnderChecker.FA.report_duplicates))
    ; ("goal", goal_json report.EnderChecker.FA.report_goal)
    ; ("issues", `List (List.map issue_json report.EnderChecker.FA.report_issues))
    ; ("errors", `List (List.map issue_json report.EnderChecker.FA.report_errors))
    ; ("diagnostics", `List (List.map diagnostic_json
        report.EnderChecker.FA.report_diagnostics))
    ]

let report_output source =
  source |> EnderChecker.CertifiedChecker.check |> report_json
  |> Yojson.Safe.to_string
