{
  description = "Ender verified Rocq checker vertical slice";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    geocoq = {
      url = "github:GeoCoq/GeoCoq";
      flake = false;
    };
  };

  outputs = { self, nixpkgs, flake-utils, geocoq }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        coq = pkgs.coq_8_20;
        coqLib = "lib/coq/${coq.coq-version}/user-contrib";

        mkGeoCoqPart = { pname, configure, dependencies ? [], patches ? [] }:
          pkgs.stdenvNoCC.mkDerivation {
            inherit pname;
            version = geocoq.shortRev or "unstable";
            src = geocoq;
            strictDeps = true;
            nativeBuildInputs = [ coq pkgs.gnumake ] ++ dependencies;
            buildInputs = dependencies;
            inherit patches;
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
          nativeBuildInputs = [ coq pkgs.gnumake geocoqCoinc geocoqAxioms geocoqMain ];
          COQPATH = pkgs.lib.concatStringsSep ":" [
            "${geocoqCoinc}/${coqLib}"
            "${geocoqAxioms}/${coqLib}"
            "${geocoqMain}/${coqLib}"
          ];
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
            ocamlfind ocamlopt -package yojson -c EnderChecker.mli
            ocamlfind ocamlopt -package yojson -c EnderChecker.ml
            ocamlfind ocamlopt -package yojson -linkpkg -o ender-checker EnderChecker.cmx main.ml
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
          buildInputs = [ pkgs.ocamlPackages.yojson ];
          buildPhase = ''
            runHook preBuild
            cp ${verifiedProofs}/share/ender/extracted/EnderChecker.ml .
            cp ${verifiedProofs}/share/ender/extracted/EnderChecker.mli .
            cp ${./rocq/runtime/main.ml} main.ml
            ocamlfind ocamlc -package yojson -c EnderChecker.mli
            ocamlfind ocamlc -package yojson -c EnderChecker.ml
            ocamlfind ocamlc -package yojson -linkpkg -o ender-checker.byte EnderChecker.cmo main.ml
            wasm_of_ocaml ender-checker.byte -o ender-checker.js
            runHook postBuild
          '';
          installPhase = ''
            runHook preInstall
            mkdir -p "$out/share/ender-checker-wasm"
            cp ender-checker.js "$out/share/ender-checker-wasm/"
            cp -r ender-checker.assets "$out/share/ender-checker-wasm/"
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
          nativeBuildInputs = [ nativeChecker pkgs.nodejs_24 ];
        } ''
          ender-checker ${./src/checker/proofs/examples/tutorial.txt} > native-tutorial.json
          diff -u ${tutorialOutput} native-tutorial.json
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
            coq geocoqCoinc geocoqAxioms geocoqMain
            pkgs.gnumake pkgs.ocamlPackages.ocaml pkgs.ocamlPackages.findlib
            pkgs.ocamlPackages.yojson
            pkgs.ocamlPackages."wasm_of_ocaml-compiler" pkgs.binaryen
            pkgs.nodejs_24
          ];
          COQPATH = pkgs.lib.concatStringsSep ":" [
            "${geocoqCoinc}/${coqLib}"
            "${geocoqAxioms}/${coqLib}"
            "${geocoqMain}/${coqLib}"
          ];
        };
      });
}
