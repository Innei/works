import { BufferAttribute, BufferGeometry } from 'three'

export const frameVertex = /* glsl */ `
uniform vec4 uCardA;
uniform vec4 uCardB;
uniform vec2 uFocusA;
uniform vec2 uFocusB;
uniform float uHasA;
uniform float uHasB;
uniform float uRevealA;
uniform float uRevealB;
uniform float uT;
uniform float uAspect;
uniform float uTime;
uniform float uKick;
uniform float uPixel;
attribute float aS;
attribute vec3 aSeed;
varying float vAlpha;
varying float vTint;

vec2 perimeter(vec4 card, float s) {
  vec2 hs = vec2(card.z * uAspect, card.w);
  float w = hs.x * 2.0;
  float h = hs.y * 2.0;
  float d = fract(s) * 2.0 * (w + h);
  vec2 p;
  if (d < w) p = vec2(-hs.x + d, hs.y);
  else if (d < w + h) p = vec2(hs.x, hs.y - (d - w));
  else if (d < 2.0 * w + h) p = vec2(hs.x - (d - w - h), -hs.y);
  else p = vec2(-hs.x, -hs.y + (d - 2.0 * w - h));
  return card.xy + p / vec2(uAspect, 1.0);
}

vec2 scatter(vec2 focus, vec3 seed) {
  float a = seed.x * 6.28318 + uTime * 0.2 * (seed.z - 0.5);
  float r = 0.08 + seed.y * 0.28;
  return focus + vec2(cos(a) * r / uAspect, sin(a) * r);
}

vec2 anchor(vec4 card, vec2 focus, float has, float reveal, float s) {
  float gather = has * smoothstep(0.0, 0.85, reveal);
  return mix(scatter(focus, aSeed), perimeter(card, s), gather);
}

void main() {
  float s = aS + uTime * 0.004 * (0.5 + aSeed.z);
  vec2 a = anchor(uCardA, uFocusA, uHasA, uRevealA, s);
  vec2 b = anchor(uCardB, uFocusB, uHasB, uRevealB, s);
  float delay = aSeed.x * 0.45;
  float e = smoothstep(delay, delay + 0.55, uT);
  vec2 p = mix(a, b, e);
  float flight = sin(e * 3.14159);
  vec2 swirl = vec2(sin(aSeed.y * 40.0 + uTime * 0.7), cos(aSeed.z * 40.0 + uTime * 0.6));
  p += swirl * flight * (0.06 + aSeed.x * 0.14) / vec2(uAspect, 1.0);
  p += swirl * (0.0012 + uKick * 0.006) / vec2(uAspect, 1.0);

  float settled = mix(uHasA * uRevealA, uHasB * uRevealB, e);
  vAlpha = (0.25 + 0.75 * max(settled, flight)) * (0.55 + 0.45 * sin(uTime * 2.0 + aSeed.y * 30.0));
  float present = mix(uHasA, uHasB, e);
  vAlpha *= max(present, flight * max(uHasA, uHasB));
  vTint = aSeed.z;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = uPixel * (1.0 + aSeed.y * 1.6) * (1.0 + flight * 0.6 + uKick * 0.5);
}
`

export const frameFragment = /* glsl */ `
uniform vec3 uP1;
uniform vec3 uP2;
varying float vAlpha;
varying float vTint;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(mix(uP1, uP2, vTint) * 1.6 + 0.25, a * a * vAlpha);
}
`

export function frameGeometry(count: number) {
  const s = new Float32Array(count)
  const seed = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    s[i] = (i + Math.random() * 0.5) / count
    seed.set([Math.random(), Math.random(), Math.random()], i * 3)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3))
  g.setAttribute('aS', new BufferAttribute(s, 1))
  g.setAttribute('aSeed', new BufferAttribute(seed, 3))
  return g
}
