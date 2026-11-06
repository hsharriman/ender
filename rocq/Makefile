ROCQFLAGS := -Q Ghost Ghost
MODULES := Audit Chars PublicParser PresentationParser Syntax Geometry Inscribed Semantics Checker Parser Model CompleteChecker CertifiedAPI Tests
VOFILES := $(addprefix Ghost/,$(addsuffix .vo,$(MODULES)))

# Everything this Makefile writes goes under $(BUILD), except what Rocq insists
# on putting beside the sources (`.vo`, `.vos`, `.vok`, `.glob`) and the
# extracted OCaml in `extracted/`.
BUILD := _build
NATIVE := $(BUILD)/bin/ghost-checker
WASMDIR := $(BUILD)/wasm

# Directory holding the extracted OCaml.  Override it with a directory that
# already contains `GhostChecker.ml` and `GhostChecker.mli` to compile the
# runtime without a Rocq toolchain in scope; the Nix packages do that, reusing
# the extraction from the proof build.  Left unset, extraction happens here and
# the rule below keeps it current with the sources.
EXTRACTED ?=
ifeq ($(strip $(EXTRACTED)),)
EXTRACTED := extracted
EXTRACT_HERE := yes
endif

.PHONY: all proofs test extract native wasm check clean

# A recipe that fails partway must not leave its target looking up to date:
# `Tests.vo` is written before the axiom check below can reject it.
.DELETE_ON_ERROR:

# `all` is the whole verified checker: kernel-checked proofs, the axiom check,
# the extracted OCaml, and both compiled artifacts.  This is the same work the
# `ghost-checker` and `ghost-checker-wasm` Nix packages do.
all: proofs test extract native wasm

proofs: $(VOFILES)

test: Ghost/Tests.vo

extract: $(EXTRACTED)/GhostChecker.ml

# Extraction is a side effect of checking Extract.v, so the `.ml` stands in for
# `Ghost/Extract.vo` as the target; the `.mli` comes out of the same command.
ifdef EXTRACT_HERE
$(EXTRACTED)/GhostChecker.ml: Ghost/Extract.v Ghost/CertifiedAPI.vo
	rocq compile $(ROCQFLAGS) $<
	@touch $@
endif

native: $(NATIVE)

wasm: $(WASMDIR)/ghost-checker-api.js

Ghost/Audit.vo: Ghost/Audit.v
	rocq compile $(ROCQFLAGS) $<

Ghost/Chars.vo: Ghost/Chars.v Ghost/Audit.vo
	rocq compile $(ROCQFLAGS) $<

Ghost/Syntax.vo: Ghost/Syntax.v Ghost/Audit.vo
	rocq compile $(ROCQFLAGS) $<

Ghost/PublicParser.vo: Ghost/PublicParser.v Ghost/Audit.vo Ghost/Chars.vo
	rocq compile $(ROCQFLAGS) $<

Ghost/PresentationParser.vo: Ghost/PresentationParser.v Ghost/PublicParser.vo
	rocq compile $(ROCQFLAGS) $<

Ghost/Geometry.vo: Ghost/Geometry.v
	rocq compile $(ROCQFLAGS) $<

Ghost/Inscribed.vo: Ghost/Inscribed.v Ghost/Geometry.vo
	rocq compile $(ROCQFLAGS) $<

Ghost/Semantics.vo: Ghost/Semantics.v Ghost/Syntax.vo Ghost/Geometry.vo
	rocq compile $(ROCQFLAGS) $<

Ghost/Checker.vo: Ghost/Checker.v Ghost/Syntax.vo Ghost/Geometry.vo Ghost/Inscribed.vo Ghost/Semantics.vo
	rocq compile $(ROCQFLAGS) $<

Ghost/Parser.vo: Ghost/Parser.v Ghost/Syntax.vo Ghost/Semantics.vo Ghost/Checker.vo Ghost/PublicParser.vo
	rocq compile $(ROCQFLAGS) $<

# The only module needing MathComp and GeoCoq's algebraic layer on the load
# path; it reaches the rest of the build solely through CompleteChecker.vo.
Ghost/Model.vo: Ghost/Model.v
	rocq compile $(ROCQFLAGS) $<

Ghost/CompleteChecker.vo: Ghost/CompleteChecker.v Ghost/Parser.vo Ghost/PublicParser.vo Ghost/PresentationParser.vo Ghost/Model.vo
	rocq compile $(ROCQFLAGS) $<

