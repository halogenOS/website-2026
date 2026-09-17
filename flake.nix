{
  description = "The halogenOS website";

  # The same branch the infrastructure flake that deploys this site pins, so the
  # two share one closure instead of each dragging in its own nixpkgs.
  inputs.nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-26.05";

  outputs =
    { nixpkgs, ... }:
    let
      lib = nixpkgs.lib;

      # Only the systems for which nix/package.nix records a dependency hash.
      supportedSystems = [ "x86_64-linux" ];

      forAllSystems = lib.genAttrs supportedSystems;
    in
    {
      packages = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          halogenos-website = pkgs.callPackage ./nix/package.nix { };
        in
        {
          inherit halogenos-website;
          default = halogenos-website;
        }
      );
    };
}
