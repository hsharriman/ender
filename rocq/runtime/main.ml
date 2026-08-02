let read_file path =
  let channel = open_in_bin path in
  let length = in_channel_length channel in
  let contents = really_input_string channel length in
  close_in channel;
  contents

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

let () =
  if Array.length Sys.argv <> 2 then begin
    prerr_endline "usage: ender-checker PROOF_FILE";
    exit 2
  end;
  let source = read_file Sys.argv.(1) |> String.to_seq |> List.of_seq in
  let report = EnderChecker.CertifiedChecker.check source in
  match report.EnderChecker.FA.report_verdict with
  | EnderChecker.FA.Accepted ->
      print_endline (output_json true "issues" report.EnderChecker.FA.report_issues);
      exit 0
  | EnderChecker.FA.RejectedProof ->
      print_endline (output_json false "issues" report.EnderChecker.FA.report_issues);
      exit 1
  | EnderChecker.FA.FailedToParseProblem ->
      print_endline (output_json false "errors" report.EnderChecker.FA.report_errors);
      exit 2
