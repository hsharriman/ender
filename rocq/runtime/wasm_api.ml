open Js_of_ocaml

let check_source source =
  source |> Js.to_string |> String.to_seq |> List.of_seq
  |> Report_json.checker_output |> Js.string

let parse_presentation source =
  source |> Js.to_string |> String.to_seq |> List.of_seq
  |> Report_json.presentation_output |> Js.string

let check_report source =
  source |> Js.to_string |> String.to_seq |> List.of_seq
  |> Report_json.report_output |> Js.string

let () =
  Js.export "enderCheckProof" (Js.wrap_callback check_source);
  Js.export "enderParsePresentation" (Js.wrap_callback parse_presentation);
  Js.export "enderCheckReport" (Js.wrap_callback check_report)
