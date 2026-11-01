# Current-kernel OpenWrt audio recovery (candidate)

This is an independent integration, not an official MU300 Linux/Audio release.
It keeps the installed OpenWrt system and kernel. `sources.json` pins recovered
ZTE kernel sources, the current system's build recipes, the preserved audio
repository and the old userspace archive. Original licences and notices apply.

The legacy audio bundle is **not** installed: its configuration differs from
the running kernel despite the same release string. No `MU300_AUDIO_ANY_BUILD`
bypass is accepted by the patched loader. No proprietary firmware is bundled.

`build-kernel.sh` runs inside a fresh Linux volume with clang/LLVM 12. It applies
the system release's kernel patches and checks the normalized configuration hash
before and after olddefconfig. Its Image is a build artifact, not a flash target.
`build-audio.sh` then builds the 23 old driver modules plus audio_reserve against
the reconstructed tree and symbol table. Neither script operates a device.

Container mounts:

- `/build`: dedicated `airsim-openwrt-audio-dev1` volume (not the Android volume).
- `/inputs`: directory containing the pinned `zte-b50db5b.tar.gz`.
- `/linux-reference`: extracted and hash-verified current system recipe.
- `/audio-reference`: isolated audio commit with `guard-reservation.patch` applied.
- `/recipe`: this directory, read-only.
- `/evidence`: generated build evidence. Configuration is reconstructed from the
  pinned system's stock config and Linux fragment, not copied from device state.

Run `bash /recipe/build-kernel.sh prepare`, then `compile`, then
`bash /recipe/build-audio.sh`. Check the exported symbol CRCs against the official
current-system modules, including module_layout, before any installation.
`python3 scripts/openwrt-audio.test.py` tests the patched candidate under
`out/openwrt-audio/audio-candidate` (override with `AIRSIM_AUDIO_SOURCE`).

The reservation patch waits for ownership of every page before DMA cache
maintenance, refuses to report ready after a cache-maintenance error, bounds
range parsing, and refuses to reclaim memory while an unreserved legacy audio_mem
driver is already loaded. Activation consequently requires a clean boot with
reservation before audio driver loading. Do not load it into the current legacy
driver session. Boot integration, rollback installation, ABI audit and real
bidirectional call acceptance remain pending. r15 remains unpublished.
