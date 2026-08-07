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
        # GeoCoq's algebraic model construction is written in MathComp, so the
        # non-vacuity witness needs MathComp on the load path.  MathComp 2.5
        # splits itself across one package per layer and none of them
        # re-exports the others' `.vo` files, so every layer the construction
        # touches is named here rather than pulled in through `mathcomp`, which
        # ships only `mathcomp/all`.  `mathcomp-real-closed` supplies
        # `realalg`, the concrete real closed field the model is built over.
        mathcomp = with pkgs.rocqPackages_9_1; [
          mathcomp-boot mathcomp-order mathcomp-fingroup mathcomp-algebra
          mathcomp-solvable mathcomp-field mathcomp-character
          mathcomp-bigenough mathcomp-finmap mathcomp-real-closed
          hierarchy-builder rocq-elpi
        ];
        # The OCaml that compiles the extracted checker has to be the one Rocq
        # itself was built with, because `rocq-elpi` is an OCaml plugin and
        # propagates that compiler's findlib.  A dev shell holding both it and
        # `pkgs.ocamlPackages` puts two findlibs on `OCAMLPATH`, and nixpkgs'
        # findlib setup hook refuses to build such a shell at all.  Taking the
        # set from `rocq` rather than naming a version keeps the two in step on
        # their own.
        ocamlPackages = rocq.ocamlPackages;
        # One Node for the web package and the dev shell, so a build that works
        # in one works in the other.
        nodejs = pkgs.nodejs_24;

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

        # `Algebraic/POF_to_Tarski.v` builds a Euclidean plane over any real
        # closed field, which is what makes `checker_sound` non-vacuous.
        # Upstream wrote it against MathComp 2.4 and it does not compile
        # against the 2.5 this Nixpkgs ships; the patch carries the three fixes
        # and trims the layer to the two files the model needs.
        geocoqAlgebraic = mkGeoCoqPart {
          pname = "geocoq-algebraic";
          configure = "configure-algebraic.sh";
          dependencies = [ geocoqCoinc geocoqAxioms geocoqMain ] ++ mathcomp;
          patches = [ ./nix/geocoq-algebraic-mathcomp25.patch ];
        };

        verifiedProofs = pkgs.stdenvNoCC.mkDerivation {
          pname = "ender-verified-proofs";
          version = "0.1.0";
          src = ./rocq;
          strictDeps = true;
          nativeBuildInputs = [
            rocq pkgs.gnumake stdlib geocoqCoinc geocoqAxioms geocoqMain
            geocoqAlgebraic
          ] ++ mathcomp;
          # Rocq-elpi is an OCaml plugin, and `CertifiedAPI.v` loads it through
          # Hierarchy Builder.  Its findlib dependencies reach `OCAMLPATH` from
          # `buildInputs`, so naming MathComp only as a native input would put
          # the `.vo` files on the load path but leave the plugin unloadable.
          buildInputs = [ stdlib ] ++ mathcomp;
          ROCQPATH = pkgs.lib.concatStringsSep ":" (map (part: "${part}/${rocqLib}") ([
            stdlib geocoqCoinc geocoqAxioms geocoqMain geocoqAlgebraic
          ] ++ mathcomp));
          # `make test` kernel-checks the development and fails if any proof has
          # come to rest on an axiom -- including the non-vacuity witness, which
          # `CertifiedAPI.v` now discharges as part of the audited contract.
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
            ocamlPackages.ocaml ocamlPackages.findlib
          ];
          buildInputs = [ ocamlPackages.yojson ];
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
            ocamlPackages.ocaml
            ocamlPackages.findlib
            ocamlPackages."wasm_of_ocaml-compiler"
            pkgs.binaryen
          ];
          buildInputs = [ ocamlPackages.yojson ocamlPackages.js_of_ocaml ];
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

        # `importNpmLock` builds `node_modules` from the `integrity` hashes
        # already recorded in package-lock.json, so nothing here has to be
        # regenerated when a dependency changes -- updating the lock file is the
        # whole update.
        # Passing the two files rather than `npmRoot = ./.` keeps the whole
        # repository out of this derivation's inputs.
        npmSources = pkgs.importNpmLock {
          package = pkgs.lib.importJSON ./package.json;
          packageLock = pkgs.lib.importJSON ./package-lock.json;
        };

        webApp = pkgs.buildNpmPackage {
          pname = "ender-web";
          version = "0.1.0";
          # Only what `vite build` reads, so that editing a proof script or the
          # Rocq sources does not invalidate this.
          src = pkgs.lib.fileset.toSource {
            root = ./.;
            fileset = pkgs.lib.fileset.unions [
              ./index.html
              ./package.json
              ./package-lock.json
              ./postcss.config.js
              ./public
              ./src
              ./tailwind.config.js
              ./tsconfig.json
              ./vite.config.ts
            ];
          };
          inherit nodejs;
          npmDeps = npmSources;
          inherit (pkgs.importNpmLock) npmConfigHook;
          # The one input the npm build cannot produce itself.
          ENDER_CHECKER_WASM_DIR = "${wasmChecker}/share/ender-checker-wasm";
          # `vite.config.ts` sets `base: "/ender/"` for GitHub Pages, so the
          # bundle only resolves its assets under that path.  Install it at that
          # path instead of rebuilding with a different base, so what gets served
          # here is byte-for-byte what gets deployed.
          installPhase = ''
            runHook preInstall
            mkdir -p "$out/share/ender-web"
            cp -r dist "$out/share/ender-web/ender"
            runHook postInstall
          '';
        };

        # The app is built for GitHub Pages, where `/ender` is the site root, so
        # a bare file server leaves `/` a 404.  Send it where the app actually
        # lives rather than making that the reader's problem.
        serveConfig = pkgs.writeText "ender-serve.toml" ''
          [advanced]

          [[advanced.redirects]]
          source = "/"
          destination = "/ender/"
          kind = 302
        '';

        # Serving the bundle is the missing half of `nix build .#ender-web`: a
        # `dist` in the store is not something anyone can open.  Proof checking
        # runs in the browser against the Wasm checker, so this needs no backend
        # -- but the solver and feedback agents do, and they are not part of it.
        serveApp = pkgs.writeShellApplication {
          name = "ender-serve";
          runtimeInputs = [ pkgs.static-web-server ];
          text = ''
            port="''${1:-3000}"
            echo "Ender is at http://localhost:$port/ender/" >&2
            echo "The solver and feedback agents need the Python backend and are" >&2
            echo "not served here; see README.md." >&2
            echo "Use Ctrl+C to stop this server." >&2
            # `/ender/harness` and `/ender/examples` are React Router paths with
            # no file behind them, so unmatched requests have to reach the app
            # rather than a 404 page.
            exec static-web-server --host 127.0.0.1 --port "$port" \
              --root ${webApp}/share/ender-web \
              --page-fallback ${webApp}/share/ender-web/ender/index.html \
              --config-file ${serveConfig}
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
          inherit geocoqCoinc geocoqAxioms geocoqMain geocoqAlgebraic
            verifiedProofs;
          ender-checker = nativeChecker;
          ender-checker-wasm = wasmChecker;
          ender-web = webApp;
          default = nativeChecker;
        };

        checks = {
          proofs = verifiedProofs;
          integration = integrationTests;
          web = webApp;
        };

        apps = {
          default = {
            type = "app";
            program = "${nativeChecker}/bin/ender-checker";
            meta.description = "Check a proof file with the verified checker";
          };
          serve = {
            type = "app";
            program = "${serveApp}/bin/ender-serve";
            meta.description = "Serve the Ender web interface on localhost";
          };
        };

        # The shell supplies dependencies and tools only -- never a prebuilt
        # piece of this repository.  Everything under `rocq/` is compiled from
        # the working tree by `make -C rocq`, so an edit to a `.v` file cannot
        # be masked by an artifact Nix built from an older commit, and someone
        # without Nix follows the same steps with their own toolchain.
        devShells.default = pkgs.mkShell {
          packages = [
            rocq stdlib geocoqCoinc geocoqAxioms geocoqMain geocoqAlgebraic
            # VsRocq's language server loads the `.vo` files of whatever it is
            # editing, and those are locked to the compiler that built them, so
            # it has to be the one matching `rocq` above rather than whichever
            # the editor happens to ship.  VsRocq prefers a `vsrocqtop` on the
            # PATH over its own, so launching the editor from this shell is
            # enough; see README.md.
            pkgs.rocqPackages_9_1.vsrocq-language-server
            pkgs.gnumake pkgs.stdenv.cc
            ocamlPackages.ocaml ocamlPackages.findlib
            ocamlPackages.yojson ocamlPackages.js_of_ocaml
            ocamlPackages."wasm_of_ocaml-compiler" pkgs.binaryen
            nodejs pkgs.jq
          ] ++ mathcomp;
          ROCQPATH = pkgs.lib.concatStringsSep ":" (map (part: "${part}/${rocqLib}") ([
            stdlib geocoqCoinc geocoqAxioms geocoqMain geocoqAlgebraic
          ] ++ mathcomp));
          # A convenience only: `make -C rocq native` puts the binary here, and
          # the Node, Vite, and script loaders find that directory on their own,
          # so nothing depends on this being set.
          shellHook = ''
            export PATH="$(git rev-parse --show-toplevel 2>/dev/null || pwd)/rocq/_build/bin:$PATH"
          '';
        };
      });
}
