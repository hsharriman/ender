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

let chars text = text |> Js.to_string |> String.to_seq |> List.of_seq

(* Proofs opened by external code, kept parsed so each question does not
   parse the proof again.  The caller closes them when done. *)
let sessions : (int, GhostChecker.reportData) Hashtbl.t = Hashtbl.create 8
let next_session = ref 0

(* Numbers cross the JavaScript boundary as JavaScript numbers. *)
let to_int n = int_of_float (Js.float_of_number n)
let of_int n = Js.number_of_float (float_of_int n)

let open_session source =
  of_int
    (match GhostChecker.CertifiedChecker.openSession (chars source) with
     | Some data ->
         incr next_session;
         Hashtbl.replace sessions !next_session data;
         !next_session
     | None -> -1)

let session_accepts id position reason conclusion =
  Js.bool
    (match Hashtbl.find_opt sessions (to_int id) with
     | Some data ->
         GhostChecker.CertifiedChecker.sessionAccepts data (to_int position)
           (chars reason) (chars conclusion)
     | None -> false)

let session_needs id position reason conclusion =
  Js.string
    (match Hashtbl.find_opt sessions (to_int id) with
     | Some data ->
         Yojson.Safe.to_string
           (Report_json.json_value
              (GhostChecker.CertifiedChecker.sessionNeeds data (to_int position)
                 (chars reason) (chars conclusion)))
     | None -> "null")

let session_matches id matcher expected actual =
  Js.bool
    (match Hashtbl.find_opt sessions (to_int id) with
     | Some data ->
         GhostChecker.CertifiedChecker.sessionMatches data (chars matcher)
           (chars expected) (chars actual)
     | None -> false)

let close_session id = Hashtbl.remove sessions (to_int id)

let () =
  Js.export "ghostOpenSession" (Js.wrap_callback open_session);
  Js.export "ghostSessionAccepts" (Js.wrap_callback session_accepts);
  Js.export "ghostSessionNeeds" (Js.wrap_callback session_needs);
  Js.export "ghostSessionMatches" (Js.wrap_callback session_matches);
  Js.export "ghostCloseSession" (Js.wrap_callback close_session);
  Js.export "ghostCheckProof" (Js.wrap_callback check_source);
  Js.export "ghostParsePresentation" (Js.wrap_callback parse_presentation);
  Js.export "ghostCheckReport" (Js.wrap_callback check_report)
