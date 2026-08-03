{
  description = "Ender verified Rocq checker vertical slice";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    geocoq = {
      # Upstream's Rocq 9 port, merged 2025-11-17 and reverted the next day
      # (PRs 52 and 53) with no stated reason -- most likely because its
      # `intuition` and `Unshelve` fixes narrow GeoCoq's declared `coq >= 8.10`
      # support, which it has no CI to check.  Pinned here rather than tracking
      # master because master does not build on Rocq 9 at all: it fails at
      # `Coinc/Utils/arity.v` line 1, since Rocq 9 split out the standard
      # library and master still writes `Require Import Arith`.  The port
      # targets 9.0; the layers Ender uses build unchanged on 9.1 as well.
      url = "github:GeoCoq/GeoCoq/1b1e7ad51d9139b6c98cde48a4516b78546cae9d";
      flake = false;
    };
  };

  outputs = { self, nixpkgs, flake-utils, geocoq }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        coq = pkgs.coq_9_1;
        # Rocq 9 split the standard library out of the compiler, so every
        # derivation that compiles a `.v` file needs it explicitly.
        stdlib = pkgs.coqPackages_9_1.stdlib;
        coqLib = "lib/coq/${coq.coq-version}/user-contrib";

        mkGeoCoqPart = { pname, configure, dependencies ? [], patches ? [] }:
          pkgs.stdenvNoCC.mkDerivation {
            inherit pname;
            version = geocoq.shortRev or "unstable";
            src = geocoq;
            strictDeps = true;
            nativeBuildInputs = [ coq pkgs.gnumake stdlib ] ++ dependencies;
            buildInputs = [ stdlib ] ++ dependencies;
            inherit patches;
            COQPATH = pkgs.lib.concatStringsSep ":"
              (map (part: "${part}/${coqLib}") ([ stdlib ] ++ dependencies));
            configurePhase = ''
              runHook preConfigure
              patchShebangs ${configure}
              ./${configure}
              runHook postConfigure
            '';
            buildPhase = ''
              runHook preBuild
              make -j$NIX_BUILD_CORES
              runHook postBuild
            '';
            installPhase = ''
              runHook preInstall
              make install COQLIBINSTALL="$out/${coqLib}"
              runHook postInstall
            '';
          };

        geocoqCoinc = mkGeoCoqPart {
          pname = "geocoq-coinc";
          configure = "configure-coinc.sh";
        };
        geocoqAxioms = mkGeoCoqPart {
          pname = "geocoq-axioms";
          configure = "configure-axioms.sh";
          dependencies = [ geocoqCoinc ];
          # This historical example lives under Axioms but imports Main, so it
          # cannot be part of the foundational Axioms layer used by Ender.
          patches = [ ./nix/geocoq-axioms-layering.patch ];
        };
        geocoqMain = mkGeoCoqPart {
          pname = "geocoq-main";
          configure = "configure-main.sh";
          dependencies = [ geocoqCoinc geocoqAxioms ];
        };

        verifiedProofs = pkgs.stdenvNoCC.mkDerivation {
          pname = "ender-verified-proofs";
          version = "0.1.0";
          src = ./rocq;
          strictDeps = true;
          nativeBuildInputs = [
            coq pkgs.gnumake stdlib geocoqCoinc geocoqAxioms geocoqMain
          ];
          buildInputs = [ stdlib ];
          COQPATH = pkgs.lib.concatStringsSep ":" (map (part: "${part}/${coqLib}") [
            stdlib geocoqCoinc geocoqAxioms geocoqMain
          ]);
          buildPhase = ''
            runHook preBuild
            set -o pipefail
            make -j$NIX_BUILD_CORES test extract 2>&1 | tee build.log
            # Tests.v ends in `Print Assumptions`; those report "Axioms:" only
            # when a proof rests on one.  Some GeoCoq Euclidean routes do (see
            # euclidean_trisuma__bet in Geometry.v), so enforce rather than
            # merely print the result.
            if grep -q '^Axioms:' build.log; then
              echo "the verified checker now depends on an axiom:" >&2
              grep -A3 '^Axioms:' build.log >&2
              exit 1
            fi
            runHook postBuild
          '';
          installPhase = ''
            runHook preInstall
            mkdir -p "$out/share/ender/rocq" "$out/share/ender/extracted"
            cp Ender/*.v Ender/*.vo "$out/share/ender/rocq/"
            cp extracted/EnderChecker.ml extracted/EnderChecker.mli \
              "$out/share/ender/extracted/"
            runHook postInstall
          '';
        };

        nativeChecker = pkgs.stdenvNoCC.mkDerivation {
          pname = "ender-checker";
          version = "0.1.0";
          dontUnpack = true;
          strictDeps = true;
          nativeBuildInputs = [
            pkgs.stdenv.cc pkgs.ocamlPackages.ocaml pkgs.ocamlPackages.findlib
          ];
          buildInputs = [ pkgs.ocamlPackages.yojson ];
          buildPhase = ''
            runHook preBuild
            cp ${verifiedProofs}/share/ender/extracted/EnderChecker.ml .
            cp ${verifiedProofs}/share/ender/extracted/EnderChecker.mli .
            cp ${./rocq/runtime/main.ml} main.ml
            cp ${./rocq/runtime/report_json.ml} report_json.ml
            ocamlfind ocamlopt -package yojson -c EnderChecker.mli
            ocamlfind ocamlopt -package yojson -c EnderChecker.ml
            ocamlfind ocamlopt -package yojson -c report_json.ml
            ocamlfind ocamlopt -package yojson -linkpkg -o ender-checker \
              EnderChecker.cmx report_json.cmx main.ml
            runHook postBuild
          '';
          installPhase = ''
            runHook preInstall
            mkdir -p "$out/bin"
            cp ender-checker "$out/bin/"
            runHook postInstall
          '';
        };

        wasmChecker = pkgs.stdenvNoCC.mkDerivation {
          pname = "ender-checker-wasm";
          version = "0.1.0";
          dontUnpack = true;
          strictDeps = true;
          nativeBuildInputs = [
            pkgs.ocamlPackages.ocaml
            pkgs.ocamlPackages.findlib
            pkgs.ocamlPackages."wasm_of_ocaml-compiler"
            pkgs.binaryen
          ];
          buildInputs = [ pkgs.ocamlPackages.yojson pkgs.ocamlPackages.js_of_ocaml ];
          buildPhase = ''
            runHook preBuild
            cp ${verifiedProofs}/share/ender/extracted/EnderChecker.ml .
            cp ${verifiedProofs}/share/ender/extracted/EnderChecker.mli .
            cp ${./rocq/runtime/main.ml} main.ml
            cp ${./rocq/runtime/report_json.ml} report_json.ml
            cp ${./rocq/runtime/wasm_api.ml} wasm_api.ml
            ocamlfind ocamlc -package yojson -c EnderChecker.mli
            ocamlfind ocamlc -package yojson -c EnderChecker.ml
            ocamlfind ocamlc -package yojson -c report_json.ml
            ocamlfind ocamlc -package yojson -linkpkg -o ender-checker.byte \
              EnderChecker.cmo report_json.cmo main.ml
            wasm_of_ocaml ender-checker.byte -o ender-checker.js
            ocamlfind ocamlc -package yojson,js_of_ocaml -c wasm_api.ml
            ocamlfind ocamlc -package yojson,js_of_ocaml -linkpkg \
              -o ender-checker-api.byte EnderChecker.cmo report_json.cmo wasm_api.cmo
            wasm_of_ocaml ender-checker-api.byte -o ender-checker-api.js
            substituteInPlace ender-checker-api.js \
              --replace-fail 'require.main.filename' '__filename'
            runHook postBuild
          '';
          installPhase = ''
            runHook preInstall
            mkdir -p "$out/share/ender-checker-wasm"
            cp ender-checker.js "$out/share/ender-checker-wasm/"
            cp -r ender-checker.assets "$out/share/ender-checker-wasm/"
            cp ender-checker-api.js "$out/share/ender-checker-wasm/"
            cp -r ender-checker-api.assets "$out/share/ender-checker-wasm/"
            runHook postInstall
          '';
        };

        tutorialOutput = pkgs.writeText "ender-tutorial-output.json" ''
          {
            "isCorrect": true,
            "issues": []
          }
        '';
        tutincOutput = pkgs.writeText "ender-tutinc-output.json" ''
          {
            "isCorrect": false,
            "issues": [
              {
                "type": 12,
                "code": "reason_dep_type_mismatch",
                "details": {
                  "reason": "sss",
                  "index": 1,
                  "ref": "2",
                  "expectedType": "con_seg",
                  "allowedTypes": [
                    "ref_seg"
                  ],
                  "receivedType": "con_ang",
                  "steps": [
                    "4"
                  ]
                }
              }
            ]
          }
        '';

        integrationTests = pkgs.runCommand "ender-checker-tests" {
          nativeBuildInputs = [ nativeChecker pkgs.nodejs_24 pkgs.jq ];
        } ''
          ender-checker ${./src/checker/proofs/examples/tutorial.txt} > native-tutorial.json
          diff -u ${tutorialOutput} native-tutorial.json
          ender-checker --report ${./src/checker/proofs/examples/tutorial.txt} \
            | jq -e '.verdict == "accepted" and
                     .problem.conclusion == "con_tri(t_ABC,t_ADC)" and
                     (.presentation.steps | length > 0) and
                     (.steps | type == "array") and (.graph | type == "object") and
                     (.duplicates | type == "array") and (.goal | type == "object") and
                     (.diagnostics | type == "array")' >/dev/null
          if ender-checker ${./src/checker/proofs/examples/tutinc.txt} > native-tutinc.json; then
            echo "invalid SSS proof was accepted" >&2
            exit 1
          fi
          diff -u ${tutincOutput} native-tutinc.json
          node ${wasmChecker}/share/ender-checker-wasm/ender-checker.js \
            ${./src/checker/proofs/examples/tutorial.txt} > wasm-tutorial.json
          diff -u ${tutorialOutput} wasm-tutorial.json
          if node ${wasmChecker}/share/ender-checker-wasm/ender-checker.js \
              ${./src/checker/proofs/examples/tutinc.txt} > wasm-tutinc.json; then
            echo "Wasm checker accepted invalid SSS proof" >&2
            exit 1
          fi
          diff -u ${tutincOutput} wasm-tutinc.json
          node ${./rocq/runtime/test_wasm_api.js} \
            ${wasmChecker}/share/ender-checker-wasm/ender-checker-api.js \
            ${./src/checker/proofs/examples/tutorial.txt} > wasm-api-tutorial.json
          diff -u ${tutorialOutput} wasm-api-tutorial.json
          find ${./src/checker/proofs} -name '*.txt' -print0 | while IFS= read -r -d $'\0' proof; do
            ender-checker --presentation "$proof" | jq -e 'type == "object"' >/dev/null
          done
          touch "$out"
        '';
      in {
        packages = {
          inherit geocoqCoinc geocoqAxioms geocoqMain verifiedProofs;
          ender-checker = nativeChecker;
          ender-checker-wasm = wasmChecker;
          default = nativeChecker;
        };

        checks = {
          proofs = verifiedProofs;
          integration = integrationTests;
        };

        apps.default = {
          type = "app";
          program = "${nativeChecker}/bin/ender-checker";
        };

        devShells.default = pkgs.mkShell {
          packages = [
            coq stdlib geocoqCoinc geocoqAxioms geocoqMain
            # VsRocq's language server loads the `.vo` files of whatever it is
            # editing, and those are locked to the compiler that built them, so
            # it has to be the one matching `coq` above rather than whichever
            # the editor happens to ship.  VsRocq prefers a `vsrocqtop` on the
            # PATH over its own, so launching the editor from this shell is
            # enough; see README.md.
            pkgs.coqPackages_9_1.vsrocq-language-server
            pkgs.gnumake pkgs.ocamlPackages.ocaml pkgs.ocamlPackages.findlib
            pkgs.ocamlPackages.yojson
            pkgs.ocamlPackages."wasm_of_ocaml-compiler" pkgs.binaryen
            pkgs.nodejs_24 nativeChecker
          ];
          COQPATH = pkgs.lib.concatStringsSep ":" (map (part: "${part}/${coqLib}") [
            stdlib geocoqCoinc geocoqAxioms geocoqMain
          ]);
          ENDER_CHECKER_WASM_DIR =
            "${wasmChecker}/share/ender-checker-wasm";
        };
      });
}
