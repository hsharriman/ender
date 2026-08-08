let read_file path =
  let channel = open_in_bin path in
  let length = in_channel_length channel in
  let contents = really_input_string channel length in
  close_in channel;
  contents

let () =
  let mode = if Array.length Sys.argv = 3 then Some Sys.argv.(1) else None in
  let special_mode = mode = Some "--presentation" || mode = Some "--report" in
  if Array.length Sys.argv <> 2 && not special_mode then begin
    prerr_endline "usage: ender-checker [--presentation|--report] PROOF_FILE";
    exit 2
  end;
  let source_path = if special_mode then Sys.argv.(2) else Sys.argv.(1) in
  let source = read_file source_path |> String.to_seq |> List.of_seq in
  if mode = Some "--presentation" then begin
    print_endline (Report_json.presentation_output source);
    exit 0
  end;
  if mode = Some "--report" then begin
    print_endline (Report_json.report_output source);
    exit 0
  end;
  let report = EnderChecker.CertifiedChecker.check source in
  match report.EnderChecker.report_verdict with
  | EnderChecker.Accepted ->
      print_endline (Report_json.checker_output source);
      exit 0
  | EnderChecker.RejectedProof ->
      print_endline (Report_json.checker_output source);
      exit 1
  | EnderChecker.FailedToParseProblem ->
      print_endline (Report_json.checker_output source);
      exit 2
