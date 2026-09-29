import {
  Camera,
  HalfFloatType,
  LinearFilter,
  Mesh,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  type IUniform,
  type Texture,
  type WebGLRenderer,
} from 'three'

const vertex = /* glsl */ `
uniform vec2 texelSize;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
void main() {
  vUv = uv;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const head = /* glsl */ `
precision highp float;
varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
`

const shaders = {
  splat: `${head}
uniform sampler2D uTarget;
uniform float aspect;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main() {
  vec2 p = vUv - point;
  p.x *= aspect;
  gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + exp(-dot(p, p) / radius) * color, 1.0);
}`,
  advect: `${head}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;
void main() {
  vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
  gl_FragColor = vec4(dissipation * texture2D(uSource, coord).xyz, 1.0);
}`,
  curl: `${head}
uniform sampler2D uVelocity;
void main() {
  float L = texture2D(uVelocity, vL).y;
  float R = texture2D(uVelocity, vR).y;
  float T = texture2D(uVelocity, vT).x;
  float B = texture2D(uVelocity, vB).x;
  gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`,
  vorticity: `${head}
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
void main() {
  float L = texture2D(uCurl, vL).x;
  float R = texture2D(uCurl, vR).x;
  float T = texture2D(uCurl, vT).x;
  float B = texture2D(uCurl, vB).x;
  float C = texture2D(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  gl_FragColor = vec4(texture2D(uVelocity, vUv).xy + force * dt, 0.0, 1.0);
}`,
  divergence: `${head}
uniform sampler2D uVelocity;
void main() {
  float L = texture2D(uVelocity, vL).x;
  float R = texture2D(uVelocity, vR).x;
  float T = texture2D(uVelocity, vT).y;
  float B = texture2D(uVelocity, vB).y;
  vec2 C = texture2D(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`,
  scale: `${head}
uniform sampler2D uTexture;
uniform float value;
void main() {
  gl_FragColor = value * texture2D(uTexture, vUv);
}`,
  pressure: `${head}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  gl_FragColor = vec4((L + R + B + T - texture2D(uDivergence, vUv).x) * 0.25, 0.0, 0.0, 1.0);
}`,
  gradient: `${head}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  gl_FragColor = vec4(texture2D(uVelocity, vUv).xy - vec2(R - L, T - B), 0.0, 1.0);
}`,
}

type Pass = keyof typeof shaders

const target = (w: number, h: number) =>
  new WebGLRenderTarget(w, h, {
    type: HalfFloatType,
    format: RGBAFormat,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    depthBuffer: false,
  })

class Double {
  read: WebGLRenderTarget
  write: WebGLRenderTarget
  constructor(w: number, h: number) {
    this.read = target(w, h)
    this.write = target(w, h)
  }
  swap() {
    ;[this.read, this.write] = [this.write, this.read]
  }
  dispose() {
    this.read.dispose()
    this.write.dispose()
  }
}

const PRESSURE_ITERATIONS = 20

export class FluidSim {
  readonly velocity: Double
  readonly dye: Double
  private readonly pressure: Double
  private readonly divergence: WebGLRenderTarget
  private readonly curlTarget: WebGLRenderTarget
  private readonly scene = new Scene()
  private readonly camera = new Camera()
  private readonly quad: Mesh
  private readonly materials: Record<Pass, ShaderMaterial>
  private readonly simTexel: Vector2
  aspect = 1

  constructor(simSize: number, dyeSize: number) {
    this.velocity = new Double(simSize, simSize)
    this.pressure = new Double(simSize, simSize)
    this.divergence = target(simSize, simSize)
    this.curlTarget = target(simSize, simSize)
    this.dye = new Double(dyeSize, dyeSize)
    this.simTexel = new Vector2(1 / simSize, 1 / simSize)
    this.materials = Object.fromEntries(
      (Object.keys(shaders) as Pass[]).map((k) => [
        k,
        new ShaderMaterial({
          vertexShader: vertex,
          fragmentShader: shaders[k],
          uniforms: { texelSize: { value: this.simTexel } },
          depthTest: false,
          depthWrite: false,
        }),
      ]),
    ) as Record<Pass, ShaderMaterial>
    this.quad = new Mesh(new PlaneGeometry(2, 2), this.materials.scale)
    this.quad.frustumCulled = false
    this.scene.add(this.quad)
  }

  private run(gl: WebGLRenderer, pass: Pass, out: WebGLRenderTarget, uniforms: Record<string, unknown>) {
    const m = this.materials[pass]
    for (const [k, v] of Object.entries(uniforms)) (m.uniforms[k] ??= { value: v } as IUniform).value = v
    this.quad.material = m
    gl.setRenderTarget(out)
    gl.render(this.scene, this.camera)
  }

  splat(gl: WebGLRenderer, x: number, y: number, dx: number, dy: number, color: Vector3, radius = 0.0025) {
    const common = { aspect: this.aspect, point: new Vector2(x, y), radius }
    this.run(gl, 'splat', this.velocity.write, { ...common, uTarget: this.velocity.read.texture, color: new Vector3(dx, dy, 0) })
    this.velocity.swap()
    this.run(gl, 'splat', this.dye.write, { ...common, uTarget: this.dye.read.texture, color, radius: radius * 1.6 })
    this.dye.swap()
  }

  step(gl: WebGLRenderer, dt: number, dyeDissipation: number) {
    const v = this.velocity
    this.run(gl, 'curl', this.curlTarget, { uVelocity: v.read.texture })
    this.run(gl, 'vorticity', v.write, { uVelocity: v.read.texture, uCurl: this.curlTarget.texture, curl: 18, dt })
    v.swap()
    this.run(gl, 'divergence', this.divergence, { uVelocity: v.read.texture })
    this.run(gl, 'scale', this.pressure.write, { uTexture: this.pressure.read.texture, value: 0.8 })
    this.pressure.swap()
    for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
      this.run(gl, 'pressure', this.pressure.write, { uPressure: this.pressure.read.texture, uDivergence: this.divergence.texture })
      this.pressure.swap()
    }
    this.run(gl, 'gradient', v.write, { uPressure: this.pressure.read.texture, uVelocity: v.read.texture })
    v.swap()
    this.run(gl, 'advect', v.write, { uVelocity: v.read.texture, uSource: v.read.texture, dt, dissipation: Math.pow(0.985, dt * 60) })
    v.swap()
    this.run(gl, 'advect', this.dye.write, { uVelocity: v.read.texture, uSource: this.dye.read.texture, dt, dissipation: Math.pow(dyeDissipation, dt * 60) })
    this.dye.swap()
    gl.setRenderTarget(null)
  }

  get dyeTexture(): Texture {
    return this.dye.read.texture
  }

  get velocityTexture(): Texture {
    return this.velocity.read.texture
  }

  dispose() {
    for (const d of [this.velocity, this.pressure, this.dye]) d.dispose()
    this.divergence.dispose()
    this.curlTarget.dispose()
    this.quad.geometry.dispose()
    Object.values(this.materials).forEach((m) => m.dispose())
  }
}
