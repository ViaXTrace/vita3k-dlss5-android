// Vita3K Android experimental neural-style screen reconstruction pass.
//
// This is intentionally a shader-only, no-cost approximation. It is not
// NVIDIA DLSS and does not contain any proprietary model or SDK code. The
// filter uses local luminance, edge direction, and adaptive sharpening to
// improve perceived detail after the emulator's existing upscale pass.

#version 450

layout(location = 0) in vec2 uv_frag;
layout(binding = 0) uniform sampler2D fb;

layout(location = 0) out vec3 color_frag;

layout(push_constant) uniform constants {
    vec2 inv_frame_size;
} pc;

float luminance(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
    vec2 texel = pc.inv_frame_size;
    vec3 center = texture(fb, uv_frag).rgb;

    vec3 north = texture(fb, uv_frag + vec2(0.0, -texel.y)).rgb;
    vec3 south = texture(fb, uv_frag + vec2(0.0, texel.y)).rgb;
    vec3 east = texture(fb, uv_frag + vec2(texel.x, 0.0)).rgb;
    vec3 west = texture(fb, uv_frag + vec2(-texel.x, 0.0)).rgb;
    vec3 north_east = texture(fb, uv_frag + vec2(texel.x, -texel.y)).rgb;
    vec3 north_west = texture(fb, uv_frag + vec2(-texel.x, -texel.y)).rgb;
    vec3 south_east = texture(fb, uv_frag + vec2(texel.x, texel.y)).rgb;
    vec3 south_west = texture(fb, uv_frag + vec2(-texel.x, texel.y)).rgb;

    float luma_center = luminance(center);
    float horizontal_gradient = abs(luminance(east) - luminance(west));
    float vertical_gradient = abs(luminance(north) - luminance(south));
    float edge_strength = clamp((horizontal_gradient + vertical_gradient) * 3.0, 0.0, 1.0);

    // Prefer the lower-contrast direction around edges. This limits halos
    // while still recovering small details in flat areas.
    vec3 directional_average;
    if (horizontal_gradient > vertical_gradient) {
        directional_average = (north + south + center * 2.0) * 0.25;
    } else {
        directional_average = (east + west + center * 2.0) * 0.25;
    }

    vec3 diagonal_average = (north_east + north_west + south_east + south_west) * 0.25;
    vec3 local_average = mix(diagonal_average, directional_average, edge_strength);
    vec3 detail = center - local_average;

    // Stronger reconstruction in low-texture regions, restrained on edges.
    float reconstruction_strength = mix(0.72, 0.38, edge_strength);
    vec3 reconstructed = center + detail * reconstruction_strength;

    // A small local-contrast lift approximates the perceptual "neural uplift"
    // effect without introducing a temporal history buffer or a model.
    float local_contrast = clamp(abs(luma_center - luminance(local_average)) * 2.0, 0.0, 1.0);
    reconstructed += detail * local_contrast * 0.20;

    color_frag = clamp(reconstructed, 0.0, 1.0);
}