export const compositeVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

export const compositeFragment = /* glsl */ `
precision highp float;
uniform sampler2D uDye;
uniform sampler2D uVelocity;
uniform float uTime;
uniform float uAspect;
uniform vec2 uFocus;
uniform vec2 uLight;
uniform vec3 uP0;
uniform vec3 uP1;
uniform vec3 uP2;
uniform vec4 uModes;
uniform float uWarp;
uniform float uSpeed;
uniform float uScale;
uniform float uDensity;
uniform float uGrain;
uniform float uSaturation;
uniform float uStretch;
uniform sampler2D uShotA;
uniform sampler2D uShotB;
uniform vec4 uCardA;
uniform vec4 uCardB;
uniform float uRevealA;
uniform float uRevealB;
uniform float uStir;
uniform float uKick;
uniform float uHat;
uniform float uAudio;
varying vec2 vUv;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = x0.x > x0.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 3; i++) {
    s += a * snoise(p);
    p = r * p * 2.02;
    a *= 0.5;
  }
  return s;
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

float roundedBox(vec2 p, vec2 size, float r) {
  vec2 q = abs(p) - size * 0.5 + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

vec4 card(sampler2D tex, vec4 rect, float reveal, vec2 uv, vec2 vel, float field, vec2 aspect, out float dist) {
  vec2 disp = vel * 0.00035 * uStir + (1.0 - reveal) * (vec2(field, 1.0 - field) - 0.5) * 0.12;
  vec2 luv = clamp((uv + disp - rect.xy) / rect.zw * 0.5 + 0.5, 0.0, 1.0);
  dist = roundedBox((uv - rect.xy) * aspect, rect.zw * aspect * 2.0, 0.018);
  float inside = smoothstep(0.0015, -0.0015, dist);
  float condense = smoothstep(field - 0.12, field + 0.12, reveal * 1.3 - 0.15);
  return vec4(texture2D(tex, luv).rgb * 0.92, inside * condense);
}

vec3 ramp(float d) {
  vec3 c = mix(uP0, uP1, smoothstep(0.0, 0.55, d));
  return mix(c, uP2, smoothstep(0.55, 1.0, d));
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uAspect, 1.0);
  vec2 dp = (uv - uFocus) * aspect;
  vec2 vel = texture2D(uVelocity, uv).xy;
  vec2 p = dp * uScale * 0.75 - vel * 0.0007;
  p = vec2(p.x / uStretch, p.y * uStretch);
  float t = uTime * uSpeed * 0.12;

  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  float w = uWarp * 0.55;
  vec2 r = vec2(fbm(p + w * q + vec2(1.7, 9.2) + 0.15 * t), fbm(p + w * q + vec2(8.3, 2.8) - 0.126 * t));
  float field = fbm(p + w * r) * 0.5 + 0.5;

  float focal = exp(-dot(dp, dp) * 2.2 / (uDensity * uDensity + 0.04));
  vec3 dye = texture2D(uDye, uv).rgb;
  float dyeAmount = clamp(length(dye), 0.0, 1.5);
  float dens = smoothstep(0.22, 1.0, field * (0.4 + 0.9 * focal)) * (0.15 + 0.85 * focal);
  dens = clamp(dens + dyeAmount * 0.6, 0.0, 1.2);

  vec3 base = ramp(dens);
  vec3 col = vec3(0.0);

  if (uModes.x > 0.001) {
    col += uModes.x * (base * dens * 1.1 + dye * 0.5);
  }
  if (uModes.y > 0.001) {
    float e = 0.012;
    vec2 grad = vec2(fbm(p + vec2(e, 0.0) + w * r), fbm(p + vec2(0.0, e) + w * r)) * 0.5 + 0.5 - field;
    vec3 n = normalize(vec3(-grad / e * 0.35 * smoothstep(0.02, 0.35, dens), 1.0));
    vec3 l = normalize(vec3(uLight, 0.9));
    float spec = pow(max(dot(reflect(-l, n), vec3(0.0, 0.0, 1.0)), 0.0), 36.0);
    float fres = pow(1.0 - n.z, 2.0);
    vec3 chroma = vec3(texture2D(uDye, uv + n.xy * 0.004).r, dye.g, texture2D(uDye, uv - n.xy * 0.004).b);
    col += uModes.y * (base * dens * 0.55 + (spec * 1.6 + fres * 0.8) * uP2 * smoothstep(0.05, 0.4, dens) + chroma * 0.4);
  }
  if (uModes.z > 0.001) {
    float bands = 0.5 + 0.5 * sin(field * 22.0 + r.x * 3.0 - t * 4.0);
    float sheen = pow(bands, 5.0);
    col += uModes.z * (base * dens * 0.55 + sheen * mix(uP1, uP2, bands) * dens * 1.3 + dye * 0.35);
  }
  if (uModes.w > 0.001) {
    float k = field * 12.0;
    float c = abs(fract(k) - 0.5);
    float line = 1.0 - smoothstep(0.0, fwidth(k) * 1.3, c);
    float scan = exp(-pow((uv.x - fract(uTime * 0.05) * 1.4 + 0.2) * 9.0, 2.0));
    float fade = smoothstep(0.02, 0.35, dens);
    col += uModes.w * (line * fade * mix(uP1, uP2, scan) * (0.7 + scan * 1.6) + base * dens * 0.12 + dye * 0.3);
  }

  float sat = mix(uSaturation, 1.0, smoothstep(0.35, 0.75, 0.5 + 0.5 * sin(uTime * 0.22 + uv.x * 2.4 - 1.5)));
  col = mix(vec3(dot(col, vec3(0.2126, 0.7152, 0.0722))), col, sat);

  col *= 1.0 + uKick * 0.35 + uAudio * 0.25;
  col += uP2 * uHat * 0.05 * dens;
  col += (hash(uv * 1024.0 + fract(uTime * 7.0)) - 0.5) * uGrain * 0.22;

  float distA = 1.0;
  float distB = 1.0;
  vec4 a = uRevealA > 0.001 ? card(uShotA, uCardA, uRevealA, uv, vel, field, aspect, distA) : vec4(0.0);
  vec4 b = uRevealB > 0.001 ? card(uShotB, uCardB, uRevealB, uv, vel, field, aspect, distB) : vec4(0.0);
  float shadow = uRevealA * smoothstep(0.09, 0.0, distA) + uRevealB * smoothstep(0.09, 0.0, distB);
  col *= 1.0 - 0.6 * clamp(shadow, 0.0, 1.0);
  col = mix(col, a.rgb, a.a);
  col = mix(col, b.rgb, b.a);

  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`
