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
    prerr_endline "usage: ghost-checker [--presentation|--report] PROOF_FILE|-";
    exit 2
  end;
  let source_path = if special_mode then Sys.argv.(2) else Sys.argv.(1) in
  let input =
    if source_path = "-" then In_channel.input_all stdin else read_file source_path
  in
  let source = input |> String.to_seq |> List.of_seq in
  if mode = Some "--presentation" then begin
    print_endline (Report_json.presentation_output source);
    exit 0
  end;
  if mode = Some "--report" then begin
    print_endline (Report_json.report_output source);
    exit 0
  end;
  let report = GhostChecker.CertifiedChecker.check source in
  print_endline (Report_json.checker_output_of_report report);
  match report.GhostChecker.report_verdict with
  | GhostChecker.Accepted -> exit 0
  | GhostChecker.RejectedProof -> exit 1
  | GhostChecker.FailedToParseProblem -> exit 2
