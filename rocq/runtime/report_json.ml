let text chars = String.of_seq (List.to_seq chars)

let rec json_value = function
  | GhostChecker.JsonNull -> `Null
  | GhostChecker.JsonBool value -> `Bool value
  | GhostChecker.JsonNumber value -> `Int value
  | GhostChecker.JsonString value -> `String (text value)
  | GhostChecker.JsonArray values -> `List (List.map json_value values)
  | GhostChecker.JsonObject fields ->
      `Assoc (List.map (fun (key, value) -> text key, json_value value) fields)

let issue_json issue =
  `Assoc
    [ ("type", `Int issue.GhostChecker.issue_type)
    ; ("code", `String (text issue.GhostChecker.issue_code))
    ; ("details", json_value issue.GhostChecker.issue_details)
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

let checker_output_of_report report =
  match report.GhostChecker.report_verdict with
  | GhostChecker.Accepted ->
      output_json true "issues" report.GhostChecker.report_issues
  | GhostChecker.RejectedProof ->
      output_json false "issues" report.GhostChecker.report_issues
  | GhostChecker.FailedToParseProblem ->
      output_json false "errors" report.GhostChecker.report_errors

let checker_output source =
  checker_output_of_report (GhostChecker.CertifiedChecker.check source)

let surface_call_json call =
  `Assoc
    [ ("name", `String (text call.GhostChecker.surface_call_name))
    ; ("arguments", `List (List.map
        (fun argument -> `String (text argument))
        call.GhostChecker.surface_call_arguments))
    ]

let optional_json encode = function Some value -> encode value | None -> `Null

let display_point_json point =
  `Assoc
    [ ("label", `String (String.make 1 point.GhostChecker.display_point_name))
    ; ("x", `String (text point.GhostChecker.display_point_x))
    ; ("y", `String (text point.GhostChecker.display_point_y))
    ; ("offsetCode", optional_json
        (fun value -> `String (text value))
        point.GhostChecker.display_point_offset)
    ]

let declaration_kind = function
  | GhostChecker.DisplaySegment -> "segment"
  | GhostChecker.DisplayAngle -> "angle"
  | GhostChecker.DisplayTriangle -> "triangle"
  | GhostChecker.DisplayQuadrilateral -> "quadrilateral"
  | GhostChecker.DisplayCircle -> "circle"

let declaration_json declaration =
  `Assoc
    [ ("kind", `String (declaration_kind
        declaration.GhostChecker.display_declaration_kind))
    ; ("objects", `List (List.map
        (fun value -> `String (text value))
        declaration.GhostChecker.display_declaration_objects))
    ]

let labeled_call_json labeled =
  `Assoc
    [ ("label", `String (text labeled.GhostChecker.surface_label))
    ; ("call", surface_call_json labeled.GhostChecker.surface_labeled_call)
    ]

let presentation_step_json step =
  `Assoc
    [ ("label", `String (text step.GhostChecker.presentation_step_label))
    ; ("reason", optional_json surface_call_json
        step.GhostChecker.presentation_step_reason)
    ; ("conclusion", optional_json surface_call_json
        step.GhostChecker.presentation_step_conclusion)
    ]

let presentation_json file =
  `Assoc
    [ ("title", optional_json (fun value -> `String (text value))
        file.GhostChecker.presentation_title)
    ; ("points", `List (List.map display_point_json
        file.GhostChecker.presentation_points))
    ; ("declarations", `List (List.map declaration_json
        file.GhostChecker.presentation_declarations))
    ; ("diagramPremises", `List (List.map labeled_call_json
        file.GhostChecker.presentation_diagram_premises))
    ; ("givens", `List (List.map labeled_call_json
        file.GhostChecker.presentation_givens))
    ; ("goal", optional_json surface_call_json
        file.GhostChecker.presentation_goal)
    ; ("steps", `List (List.map presentation_step_json
        file.GhostChecker.presentation_steps))
    ]

let presentation_output source =
  match GhostChecker.CertifiedChecker.parsePresentation source with
  | Some file -> Yojson.Safe.to_string (presentation_json file)
  | None -> "null"

let verdict_name = function
  | GhostChecker.FailedToParseProblem -> "failed_to_parse_problem"
  | GhostChecker.RejectedProof -> "rejected_proof"
  | GhostChecker.Accepted -> "accepted"

let phase_name = function
  | GhostChecker.ProblemParsing -> "problem_parsing"
  | GhostChecker.ProofParsing -> "proof_parsing"
  | GhostChecker.ProofChecking -> "proof_checking"

let severity_name = function
  | GhostChecker.DiagnosticInfo -> "info"
  | GhostChecker.DiagnosticWarning -> "warning"
  | GhostChecker.DiagnosticError -> "error"

let diagnostic_code_name = function
  | GhostChecker.MalformedProblem -> "malformed_problem"
  | GhostChecker.MalformedProof -> "malformed_proof"
  | GhostChecker.UnsupportedStatement -> "unsupported_statement"
  | GhostChecker.HeaderMismatch -> "header_mismatch"
  | GhostChecker.ProofNotAccepted -> "proof_not_accepted"
  | GhostChecker.InvalidReason -> "invalid_reason"
  | GhostChecker.MissingDependency -> "missing_dependency"
  | GhostChecker.GoalNotProved -> "goal_not_proved"

let diagnostic_json diagnostic =
  `Assoc
    [ ("phase", `String (phase_name diagnostic.GhostChecker.diagnostic_phase))
    ; ("severity", `String (severity_name diagnostic.GhostChecker.diagnostic_severity))
    ; ("code", `String (diagnostic_code_name diagnostic.GhostChecker.diagnostic_code))
    ; ("message", `String (text diagnostic.GhostChecker.diagnostic_message))
    ]

let statement_json statement =
  `String (text (GhostChecker.statementText statement))

let declaration_json_semantic declaration =
  `String (text (GhostChecker.declarationTag declaration)
           ^ text (GhostChecker.declarationObjectText declaration))

let problem_json problem =
  `Assoc
    [ ("declarations", `List (List.map declaration_json_semantic
        problem.GhostChecker.public_declarations))
    ; ("premises", `List (List.map statement_json
        problem.GhostChecker.public_premises))
    ; ("conclusion", statement_json problem.GhostChecker.public_conclusion)
    ]

let step_status_name = function
  | GhostChecker.StepAccepted -> "accepted"
  | GhostChecker.StepRejected -> "rejected"
  | GhostChecker.StepBlocked -> "blocked"

let step_report_json step =
  `Assoc
    [ ("number", `Int step.GhostChecker.step_number)
    ; ("source", `String (text step.GhostChecker.step_source))
    ; ("reason", optional_json (fun value -> `String (text value))
        step.GhostChecker.step_reason_name)
    ; ("conclusion", optional_json statement_json
        step.GhostChecker.step_conclusion)
    ; ("status", `String (step_status_name step.GhostChecker.step_status))
    ; ("dependencies", `List (List.map (fun n -> `Int n)
        step.GhostChecker.step_dependencies))
    ; ("diagramDependencies", `List (List.map statement_json
        step.GhostChecker.step_diagram_dependencies))
    ; ("diagnostics", `List (List.map diagnostic_json
        step.GhostChecker.step_diagnostics))
    ]

let graph_json graph =
  let edge_json (source, target) = `List [`Int source; `Int target] in
  `Assoc
    [ ("nodes", `List (List.map (fun n -> `Int n)
        graph.GhostChecker.graph_nodes))
    ; ("edges", `List (List.map edge_json graph.GhostChecker.graph_edges))
    ; ("cycles", `List (List.map
        (fun cycle -> `List (List.map (fun n -> `Int n) cycle))
        graph.GhostChecker.graph_cycles))
    ; ("unusedSteps", `List (List.map (fun n -> `Int n)
        graph.GhostChecker.graph_unused_steps))
    ]

let origin_json = function
  | GhostChecker.PremiseOrigin label ->
      `Assoc [("kind", `String "premise"); ("label", `String (text label))]
  | GhostChecker.StepOrigin step ->
      `Assoc [("kind", `String "step"); ("step", `Int step)]

let duplicate_json duplicate =
  `Assoc
    [ ("statement", statement_json duplicate.GhostChecker.duplicate_statement)
    ; ("first", origin_json duplicate.GhostChecker.duplicate_first)
    ; ("again", origin_json duplicate.GhostChecker.duplicate_again)
    ]

let goal_json goal =
  `Assoc
    [ ("provedBy", optional_json (fun n -> `Int n)
        goal.GhostChecker.goal_proved_by)
    ; ("diagnostics", `List (List.map diagnostic_json
        goal.GhostChecker.goal_diagnostics))
    ]

let report_json report =
  `Assoc
    [ ("verdict", `String (verdict_name report.GhostChecker.report_verdict))
    ; ("problem", optional_json problem_json report.GhostChecker.report_problem)
    ; ("presentation", optional_json presentation_json
        report.GhostChecker.report_presentation)
    ; ("steps", `List (List.map step_report_json report.GhostChecker.report_steps))
    ; ("graph", graph_json report.GhostChecker.report_graph)
    ; ("duplicates", `List (List.map duplicate_json
        report.GhostChecker.report_duplicates))
    ; ("goal", goal_json report.GhostChecker.report_goal)
    ; ("issues", `List (List.map issue_json report.GhostChecker.report_issues))
    ; ("errors", `List (List.map issue_json report.GhostChecker.report_errors))
    ; ("diagnostics", `List (List.map diagnostic_json
        report.GhostChecker.report_diagnostics))
    ]

let report_output source =
  source |> GhostChecker.CertifiedChecker.check |> report_json
  |> Yojson.Safe.to_string
