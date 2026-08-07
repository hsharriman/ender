let text chars = String.of_seq (List.to_seq chars)

let rec json_value = function
  | EnderChecker.JsonNull -> `Null
  | EnderChecker.JsonBool value -> `Bool value
  | EnderChecker.JsonNumber value -> `Int value
  | EnderChecker.JsonString value -> `String (text value)
  | EnderChecker.JsonArray values -> `List (List.map json_value values)
  | EnderChecker.JsonObject fields ->
      `Assoc (List.map (fun (key, value) -> text key, json_value value) fields)

let issue_json issue =
  `Assoc
    [ ("type", `Int issue.EnderChecker.issue_type)
    ; ("code", `String (text issue.EnderChecker.issue_code))
    ; ("details", json_value issue.EnderChecker.issue_details)
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
  match report.EnderChecker.report_verdict with
  | EnderChecker.Accepted ->
      output_json true "issues" report.EnderChecker.report_issues
  | EnderChecker.RejectedProof ->
      output_json false "issues" report.EnderChecker.report_issues
  | EnderChecker.FailedToParseProblem ->
      output_json false "errors" report.EnderChecker.report_errors

let surface_call_json call =
  `Assoc
    [ ("name", `String (text call.EnderChecker.surface_call_name))
    ; ("arguments", `List (List.map
        (fun argument -> `String (text argument))
        call.EnderChecker.surface_call_arguments))
    ]

let optional_json encode = function Some value -> encode value | None -> `Null

let display_point_json point =
  `Assoc
    [ ("label", `String (String.make 1 point.EnderChecker.display_point_name))
    ; ("x", `String (text point.EnderChecker.display_point_x))
    ; ("y", `String (text point.EnderChecker.display_point_y))
    ; ("offsetCode", optional_json
        (fun value -> `String (text value))
        point.EnderChecker.display_point_offset)
    ]

let declaration_kind = function
  | EnderChecker.DisplaySegment -> "segment"
  | EnderChecker.DisplayAngle -> "angle"
  | EnderChecker.DisplayTriangle -> "triangle"
  | EnderChecker.DisplayQuadrilateral -> "quadrilateral"
  | EnderChecker.DisplayCircle -> "circle"

let declaration_json declaration =
  `Assoc
    [ ("kind", `String (declaration_kind
        declaration.EnderChecker.display_declaration_kind))
    ; ("objects", `List (List.map
        (fun value -> `String (text value))
        declaration.EnderChecker.display_declaration_objects))
    ]

let labeled_call_json labeled =
  `Assoc
    [ ("label", `String (text labeled.EnderChecker.surface_label))
    ; ("call", surface_call_json labeled.EnderChecker.surface_labeled_call)
    ]

let presentation_step_json step =
  `Assoc
    [ ("label", `String (text step.EnderChecker.presentation_step_label))
    ; ("reason", optional_json surface_call_json
        step.EnderChecker.presentation_step_reason)
    ; ("conclusion", optional_json surface_call_json
        step.EnderChecker.presentation_step_conclusion)
    ]

let presentation_json file =
  `Assoc
    [ ("title", optional_json (fun value -> `String (text value))
        file.EnderChecker.presentation_title)
    ; ("points", `List (List.map display_point_json
        file.EnderChecker.presentation_points))
    ; ("declarations", `List (List.map declaration_json
        file.EnderChecker.presentation_declarations))
    ; ("diagramPremises", `List (List.map labeled_call_json
        file.EnderChecker.presentation_diagram_premises))
    ; ("givens", `List (List.map labeled_call_json
        file.EnderChecker.presentation_givens))
    ; ("goal", optional_json surface_call_json
        file.EnderChecker.presentation_goal)
    ; ("steps", `List (List.map presentation_step_json
        file.EnderChecker.presentation_steps))
    ]

let presentation_output source =
  match EnderChecker.CertifiedChecker.parsePresentation source with
  | Some file -> Yojson.Safe.to_string (presentation_json file)
  | None -> "null"

let verdict_name = function
  | EnderChecker.FailedToParseProblem -> "failed_to_parse_problem"
  | EnderChecker.RejectedProof -> "rejected_proof"
  | EnderChecker.Accepted -> "accepted"

let phase_name = function
  | EnderChecker.ProblemParsing -> "problem_parsing"
  | EnderChecker.ProofParsing -> "proof_parsing"
  | EnderChecker.ProofChecking -> "proof_checking"

let severity_name = function
  | EnderChecker.DiagnosticInfo -> "info"
  | EnderChecker.DiagnosticWarning -> "warning"
  | EnderChecker.DiagnosticError -> "error"

let diagnostic_code_name = function
  | EnderChecker.MalformedProblem -> "malformed_problem"
  | EnderChecker.MalformedProof -> "malformed_proof"
  | EnderChecker.UnsupportedStatement -> "unsupported_statement"
  | EnderChecker.HeaderMismatch -> "header_mismatch"
  | EnderChecker.ProofNotAccepted -> "proof_not_accepted"
  | EnderChecker.InvalidReason -> "invalid_reason"
  | EnderChecker.MissingDependency -> "missing_dependency"
  | EnderChecker.GoalNotProved -> "goal_not_proved"

let diagnostic_json diagnostic =
  `Assoc
    [ ("phase", `String (phase_name diagnostic.EnderChecker.diagnostic_phase))
    ; ("severity", `String (severity_name diagnostic.EnderChecker.diagnostic_severity))
    ; ("code", `String (diagnostic_code_name diagnostic.EnderChecker.diagnostic_code))
    ; ("message", `String (text diagnostic.EnderChecker.diagnostic_message))
    ]

let statement_json statement =
  `String (text (EnderChecker.statementText statement))

let declaration_json_semantic declaration =
  `String (text (EnderChecker.declarationTag declaration)
           ^ text (EnderChecker.declarationObjectText declaration))

let problem_json problem =
  `Assoc
    [ ("declarations", `List (List.map declaration_json_semantic
        problem.EnderChecker.public_declarations))
    ; ("premises", `List (List.map statement_json
        problem.EnderChecker.public_premises))
    ; ("conclusion", statement_json problem.EnderChecker.public_conclusion)
    ]

let step_status_name = function
  | EnderChecker.StepAccepted -> "accepted"
  | EnderChecker.StepRejected -> "rejected"
  | EnderChecker.StepBlocked -> "blocked"

let step_report_json step =
  `Assoc
    [ ("number", `Int step.EnderChecker.step_number)
    ; ("source", `String (text step.EnderChecker.step_source))
    ; ("reason", optional_json (fun value -> `String (text value))
        step.EnderChecker.step_reason_name)
    ; ("conclusion", optional_json statement_json
        step.EnderChecker.step_conclusion)
    ; ("status", `String (step_status_name step.EnderChecker.step_status))
    ; ("dependencies", `List (List.map (fun n -> `Int n)
        step.EnderChecker.step_dependencies))
    ; ("diagramDependencies", `List (List.map statement_json
        step.EnderChecker.step_diagram_dependencies))
    ; ("diagnostics", `List (List.map diagnostic_json
        step.EnderChecker.step_diagnostics))
    ]

let graph_json graph =
  let edge_json (source, target) = `List [`Int source; `Int target] in
  `Assoc
    [ ("nodes", `List (List.map (fun n -> `Int n)
        graph.EnderChecker.graph_nodes))
    ; ("edges", `List (List.map edge_json graph.EnderChecker.graph_edges))
    ; ("cycles", `List (List.map
        (fun cycle -> `List (List.map (fun n -> `Int n) cycle))
        graph.EnderChecker.graph_cycles))
    ; ("unusedSteps", `List (List.map (fun n -> `Int n)
        graph.EnderChecker.graph_unused_steps))
    ]

let origin_json = function
  | EnderChecker.PremiseOrigin label ->
      `Assoc [("kind", `String "premise"); ("label", `String (text label))]
  | EnderChecker.StepOrigin step ->
      `Assoc [("kind", `String "step"); ("step", `Int step)]

let duplicate_json duplicate =
  `Assoc
    [ ("statement", statement_json duplicate.EnderChecker.duplicate_statement)
    ; ("first", origin_json duplicate.EnderChecker.duplicate_first)
    ; ("again", origin_json duplicate.EnderChecker.duplicate_again)
    ]

let goal_json goal =
  `Assoc
    [ ("provedBy", optional_json (fun n -> `Int n)
        goal.EnderChecker.goal_proved_by)
    ; ("diagnostics", `List (List.map diagnostic_json
        goal.EnderChecker.goal_diagnostics))
    ]

let report_json report =
  `Assoc
    [ ("verdict", `String (verdict_name report.EnderChecker.report_verdict))
    ; ("problem", optional_json problem_json report.EnderChecker.report_problem)
    ; ("presentation", optional_json presentation_json
        report.EnderChecker.report_presentation)
    ; ("steps", `List (List.map step_report_json report.EnderChecker.report_steps))
    ; ("graph", graph_json report.EnderChecker.report_graph)
    ; ("duplicates", `List (List.map duplicate_json
        report.EnderChecker.report_duplicates))
    ; ("goal", goal_json report.EnderChecker.report_goal)
    ; ("issues", `List (List.map issue_json report.EnderChecker.report_issues))
    ; ("errors", `List (List.map issue_json report.EnderChecker.report_errors))
    ; ("diagnostics", `List (List.map diagnostic_json
        report.EnderChecker.report_diagnostics))
    ]

let report_output source =
  source |> EnderChecker.CertifiedChecker.check |> report_json
  |> Yojson.Safe.to_string
