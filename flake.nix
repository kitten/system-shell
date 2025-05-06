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
  in eachDefaultSystem (system: let
    pkgs = nixpkgs.legacyPackages.${system};
    astal = ags.packages.${system};
    extraPackages = with pkgs; [
      astal.hyprland
      astal.wireplumber
      astal.network
      astal.battery
      astal.notifd
      brightnessctl
    ];
  in {
    packages.default = ags.lib.bundle {
      inherit pkgs extraPackages;
      src = ./.;
      name = "system-shell";
      entry = "app.ts";
      gtk4 = true;
    };

    devShells.default = pkgs.mkShell {
      GSK_RENDERER = "ngl";
      buildInputs = [
        (astal.default.override {
          inherit extraPackages;
        })
      ];
    };
  });
}
