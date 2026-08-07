ROCQFLAGS := -Q Ender Ender
MODULES := Audit Chars PublicParser PresentationParser Syntax Geometry Semantics Checker Parser CompleteChecker CertifiedAPI Tests
VOFILES := $(addprefix Ender/,$(addsuffix .vo,$(MODULES)))

# Everything this Makefile writes goes under $(BUILD); nothing lands beside the
# sources except the `.vo` files Rocq insists on putting there.
BUILD := _build
NATIVE := $(BUILD)/bin/ender-checker
WASMDIR := $(BUILD)/wasm

# Directory holding the extracted OCaml.  Override it with a directory that
# already contains `EnderChecker.ml` and `EnderChecker.mli` to compile the
# runtime without a Rocq toolchain in scope; the Nix packages do that, reusing
# the extraction from the proof build.  Left unset, extraction happens here and
# the rule below keeps it current with the sources.
EXTRACTED ?=
ifeq ($(strip $(EXTRACTED)),)
EXTRACTED := extracted
EXTRACT_HERE := yes
endif

.PHONY: all proofs test extract native wasm clean

# `all` is the whole verified checker: kernel-checked proofs, the axiom check,
# the extracted OCaml, and both compiled artifacts.  This is the same work the
# `ender-checker` and `ender-checker-wasm` Nix packages do.
all: proofs test extract native wasm

proofs: $(VOFILES)

test: Ender/Tests.vo

extract: $(EXTRACTED)/EnderChecker.ml

# Extraction is a side effect of checking Extract.v, so the `.ml` stands in for
# `Ender/Extract.vo` as the target; the `.mli` comes out of the same command.
ifdef EXTRACT_HERE
$(EXTRACTED)/EnderChecker.ml: Ender/Extract.v Ender/CertifiedAPI.vo
	rocq compile $(ROCQFLAGS) $<
	@touch $@
endif

native: $(NATIVE)

wasm: $(WASMDIR)/ender-checker-api.js

Ender/Audit.vo: Ender/Audit.v
	rocq compile $(ROCQFLAGS) $<

Ender/Chars.vo: Ender/Chars.v Ender/Audit.vo
	rocq compile $(ROCQFLAGS) $<

Ender/Syntax.vo: Ender/Syntax.v Ender/Audit.vo
	rocq compile $(ROCQFLAGS) $<

Ender/PublicParser.vo: Ender/PublicParser.v Ender/Audit.vo Ender/Chars.vo
	rocq compile $(ROCQFLAGS) $<

Ender/PresentationParser.vo: Ender/PresentationParser.v Ender/PublicParser.vo
	rocq compile $(ROCQFLAGS) $<

Ender/Geometry.vo: Ender/Geometry.v
	rocq compile $(ROCQFLAGS) $<

Ender/Semantics.vo: Ender/Semantics.v Ender/Syntax.vo Ender/Geometry.vo
	rocq compile $(ROCQFLAGS) $<

Ender/Checker.vo: Ender/Checker.v Ender/Syntax.vo Ender/Geometry.vo Ender/Semantics.vo
	rocq compile $(ROCQFLAGS) $<

Ender/Parser.vo: Ender/Parser.v Ender/Syntax.vo Ender/Semantics.vo Ender/Checker.vo
	rocq compile $(ROCQFLAGS) $<

Ender/CompleteChecker.vo: Ender/CompleteChecker.v Ender/Parser.vo Ender/PublicParser.vo Ender/PresentationParser.vo
	rocq compile $(ROCQFLAGS) $<

Ender/CertifiedAPI.vo: Ender/CertifiedAPI.v Ender/CompleteChecker.vo
	rocq compile $(ROCQFLAGS) $<

# Tests.v ends in `Print Assumptions`, which reports "Axioms:" only when a proof
# rests on one.  Some GeoCoq Euclidean routes do (see euclidean_trisuma__bet in
# Geometry.v), so enforce the result here rather than leave it to whoever reads
# the log.
Ender/Tests.vo: Ender/Tests.v Ender/CertifiedAPI.vo
	@mkdir -p $(BUILD)
	rocq compile $(ROCQFLAGS) $< > $(BUILD)/tests.log 2>&1; \
	  status=$$?; cat $(BUILD)/tests.log; [ $$status -eq 0 ] || exit $$status
	@if grep -q '^Axioms:' $(BUILD)/tests.log; then \
	  echo "the verified checker now depends on an axiom:" >&2; \
	  grep -A3 '^Axioms:' $(BUILD)/tests.log >&2; \
	  exit 1; \
	fi

