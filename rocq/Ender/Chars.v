(** Character-list utilities for the parsers.

    These are implementation conveniences, not part of the audit surface.  The
    executable parsers destructure text one character at a time, which the list
    library supports and [String] does not; [Audit.v] states the same lexical
    notions over [string] using [String.prefix], [String.index], and
    [String.substring], and nothing here is used to say what the checker
    claims. *)
From Stdlib Require Import Ascii String List Bool.
Require Import Ender.Audit.
Import ListNotations.

Definition chars := list ascii.

Fixpoint starts_with (prefix text : chars) : bool :=
  match prefix, text with
  | [], _ => true
  | _, [] => false
  | p :: ps, c :: cs => if Ascii.eqb p c then starts_with ps cs else false
  end.

Fixpoint drop_chars (n : nat) (text : chars) : chars :=
  match n, text with
  | O, _ => text
  | S _, [] => []
  | S n', _ :: rest => drop_chars n' rest
  end.

Fixpoint find_after (marker text : chars) : option chars :=
  match text with
  | [] => if starts_with marker [] then Some [] else None
  | _ :: rest =>
      if starts_with marker text then Some (drop_chars (length marker) text)
      else find_after marker rest
  end.

Fixpoint take_before (marker text : chars) : option chars :=
  match text with
  | [] => if starts_with marker [] then Some [] else None
  | c :: rest =>
      if starts_with marker text then Some []
      else match take_before marker rest with
           | Some prefix => Some (c :: prefix)
           | None => None
           end
  end.

Fixpoint removeWhitespace (text : chars) : chars :=
  match text with
  | [] => []
  | c :: rest =>
      if Audit.whitespace c then removeWhitespace rest else c :: removeWhitespace rest
  end.

Fixpoint codeBeforeComment (text : chars) : chars :=
  match text with
  | "/"%char :: "/"%char :: _ => []
  | c :: rest => c :: codeBeforeComment rest
  | [] => []
  end.
