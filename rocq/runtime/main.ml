let read_file path =
  let channel = open_in_bin path in
  let length = in_channel_length channel in
  let contents = really_input_string channel length in
  close_in channel;
  contents

let () =
  let presentation_mode =
    Array.length Sys.argv = 3 && Sys.argv.(1) = "--presentation" in
  if Array.length Sys.argv <> 2 && not presentation_mode then begin
    prerr_endline "usage: ender-checker [--presentation] PROOF_FILE";
    exit 2
  end;
  let source_path = if presentation_mode then Sys.argv.(2) else Sys.argv.(1) in
  let source = read_file source_path |> String.to_seq |> List.of_seq in
  if presentation_mode then begin
    print_endline (Report_json.presentation_output source);
    exit 0
  end;
  let report = EnderChecker.CertifiedChecker.check source in
  match report.EnderChecker.FA.report_verdict with
  | EnderChecker.FA.Accepted ->
      print_endline (Report_json.checker_output source);
      exit 0
  | EnderChecker.FA.RejectedProof ->
      print_endline (Report_json.checker_output source);
      exit 1
  | EnderChecker.FA.FailedToParseProblem ->
      print_endline (Report_json.checker_output source);
      exit 2