Ghost/CertifiedAPI.vo: Ghost/CertifiedAPI.v Ghost/CompleteChecker.vo
	rocq compile $(ROCQFLAGS) $<

# Tests.v ends in `Print Assumptions`, which reports "Axioms:" only when a proof
# rests on one.  Some GeoCoq Euclidean routes do (see euclidean_trisuma__bet in
# Geometry.v), so enforce the result here rather than leave it to whoever reads
# the log.  The last of those lines is the non-vacuity witness, which needs the
# check as much as the theorems do: a plane exhibited on an axiom is no plane.
Ghost/Tests.vo: Ghost/Tests.v Ghost/CertifiedAPI.vo
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
$(NATIVE): $(EXTRACTED)/GhostChecker.ml runtime/main.ml runtime/report_json.ml
	rm -rf $(BUILD)/native
	mkdir -p $(BUILD)/native $(BUILD)/bin
	cp $(EXTRACTED)/GhostChecker.ml $(EXTRACTED)/GhostChecker.mli \
	  runtime/main.ml runtime/report_json.ml $(BUILD)/native/
	cd $(BUILD)/native && \
	  ocamlfind ocamlopt -package yojson -c GhostChecker.mli && \
	  ocamlfind ocamlopt -package yojson -c GhostChecker.ml && \
	  ocamlfind ocamlopt -package yojson -c report_json.ml && \
	  ocamlfind ocamlopt -package yojson -linkpkg -o ghost-checker \
	    GhostChecker.cmx report_json.cmx main.ml
	cp $(BUILD)/native/ghost-checker $@

# `ghost-checker-api.js` installs the callable entry points on the global
# object for the browser and for Node.  wasm_of_ocaml writes its runtime assets
# into a sibling `.assets` directory, which has to travel with it.
$(WASMDIR)/ghost-checker-api.js: $(EXTRACTED)/GhostChecker.ml \
    runtime/report_json.ml runtime/wasm_api.ml
	rm -rf $(BUILD)/wasm-obj $(WASMDIR)
	mkdir -p $(BUILD)/wasm-obj $(WASMDIR)
	cp $(EXTRACTED)/GhostChecker.ml $(EXTRACTED)/GhostChecker.mli \
	  runtime/report_json.ml runtime/wasm_api.ml $(BUILD)/wasm-obj/
	cd $(BUILD)/wasm-obj && \
	  ocamlfind ocamlc -package yojson -c GhostChecker.mli && \
	  ocamlfind ocamlc -package yojson -c GhostChecker.ml && \
	  ocamlfind ocamlc -package yojson -c report_json.ml && \
	  ocamlfind ocamlc -package yojson,js_of_ocaml -c wasm_api.ml && \
	  ocamlfind ocamlc -package yojson,js_of_ocaml -linkpkg \
	    -o ghost-checker-api.byte \
	    GhostChecker.cmo report_json.cmo wasm_api.cmo && \
	  wasm_of_ocaml ghost-checker-api.byte -o ghost-checker-api.js
	# The generated loader locates its Wasm through `require.main.filename`,
	# which is null when Node loads it as a library rather than as the entry
	# script.  Fail loudly if a wasm_of_ocaml update stops emitting it.
	grep -q 'require\.main\.filename' $(BUILD)/wasm-obj/ghost-checker-api.js
	sed 's/require\.main\.filename/__filename/g' \
	  $(BUILD)/wasm-obj/ghost-checker-api.js > $(WASMDIR)/ghost-checker-api.js
	cp -r $(BUILD)/wasm-obj/ghost-checker-api.assets $(WASMDIR)/

# Run both runtimes against the repository's proof files; needs `node` and
# `jq`.  `nix flake check` runs the same script against the Nix-built ones.
check: $(NATIVE) $(WASMDIR)/ghost-checker-api.js
	runtime/test/integration.sh $(NATIVE) $(WASMDIR) ../src/checker/proofs

clean:
	find Ghost -type f \( -name '*.vo' -o -name '*.vos' -o -name '*.vok' -o -name '*.glob' -o -name '*.aux' \) -delete
	rm -rf $(BUILD)
	rm -f extracted/GhostChecker.ml extracted/GhostChecker.mli
