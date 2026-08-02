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
