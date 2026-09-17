{
  lib,
  stdenvNoCC,
  bun,
  nodejs,
  makeWrapper,
  cacert,
}:
let
  # bun resolves platform-specific optional dependencies, so one installed tree
  # does not hash the same on every platform. A system with no recorded hash
  # fails here rather than building against a tree hashed for another machine.
  nodeModulesHashes = {
    x86_64-linux = "sha256-NwWJwG8q0C/qcnAJSgkcYb+xE441bYmQPozg3I4hsR0=";
  };

  system = stdenvNoCC.hostPlatform.system;

  nodeModulesHash =
    nodeModulesHashes.${system} or (throw ''
      halogenos-website: no dependency hash is recorded for ${system}.
      Build once with a placeholder hash and record the value nix reports.
    '');

  # Only the three files that decide what gets installed. Adding the application
  # sources here would make every edit to a component invalidate the hash and
  # force a fresh install from the network.
  dependencySources = lib.fileset.toSource {
    root = ../.;
    fileset = lib.fileset.unions [
      ../package.json
      ../bun.lock
      ../bunfig.toml
    ];
  };

  nodeModules = stdenvNoCC.mkDerivation {
    pname = "halogenos-website-node-modules";
    version = "0.0.0";

    src = dependencySources;

    nativeBuildInputs = [
      bun
      nodejs
    ];

    dontConfigure = true;

    buildPhase = ''
      runHook preBuild

      export HOME="$TMPDIR"
      export SSL_CERT_FILE=${cacert}/etc/ssl/certs/ca-bundle.crt

      # The manifest's postinstall hook is `nuxt prepare`, which generates
      # project files out of the application sources. Those sources are
      # deliberately not part of this derivation, so the hook is dropped here
      # and the build below runs it as part of `nuxt build` instead.
      node -e '
        const fs = require("fs")
        const manifest = JSON.parse(fs.readFileSync("package.json", "utf8"))
        delete manifest.scripts.postinstall
        fs.writeFileSync("package.json", JSON.stringify(manifest, null, 2))
      '

      bun install --frozen-lockfile --no-progress

      runHook postBuild
    '';

    installPhase = ''
      runHook preInstall
      mkdir -p $out
      cp -R node_modules $out/node_modules
      runHook postInstall
    '';

    # Shebangs stay as `/usr/bin/env` here. Patching them would bake a store
    # path into a hash that is meant to describe the published packages alone,
    # so the consumer below patches them instead.
    dontFixup = true;

    outputHashAlgo = "sha256";
    outputHashMode = "recursive";
    outputHash = nodeModulesHash;
  };
in
stdenvNoCC.mkDerivation {
  pname = "halogenos-website";
  version = "0.0.0";

  # An allowlist rather than an ignore list: a working copy carries an installed
  # node_modules, a previous .output and the Nitro cache under .data, and none
  # of those may reach a build started with `path:`.
  src = lib.fileset.toSource {
    root = ./..;
    fileset = lib.fileset.unions [
      ../app
      ../i18n
      ../public
      ../server
      ../shared
      ../bun.lock
      ../bunfig.toml
      ../eslint.config.mjs
      ../nuxt.config.ts
      ../package.json
      ../tsconfig.json
    ];
  };

  nativeBuildInputs = [
    bun
    nodejs
    makeWrapper
  ];

  configurePhase = ''
    runHook preConfigure

    cp -R ${nodeModules}/node_modules node_modules
    chmod -R u+w node_modules

    # Without this the build dies on node_modules/.bin/nuxt with
    # "/usr/bin/env: bad interpreter".
    patchShebangs node_modules

    runHook postConfigure
  '';

  buildPhase = ''
    runHook preBuild

    export HOME="$TMPDIR"
    export CI=true

    # Telemetry must stay off. With it on, Nuxt asks for consent on first run,
    # and opening that prompt needs a terminal the builder does not have, which
    # fails the build with ERR_TTY_INIT_FAILED.
    export NUXT_TELEMETRY_DISABLED=1

    bun run build

    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall

    mkdir -p $out/share/halogenos-website
    cp -R .output/* $out/share/halogenos-website/

    makeWrapper ${nodejs}/bin/node $out/bin/halogenos-website \
      --add-flags $out/share/halogenos-website/server/index.mjs

    runHook postInstall
  '';

  meta = {
    description = "The halogenOS website, built as a Nitro Node server";
    license = lib.licenses.mit;
    platforms = lib.attrNames nodeModulesHashes;
    mainProgram = "halogenos-website";
  };
}
