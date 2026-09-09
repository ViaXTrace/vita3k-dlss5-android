# Vita3K Android — NSS / DLSS 5 research specification

Status: first implementation slice shipped as `NSS (Experimental)`.

## Positioning

The reference project [1-Click-DLSS5](https://github.com/reiluisii/1-Click-DLSS5)
is a Windows launcher/injector. Its implementation is organized around
profiles, game/API detection, injection modes, payload management, optical-flow
calibration, HUD feedback, and clean restoration. It is not the NVIDIA DLSS 5
SDK itself.

This fork must not claim to ship NVIDIA DLSS, use NVIDIA proprietary binaries,
or imply endorsement by NVIDIA. Vita3K remains GPL-2.0-or-later under the
upstream project terms.

## No-cost Android strategy

The first Android path is Vulkan-first and uses only code already available in
the repository plus original shaders:

1. Keep the existing Vita3K renderer and present path.
2. Add an opt-in screen reconstruction pass named `NSS (Experimental)`.
3. Use a shader-only spatial pass for the first release. It uses local
   luminance, edge direction, adaptive reconstruction, and restrained
   sharpening; it is an approximation, not a neural network.
4. Preserve Bilinear, Bicubic, FXAA, and FSR as fallbacks.
5. Avoid cloud inference, paid APIs, proprietary model downloads, and runtime
   network requirements.
6. Evaluate an optional local open model only in a later milestone. Any model
   must have a redistributable license, an Android GPU delegate path, and an
   explicit device-performance budget.

## Reference feature map

The following ideas from the Windows reference are adapted rather than copied:

| Reference capability | Android equivalent |
| --- | --- |
| Direct injection into a native DLSS title | Renderer-level post-process pass |
| OptiScaler bridge | Backend-independent filter selection with Vulkan first |
| Universal feeder | Final-frame screen filter when no temporal inputs exist |
| Game discovery | Per-title configuration stored by Vita3K |
| API detection | Renderer/backend capability checks |
| Optical-flow calibration | Future motion-vector or frame-history input; not faked in v0.1 |
| HUD / live status | Future in-game debug overlay with cost and frame-time data |
| Clean factory restore | One setting switch back to Bilinear/FSR |

## Target controls

The settings surface should eventually expose:

- Enable/disable the experimental pass.
- Reconstruction strength.
- Sharpening strength.
- Exposure and tone response.
- Preserve-aspect-ratio behavior.
- Per-game profiles with a safe default.
- Debug view: original, reconstructed, edge confidence, and difference.
- Automatic fallback after shader/pipeline failure.
- Frame-time and GPU cost reporting.

The first slice exposes the pass as a normal screen-filter choice and leaves
the existing configuration persistence intact. Additional controls should be
added only after measuring them on real Android GPUs.

## Validation gates

- Vulkan device supports the existing Vita3K screen-filter pipeline.
- Unsupported or failing devices remain on the existing filters.
- No external service is required to run the feature.
- Release artifacts are built by public-repository GitHub Actions.
- The release notes state clearly that NSS is an experimental approximation.

## Planned milestones

### v0.1 — shipped in this repository

- Android Vita3K base imported.
- Vulkan `NSS (Experimental)` selectable in GPU settings.
- Original shader source included and compiled into the Android assets.
- Reproducible debug APK workflow and tagged release workflow.

### v0.2 — temporal research

- Frame-history resource with motion rejection.
- Optional motion-vector input where the emulator can provide it.
- Per-game profile fields and an on-screen cost overlay.

### v0.3 — optional local neural model evaluation

- Benchmark a small open model on representative Adreno, Mali, and
  Immortalis devices.
- Prefer Vulkan compute or Android GPU delegate only when it beats the
  shader-only pass on latency and energy.
- Ship no model unless license, package size, thermal behavior, and quality are
  acceptable.