# Third-Party Licenses

Loka AI Router bundles the following open-source projects. Each project's
original LICENSE is preserved in `vendor/<name>/LICENSE`.

---

## RTK - Rust Token Killer

- Source: https://github.com/rtk-ai/rtk
- License: MIT
- Copyright: RTK Contributors
- Bundled as: binary (downloaded via postinstall to `~/.local/share/loka/bin/rtk` or `%APPDATA%\loka\bin\rtk.exe`)

## Headroom

- Source: https://github.com/headroom-ai/headroom
- License: MIT
- Copyright: Headroom Contributors
- Bundled as: `vendor/headroom/` (via `npm pack headroom-ai`)

## Caveman

- Source: https://github.com/JuliusBrussee/caveman
- License: MIT
- Copyright: Julius Brussee
- Bundled as: `vendor/caveman/` (git clone)

---

All three projects are used under their respective MIT licenses. Loka does
not modify their source code; it invokes them as tools.

To refresh vendored sources, run:

    node tools/sync-vendor.mjs
