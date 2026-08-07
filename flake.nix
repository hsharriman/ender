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
        # `rocqPackages_9_1.rocq-core` ships only `rocq` and `rocqchk`, but
        # GeoCoq's build script calls `coq_makefile` and `coqdep`, which live in
        # the `coq_9_1` compatibility wrapper around it.  Same compiler either
        # way, so the `.vo` files stay interchangeable.
        rocq = pkgs.coq_9_1;
        # Rocq 9 split the standard library out of the compiler, so every
        # derivation that compiles a `.v` file needs it explicitly.
        stdlib = pkgs.rocqPackages_9_1.stdlib;
        # Rocq 9 still installs to `lib/coq`, whatever the tools are called.
        rocqLib = "lib/coq/${rocq.coq-version}/user-contrib";

        mkGeoCoqPart = { pname, configure, dependencies ? [], patches ? [] }:
          pkgs.stdenvNoCC.mkDerivation {
            inherit pname;
            version = geocoq.shortRev or "unstable";
            src = geocoq;
            strictDeps = true;
            nativeBuildInputs = [ rocq pkgs.gnumake stdlib ] ++ dependencies;
            buildInputs = [ stdlib ] ++ dependencies;
            inherit patches;
            ROCQPATH = pkgs.lib.concatStringsSep ":"
              (map (part: "${part}/${rocqLib}") ([ stdlib ] ++ dependencies));
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
              make install COQLIBINSTALL="$out/${rocqLib}"
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
            rocq pkgs.gnumake stdlib geocoqCoinc geocoqAxioms geocoqMain
          ];
          buildInputs = [ stdlib ];
          ROCQPATH = pkgs.lib.concatStringsSep ":" (map (part: "${part}/${rocqLib}") [
            stdlib geocoqCoinc geocoqAxioms geocoqMain
          ]);
          # `make test` kernel-checks the development and fails if any proof has
          # come to rest on an axiom.
          buildPhase = ''
            runHook preBuild
            make -j$NIX_BUILD_CORES test extract
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

        # Both runtimes run the same `rocq/Makefile` rules a developer runs, with
        # `EXTRACTED` pointed at the proof build's extraction, so neither needs a
        # Rocq toolchain and neither repeats the kernel check.  Keeping the
        # commands in the Makefile rather than here is what stops these packages
        # from drifting away from what the dev shell produces.
        nativeChecker = pkgs.stdenvNoCC.mkDerivation {
          pname = "ender-checker";
          version = "0.1.0";
          src = ./rocq;
          strictDeps = true;
          nativeBuildInputs = [
            pkgs.stdenv.cc pkgs.gnumake
            pkgs.ocamlPackages.ocaml pkgs.ocamlPackages.findlib
          ];
          buildInputs = [ pkgs.ocamlPackages.yojson ];
          makeFlags = [
            "EXTRACTED=${verifiedProofs}/share/ender/extracted"
          ];
          buildFlags = [ "native" ];
          installPhase = ''
            runHook preInstall
            mkdir -p "$out/bin"
            cp _build/bin/ender-checker "$out/bin/"
            runHook postInstall
          '';
        };

        wasmChecker = pkgs.stdenvNoCC.mkDerivation {
          pname = "ender-checker-wasm";
          version = "0.1.0";
          src = ./rocq;
          strictDeps = true;
          nativeBuildInputs = [
            pkgs.gnumake
            pkgs.ocamlPackages.ocaml
            pkgs.ocamlPackages.findlib
            pkgs.ocamlPackages."wasm_of_ocaml-compiler"
            pkgs.binaryen
          ];
          buildInputs = [ pkgs.ocamlPackages.yojson pkgs.ocamlPackages.js_of_ocaml ];
          makeFlags = [
            "EXTRACTED=${verifiedProofs}/share/ender/extracted"
          ];
          buildFlags = [ "wasm" ];
          installPhase = ''
            runHook preInstall
            mkdir -p "$out/share"
            cp -r _build/wasm "$out/share/ender-checker-wasm"
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

        # The shell supplies dependencies and tools only -- never a prebuilt
        # piece of this repository.  Everything under `rocq/` is compiled from
        # the working tree by `make -C rocq`, so an edit to a `.v` file cannot
        # be masked by an artifact Nix built from an older commit, and someone
        # without Nix follows the same steps with their own toolchain.
        devShells.default = pkgs.mkShell {
          packages = [
            rocq stdlib geocoqCoinc geocoqAxioms geocoqMain
            # VsRocq's language server loads the `.vo` files of whatever it is
            # editing, and those are locked to the compiler that built them, so
            # it has to be the one matching `rocq` above rather than whichever
            # the editor happens to ship.  VsRocq prefers a `vsrocqtop` on the
            # PATH over its own, so launching the editor from this shell is
            # enough; see README.md.
            pkgs.rocqPackages_9_1.vsrocq-language-server
            pkgs.gnumake pkgs.stdenv.cc
            pkgs.ocamlPackages.ocaml pkgs.ocamlPackages.findlib
            pkgs.ocamlPackages.yojson pkgs.ocamlPackages.js_of_ocaml
            pkgs.ocamlPackages."wasm_of_ocaml-compiler" pkgs.binaryen
            pkgs.nodejs_24 pkgs.jq
          ];
          ROCQPATH = pkgs.lib.concatStringsSep ":" (map (part: "${part}/${rocqLib}") [
            stdlib geocoqCoinc geocoqAxioms geocoqMain
          ]);
          # A convenience only: `make -C rocq native` puts the binary here, and
          # the Node, Vite, and script loaders find that directory on their own,
          # so nothing depends on this being set.
          shellHook = ''
            export PATH="$(git rev-parse --show-toplevel 2>/dev/null || pwd)/rocq/_build/bin:$PATH"
          '';
        };
      });
}
