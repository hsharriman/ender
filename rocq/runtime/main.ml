let read_file path =
  let channel = open_in_bin path in
  let length = in_channel_length channel in
  let contents = really_input_string channel length in
  close_in channel;
  contents

let text chars = String.of_seq (List.to_seq chars)

let json_string chars =
  let source = text chars in
  let buffer = Buffer.create (String.length source + 2) in
  Buffer.add_char buffer '"';
  String.iter (function
    | '"' -> Buffer.add_string buffer "\\\""
    | '\\' -> Buffer.add_string buffer "\\\\"
    | '\b' -> Buffer.add_string buffer "\\b"
    | '\012' -> Buffer.add_string buffer "\\f"
    | '\n' -> Buffer.add_string buffer "\\n"
    | '\r' -> Buffer.add_string buffer "\\r"
    | '\t' -> Buffer.add_string buffer "\\t"
    | character ->
        if Char.code character < 0x20 then
          Buffer.add_string buffer (Printf.sprintf "\\u%04x" (Char.code character))
        else Buffer.add_char buffer character
  ) source;
  Buffer.add_char buffer '"';
  Buffer.contents buffer

let indentation level = String.make (level * 2) ' '

let rec json_value level = function
  | EnderChecker.FA.JsonNull -> "null"
  | EnderChecker.FA.JsonBool value -> if value then "true" else "false"
  | EnderChecker.FA.JsonNumber value -> string_of_int value
  | EnderChecker.FA.JsonString value -> json_string value
  | EnderChecker.FA.JsonArray [] -> "[]"
  | EnderChecker.FA.JsonArray values ->
      "[\n" ^
      String.concat ",\n"
        (List.map (fun value -> indentation (level + 1) ^ json_value (level + 1) value) values) ^
      "\n" ^ indentation level ^ "]"
  | EnderChecker.FA.JsonObject [] -> "{}"
  | EnderChecker.FA.JsonObject fields ->
      "{\n" ^
      String.concat ",\n"
        (List.map (fun (key, value) ->
          indentation (level + 1) ^ json_string key ^ ": " ^ json_value (level + 1) value
        ) fields) ^
      "\n" ^ indentation level ^ "}"

let issue_json issue =
  EnderChecker.FA.JsonObject
    [ (List.of_seq (String.to_seq "type"), EnderChecker.FA.JsonNumber issue.EnderChecker.FA.issue_type)
    ; (List.of_seq (String.to_seq "code"), EnderChecker.FA.JsonString issue.EnderChecker.FA.issue_code)
    ; (List.of_seq (String.to_seq "details"), issue.EnderChecker.FA.issue_details)
    ]

let output_json is_correct field issues =
  let key value = List.of_seq (String.to_seq value) in
  json_value 0 (EnderChecker.FA.JsonObject
    [ (key "isCorrect", EnderChecker.FA.JsonBool is_correct)
    ; (key field, EnderChecker.FA.JsonArray (List.map issue_json issues))
    ])

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
