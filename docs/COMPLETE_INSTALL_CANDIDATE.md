# One-install audio candidate — not published

The public r16 APK still installs only the plugin. This candidate integrates the
previously audited audio extension into a signed APK. Do not overwrite the public
r16 assets or describe this candidate as hardware-accepted.

The intended flow is: install one APK, automatically verify/select its audio
profile, fetch missing firmware from the upstream owner's pinned URL, back up and
stage the extension, and show either ready, reboot required or failed. If a clean
OpenWrt boot is required, the user arranges it once; an early reservation service
and a later setup service continue preparation automatically. No automatic reboot,
partition write, call, recording, forced ABI bypass or system/kernel replacement.

The current candidate has only the exact 5.4.254 / configuration profile already
tested on U30 Air. The command-line installer rejects other kernels/configurations
before installing the package. APK hooks also stop audio preparation on a mismatch;
APK itself may retain package files even when a hook reports failure, so preparation
status and successful service startup, not package presence, determine readiness.
Existing matching recovery files are reused;
unknown extensions and custom preparation overrides are preserved and rejected
for automatic replacement. This is not a generic 1031-or-newer compatibility rule.

The requested F50 7.2.8 path is not implemented or tested. The preserved upstream
has mainline driver sources, but its pinned 7.2 kit is 7.2.12, not 7.2.8. Target
kernel configuration, build provenance, modem symbols and hardware access are
needed before adding an installation profile. A successful preflight cannot
replace user confirmation of real bidirectional calls on that device.

The upstream firmware source remains accessible (checked 2026-11-01):
`dikeckaan/mu300-audio-firmware`, release v1.0, asset agdsp.bin, 6291456 bytes,
SHA-256 `378ceea78dbf013e10625e71efd6fab487d727e371884ae8daf078da2828b937`.
The installer downloads it directly from the upstream owner's HTTPS endpoint;
the APK does not redistribute firmware or copy a user's device firmware.

Build in an isolated checkout, using the public r16 audio asset whose digest is
hard-coded and checked by the packager:

```sh
AIRSIM_COMPLETE_INSTALL=1 \
AIRSIM_AUDIO_BUNDLE=/absolute/path/to/airsim-audio-0.1.0-r16.tar.gz \
sh scripts/package-apk.sh
```

The result is a local r17 candidate for testing, not an update
to the public release. A distinct release revision and complete-install hardware
acceptance are required before public distribution. Preserve the bundled audio
source archive and original component notices alongside any eventual release.
