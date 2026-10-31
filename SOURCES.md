# Release sources and reproducibility

Applies to `v0.1.0-r11`. Release assets are at
<https://github.com/kai-wu-cortex/airsim-mu300/releases/tag/v0.1.0-r11>.
Download `airsim-mu300-0.1.0-r11-sources.tar.gz` alongside the binary package.
It contains plugin sources, the patched Agent and its notices, vendored Go sources,
audio driver/tool sources, ALSA sources, OpenWrt recipes and MU300 kernel build recipes.
No private signing keys, device state, user messages/audio or proprietary firmware are included.

## Source map

| Component | Exact source / build information |
| --- | --- |
| Plugin / bridge | This repository's release tag; `go.mod`, `go.sum`, `scripts/`, `packaging/` |
| AirSIM Agent | `kai-wu-cortex/AirSIM` commit `cc2ade3124ac34bec7d8c441f4b66a57a6dfec62`, plus `patches/AirSIM-mu300.patch` |
| MU300 Audio v1.0.5 | Preserved commit `ea03fba2e79684a729b16e4dc481316cf4ec2e39` in `kai-wu-cortex/mu300-audio`; includes full audio sources, patches, tools, Dockerfiles, `kernel/kits/kits.lock` |
| MU300 kernel build context | `dikeckaan/mu300-linux` `v2026.10.19.1`, commit `c760e49e28e872cc0a51a656f36206cecaaf091f`; kernel build/patch/config recipes used by the matching 5.4 kit |
| alsa-lib 1.2.11 | <https://www.alsa-project.org/files/pub/lib/alsa-lib-1.2.11.tar.bz2>, LGPL-2.1-or-later; COPYING retained |
| alsa-utils 1.2.11 | <https://www.alsa-project.org/files/pub/utils/alsa-utils-1.2.11.tar.bz2>, GPL-2.0-or-later; COPYING retained |
| OpenWrt package recipes | `openwrt/packages` commit `4f3530534ce198fdc90e7667502706e9ee179692`, `libs/alsa-lib/`, `sound/alsa-utils/` (version 1.2.11-r1) |
| Go libraries | Exact versions from each `go.mod` / `go.sum`; vendored source and upstream license/notice files included |

Archive hashes and URLs are pinned in `scripts/fetch-sources.sh`; binary dependency
hashes in `scripts/fetch-deps.sh`. The binary audio dependency is mirrored byte-for-byte
with its original checksum manifest because the original repository currently returns 404.

## Rebuilding the plugin

Follow README's build commands. There is no dependency on an unpublished sibling
`mu300-audio` checkout. Build from this repository plus the publicly pinned AirSIM
Git commit; the helper creates an isolated patched source tree. Custom builds must
use their own signing key and distribute its fingerprint separately. The private
release key is intentionally absent, so signed APK bytes are not reproducible.

The source bundle's `plugin/` and `AirSIM/` directories can be siblings. The bundled
AirSIM directory is a patched snapshot, not a Git repository: for the ordinary build
script clone the pinned upstream repo as documented, or compile the snapshot directly
with `CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build` inside `module/module-agent`.
Use the vendored modules to avoid resolving different dependency versions.

## Rebuilding audio and ALSA dependencies

The APK uses prebuilt upstream audio/ALSA artifacts; a plugin build does not silently
rebuild or replace kernel modules. Source/build recipes are supplied separately.

- MU300 audio: use the source archive's `kernel/build.sh 5.4`, `src/*/build.sh` and
  `tools/make-extra.sh`. Read its LICENSE and kernel/kits instructions first.
- The exact 5.4 kit is `kit-5.4.tar.xz`, SHA-256
  `447b4a6ef5fbc21b8574f2f86cc847fcf4db0521a726f313559503c0405b2efb`, originally
  `dikeckaan/mu300-audio` release `kits-v2026.10.19.1`.
  That original download is currently unavailable and the kit itself is not bundled.
  The audio source includes its kit-generation script; the MU300 Linux snapshot
  includes the matching kernel build/config/patch recipes and vendor source locations.
  Reconstruct the matching build tree and run `kernel/kits/make-kit-5.4.sh` as documented
  upstream, then verify configuration, kernel release and symbol CRCs before loading.
  Do not substitute a different 5.4 kernel. A fresh audio-driver rebuild has **not**
  been validated as part of this release; this limitation is distinct from the tested
  plugin build using the preserved binary dependency.
- ALSA: use the included tarballs plus the corresponding OpenWrt recipe directories
  in the OpenWrt 25.12.6 SDK for `aarch64_generic`, retaining recipe patches/options.
  They remain external executables/shared libraries below `/usr/lib/airsim/alsa/`,
  not statically linked into the noncommercial Go binaries. Modified compatible
  replacements may be built/installed without a plugin source-license restriction
  being applied to those separately licensed components.

The release does not supply the whole OpenWrt operating system or its toolchain.
System source and SDK provenance: <https://downloads.openwrt.org/releases/25.12.6/>.
Do not describe the entire firmware/toolchain as hermetic or bit-for-bit reproduced.

## Publishing discipline

Run tests, prepare the package, commit reviewed source, then run
`scripts/package-sources.sh` and publish its output together with the APK, public key,
installer and SHA256SUMS. Source archives remain available with the release, not
merely an offer to provide them later. Preserve every upstream notice and licence.
Never add `backups/`, `out/`, an entire workspace, or firmware to GitHub.
