{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    geocoq = {
      url = "github:GeoCoq/GeoCoq";
      flake = false;
    };
  };

  outputs =
    { nixpkgs, geocoq, ... }:
    let
      perSystem = nixpkgs.lib.genAttrs [ "x86_64-linux" "aarch64-linux" ] (
        system:
        let
          pkgs = import nixpkgs { inherit system; };
          inherit (pkgs) lib;
          version = "0.1.0";
          rocqPackages = pkgs.rocqPackages_9_1;
          rocq = rocqPackages.rocq-core;
          # GeoCoq's build script calls `coq_makefile` and `coqdep`, which only
          # the `coq_9_1` compatibility wrapper around the same compiler ships.
          # Its setup hook sets the deprecated `COQPATH`, so it is used for
          # GeoCoq alone; `rocq-core`'s sets `ROCQPATH` from `buildInputs`.
          coq = pkgs.coq_9_1;
          # Rocq 9 split the standard library out of the compiler, so every
          # derivation that compiles a `.v` file needs it explicitly.
          stdlib = rocqPackages.stdlib;
          # Rocq 9 still installs to `lib/coq`, whatever the tools are called.
          rocqLib = "lib/coq/${coq.coq-version}/user-contrib";
          # GeoCoq's algebraic model construction is written in MathComp, so the
          # non-vacuity witness needs MathComp on the load path.  MathComp 2.5
          # splits itself across one package per layer and none of them
          # re-exports the others' `.vo` files, so every layer the construction
          # touches is named here rather than pulled in through `mathcomp`, which
          # ships only `mathcomp/all`.  `mathcomp-real-closed` supplies
          # `realalg`, the concrete real closed field the model is built over.
          mathcomp = with rocqPackages; [
            mathcomp-boot
            mathcomp-order
            mathcomp-fingroup
            mathcomp-algebra
            mathcomp-solvable
            mathcomp-field
            mathcomp-character
            mathcomp-bigenough
            mathcomp-finmap
            mathcomp-real-closed
            hierarchy-builder
            rocq-elpi
            # Nixpkgs packages it only in the Coq set, built against the same
            # MathComp derivations as the Rocq set's.
            pkgs.coqPackages_9_1.mathcomp-algebra-tactics
          ];
          # Hierarchy Builder loads an OCaml plugin compiled with Rocq's compiler.
          ocamlPackages = coq.ocamlPackages;

          mkGeoCoqPart =
            {
              pname,
              configure,
              dependencies ? [ ],
            }:
            pkgs.stdenvNoCC.mkDerivation {
              inherit pname;
              version = geocoq.shortRev or "unstable";
              src = geocoq;
              strictDeps = true;
              nativeBuildInputs = [
                coq
                pkgs.gnumake
                stdlib
              ]
              ++ dependencies;
              buildInputs = [ stdlib ] ++ dependencies;
              ROCQPATH = lib.concatStringsSep ":" (map (part: "${part}/${rocqLib}") ([ stdlib ] ++ dependencies));
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
          };
          geocoqMain = mkGeoCoqPart {
            pname = "geocoq-main";
            configure = "configure-main.sh";
            dependencies = [
              geocoqCoinc
              geocoqAxioms
            ];
          };

          # `Algebraic/POF_to_Tarski.v` builds a Euclidean plane over any real
          # closed field, which is what makes `checker_sound` non-vacuous.
          geocoqAlgebraic = mkGeoCoqPart {
            pname = "geocoq-algebraic";
            configure = "configure-algebraic.sh";
            dependencies = [
              geocoqCoinc
              geocoqAxioms
              geocoqMain
            ]
            ++ mathcomp;
          };

          # Everything the Ghost development loads.  As `buildInputs` they reach
          # `ROCQPATH` through `rocq`'s setup hook and, for the `rocq-elpi`
          # plugin Hierarchy Builder loads, `OCAMLPATH` through findlib's.
          rocqLibraries = [
            stdlib
            geocoqCoinc
            geocoqAxioms
            geocoqMain
            geocoqAlgebraic
          ]
          ++ mathcomp;

          rocqFiles = lib.fileset.unions [
            ./rocq/Makefile
            ./rocq/extracted/.gitignore
            (lib.fileset.fileFilter (file: file.hasExt "v") ./rocq/Ghost)
            ./rocq/runtime/main.ml
            ./rocq/runtime/report_json.ml
            ./rocq/runtime/test/integration.sh
            ./rocq/runtime/test/tutorial.expected.json
            ./rocq/runtime/test/tutinc.expected.json
            ./rocq/runtime/test/proofs/tutorial.txt
            ./rocq/runtime/test/proofs/tutinc.txt
          ];

          rocqSource = lib.fileset.toSource {
            root = ./rocq;
            fileset = rocqFiles;
          };

          verifiedProofs = pkgs.stdenvNoCC.mkDerivation {
            pname = "ghost-proofs";
            inherit version;
            src = rocqSource;
            strictDeps = true;
            nativeBuildInputs = [
              rocq
              ocamlPackages.findlib
              pkgs.gnumake
            ];
            buildInputs = rocqLibraries;
            # `make test` kernel-checks the development and fails if any proof,
            # or the non-vacuity witness, rests on an axiom.
            buildPhase = ''
              runHook preBuild
              make -j$NIX_BUILD_CORES test extract
              runHook postBuild
            '';
            installPhase = ''
              runHook preInstall
              mkdir -p "$out/share/ghost/rocq" "$out/share/ghost/extracted"
              cp Ghost/*.v Ghost/*.vo "$out/share/ghost/rocq/"
              cp extracted/GhostChecker.ml extracted/GhostChecker.mli \
                "$out/share/ghost/extracted/"
              runHook postInstall
            '';
          };

          # Compile the extracted checker with the same Makefile as local builds.
          nativeChecker = pkgs.stdenvNoCC.mkDerivation {
            pname = "ghost-checker";
            inherit version;
            src = rocqSource;
            strictDeps = true;
            nativeBuildInputs = [
              pkgs.stdenv.cc
              pkgs.gnumake
              ocamlPackages.ocaml
              ocamlPackages.findlib
            ];
            buildInputs = [ ocamlPackages.yojson ];
            makeFlags = [
              "EXTRACTED=${verifiedProofs}/share/ghost/extracted"
            ];
            buildFlags = [ "native" ];
            installPhase = ''
              runHook preInstall
              mkdir -p "$out/bin"
              cp _build/bin/ghost-checker "$out/bin/"
              runHook postInstall
            '';
            meta.mainProgram = "ghost-checker";
          };

          artifactImage =
            (pkgs.dockerTools.buildLayeredImage {
              name = "ghost-checker";
              tag = "artifact";
              compressor = "none";
              config = {
                Entrypoint = [ (lib.getExe nativeChecker) ];
                Cmd = [ "-" ];
                User = "65534:65534";
              };
            }).overrideAttrs
              {
                name = "ghost-docker-${system}.tar";
              };
        in
        {
          package = artifactImage;
          proofs = verifiedProofs;
        }
      );
    in
    {
      packages = builtins.mapAttrs (_: outputs: { default = outputs.package; }) perSystem;
      checks = builtins.mapAttrs (_: outputs: { inherit (outputs) proofs; }) perSystem;
    };
}
