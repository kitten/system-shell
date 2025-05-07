{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";

    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { nixpkgs, flake-utils, ags, ... } @ inputs: let
    inherit (flake-utils.lib) eachDefaultSystem;
    overlay = pkgs: let
      astal = ags.packages.${pkgs.system};
      extraPackages = with pkgs; [
        astal.hyprland
        astal.wireplumber
        astal.network
        astal.battery
        astal.notifd
        astal.apps
        astal.mpris
        brightnessctl
      ];
    in {
      astal = astal // {
        default = astal.default.override {
          inherit extraPackages;
        };
      };
      system-shell = ags.lib.bundle {
        inherit pkgs extraPackages;
        src = ./.;
        name = "system-shell";
        entry = "app.ts";
        gtk4 = true;
      };
    };
  in eachDefaultSystem (system: let
    pkgs = nixpkgs.legacyPackages.${system};
  in rec {
    packages = overlay pkgs;
    devShells.default = pkgs.mkShell {
      GSK_RENDERER = "ngl";
      buildInputs = with packages; [
        system-shell
        astal.notifd
        astal.default
      ];
    };
  }) // {
    overlays.default = super: self: overlay super;
  };
}
