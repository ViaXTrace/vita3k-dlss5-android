# Vita3K Android — DLSS5 Free porting notes

This repository starts from the public Vita3K source and experiments with a
no-cost Android Vulkan post-processing path inspired by the visual goals of
DLSS 5.

## What the first version does

- Adds `DLSS5 Free` to the existing Vulkan screen-filter pipeline.
- Exposes the filter in the Android settings screen and the desktop settings
  list used by the shared renderer.
- Runs an edge-aware local contrast and sharpening pass as a fragment shader.
- Compiles the shader from readable GLSL during the GitHub Actions build.
- Keeps the project free of proprietary NVIDIA SDKs, remote inference, and
  paid services.

## Important technical boundary

The official DLSS 5 stack is a proprietary NVIDIA neural-rendering system
that depends on NVIDIA's supported hardware/software path and engine-provided
signals. The first Android version here cannot reproduce that model or its
neural reconstruction quality. It is therefore intentionally named
**DLSS5 Free** and should be evaluated as a lightweight post-process filter,
not as official DLSS.

The implementation point is Vita3K's existing Vulkan `ScreenFilter` pipeline.
That gives Android a real per-frame GPU pass without changing game assets or
requiring a second rendering backend.

## Reference-tool analysis

The public `1-Click-DLSS5` project organizes its PC workflow around three
injection modes:

1. direct injection for games with native DLSS;
2. an OptiScaler bridge for games exposing FSR 2/3 or XeSS;
3. a universal feeder for games without an upscaler, using screen-space motion
   and depth inputs.

It also emphasizes game discovery, graphics API detection, payload/profile
selection, launch integration, and clean restoration. Those ideas do not map
one-to-one to an emulator: Vita3K owns the renderer, so the Android equivalent
is an in-renderer filter selection with device capability checks. Motion-vector
and depth-aware reconstruction are reserved for a later phase because the
current filter contract only receives the resolved color image and viewport.

Reference:
<https://github.com/reiluisii/1-Click-DLSS5>

## Current Android support

The APK is built for the existing Vita3K Android target and keeps the upstream
ABI choices (`arm64-v8a` and `x86_64`). The shader is compiled with
`glslangValidator` on the GitHub-hosted runner and then copied into the APK
assets, so no generated binary shader needs to be checked in.

## Local build

The full Vita3K checkout is kept in this workspace under
`vita3k-dlss5-android/`. From that directory:

```bash
bash .ci/setup-android.sh
bash .ci/build-android.sh artifacts/local-android
```

The same sequence is used by `.github/workflows/android-release.yml` after it
checks out the small overlay repository and applies the patch to a fresh
Vita3K checkout.

## License and attribution

Vita3K remains GPLv2 as required by its upstream project and dependencies.
The added shader and integration code are distributed under the same project
license. NVIDIA trademarks and proprietary technologies remain the property of
their respective owners.