# Both runtimes compile the extracted checker together with the hand-written
# entry points, in a scratch directory so the `.cm*` files stay out of the
# artifact directories.
$(NATIVE): $(EXTRACTED)/EnderChecker.ml runtime/main.ml runtime/report_json.ml
	rm -rf $(BUILD)/native
	mkdir -p $(BUILD)/native $(BUILD)/bin
	cp $(EXTRACTED)/EnderChecker.ml $(EXTRACTED)/EnderChecker.mli \
	  runtime/main.ml runtime/report_json.ml $(BUILD)/native/
	cd $(BUILD)/native && \
	  ocamlfind ocamlopt -package yojson -c EnderChecker.mli && \
	  ocamlfind ocamlopt -package yojson -c EnderChecker.ml && \
	  ocamlfind ocamlopt -package yojson -c report_json.ml && \
	  ocamlfind ocamlopt -package yojson -linkpkg -o ender-checker \
	    EnderChecker.cmx report_json.cmx main.ml
	cp $(BUILD)/native/ender-checker $@

# `ender-checker.js` is the command-line equivalent of the native binary;
# `ender-checker-api.js` installs the callable entry points on the global
# object for the browser and for Node.  wasm_of_ocaml writes each one's runtime
# assets into a sibling `.assets` directory, which has to travel with it.
$(WASMDIR)/ender-checker-api.js: $(EXTRACTED)/EnderChecker.ml runtime/main.ml \
    runtime/report_json.ml runtime/wasm_api.ml
	rm -rf $(BUILD)/wasm-obj $(WASMDIR)
	mkdir -p $(BUILD)/wasm-obj $(WASMDIR)
	cp $(EXTRACTED)/EnderChecker.ml $(EXTRACTED)/EnderChecker.mli \
	  runtime/main.ml runtime/report_json.ml runtime/wasm_api.ml \
	  $(BUILD)/wasm-obj/
	cd $(BUILD)/wasm-obj && \
	  ocamlfind ocamlc -package yojson -c EnderChecker.mli && \
	  ocamlfind ocamlc -package yojson -c EnderChecker.ml && \
	  ocamlfind ocamlc -package yojson -c report_json.ml && \
	  ocamlfind ocamlc -package yojson -linkpkg -o ender-checker.byte \
	    EnderChecker.cmo report_json.cmo main.ml && \
	  wasm_of_ocaml ender-checker.byte -o ender-checker.js && \
	  ocamlfind ocamlc -package yojson,js_of_ocaml -c wasm_api.ml && \
	  ocamlfind ocamlc -package yojson,js_of_ocaml -linkpkg \
	    -o ender-checker-api.byte \
	    EnderChecker.cmo report_json.cmo wasm_api.cmo && \
	  wasm_of_ocaml ender-checker-api.byte -o ender-checker-api.js
	# The generated loader locates its Wasm through `require.main.filename`,
	# which is null when Node loads it as a library rather than as the entry
	# script.  Fail loudly if a wasm_of_ocaml update stops emitting it.
	grep -q 'require\.main\.filename' $(BUILD)/wasm-obj/ender-checker-api.js
	sed 's/require\.main\.filename/__filename/g' \
	  $(BUILD)/wasm-obj/ender-checker-api.js > $(WASMDIR)/ender-checker-api.js
	cp $(BUILD)/wasm-obj/ender-checker.js $(WASMDIR)/
	cp -r $(BUILD)/wasm-obj/ender-checker.assets $(WASMDIR)/
	cp -r $(BUILD)/wasm-obj/ender-checker-api.assets $(WASMDIR)/

clean:
	find Ender -type f \( -name '*.vo' -o -name '*.vos' -o -name '*.vok' -o -name '*.glob' -o -name '*.aux' \) -delete
	rm -rf $(BUILD)
	rm -f extracted/EnderChecker.ml extracted/EnderChecker.mli
