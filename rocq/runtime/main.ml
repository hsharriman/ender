let read_file path =
  let channel = open_in_bin path in
  let length = in_channel_length channel in
  let contents = really_input_string channel length in
  close_in channel;
  contents

let () =
  if Array.length Sys.argv <> 2 then begin
    prerr_endline "usage: ender-checker PROOF_FILE";
    exit 2
  end;
  let source = read_file Sys.argv.(1) |> String.to_seq |> List.of_seq in
  if EnderChecker.complete_checker source then begin
    print_endline "accepted";
    exit 0
  end else begin
    print_endline "rejected";
    exit 1
  end
