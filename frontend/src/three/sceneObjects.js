import * as THREE from 'three'

// Deterministic PRNG so a given asteroid always gets the same rocky shape,
// starfield, and marker position instead of reshuffling every re-render.
export function mulberry32(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashSeed(id) {
  let x = Number(id) | 0
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b)
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b)
  x = x ^ (x >>> 16)
  return Math.abs(x) || 1
}

// Displaces every vertex of an icosahedron outward/inward by a seeded random
// amount so the asteroid reads as an irregular rock rather than a smooth ball.
// Neighboring vertices in an icosphere share index buckets loosely, so even
// per-vertex noise (no smoothing pass) still looks reasonably coherent at
// this poly count.
export function buildAsteroidGeometry(radius, seed) {
  const geometry = new THREE.IcosahedronGeometry(radius, 2)
  const rand = mulberry32(seed)
  const position = geometry.attributes.position
  const vertex = new THREE.Vector3()

  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i)
    const displacement = 1 + (rand() - 0.5) * 0.4
    vertex.multiplyScalar(displacement)
    position.setXYZ(i, vertex.x, vertex.y, vertex.z)
  }

  geometry.computeVertexNormals()
  return geometry
}

export function buildStarField(count, spread, seed) {
  const rand = mulberry32(seed)
  const positions = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    // Reject points too close to origin so stars don't spawn inside the globe.
    let x, y, z, distSq
    do {
      x = (rand() - 0.5) * spread
      y = (rand() - 0.5) * spread
      z = (rand() - 0.5) * spread
      distSq = x * x + y * y + z * z
    } while (distSq < 25)
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return geometry
}

// Renders text onto a canvas and returns a billboard Sprite showing it,
// used for the "EARTH" / asteroid-name labels floating in the 3D scene —
// avoids pulling in a text-geometry/font-loading pipeline for two labels.
export function buildLabelSprite(text, { color = '#e8a33d', fontSize = 64 } = {}) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const padding = 24

  ctx.font = `600 ${fontSize}px "JetBrains Mono Variable", ui-monospace, monospace`
  const width = Math.ceil(ctx.measureText(text).width) + padding * 2
  const height = fontSize + padding * 2
  canvas.width = width
  canvas.height = height

  ctx.font = `600 ${fontSize}px "JetBrains Mono Variable", ui-monospace, monospace`
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.letterSpacing = '2px'
  ctx.fillText(text, width / 2, height / 2 + 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  })
  const sprite = new THREE.Sprite(material)
  // Canvas is rendered at `fontSize` pixels for crisp text, but the scene's
  // world units are ~1 (Earth's radius) — without this correction the
  // sprite would come out several units wide, dwarfing the whole scene.
  const scale = 0.0035
  sprite.scale.set(width * scale, height * scale, 1)
  return sprite
}

// Builds a fresnel-ish rim glow by layering progressively larger, dimmer,
// backside-rendered spheres around a body — a cheap stand-in for a real
// fresnel shader that keeps the whole scene on basic/standard materials.
// `spread` controls how far the glow layers extend past `radius` (a tight
// atmosphere for Earth, a much wider corona for the sun).
export function buildGlowHalo(radius, color, spread = 0.16) {
  const group = new THREE.Group()
  const layers = [
    { r: radius * (1 + spread * 0.15), opacity: 0.35 },
    { r: radius * (1 + spread * 0.5), opacity: 0.16 },
    { r: radius * (1 + spread), opacity: 0.06 },
  ]
  for (const { r, opacity } of layers) {
    const geometry = new THREE.SphereGeometry(r, 32, 32)
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.BackSide,
      depthWrite: false,
    })
    group.add(new THREE.Mesh(geometry, material))
  }
  return group
}

// Paints a soft nebula field onto a canvas — a handful of seeded, colored
// radial blobs plus a star speckle — and returns it as an equirectangular
// texture for a giant backside sphere, i.e. a cheap galaxy skybox that
// doesn't require fetching an external texture.
function buildGalaxyTexture(seed) {
  const rand = mulberry32(seed)
  const width = 1024
  const height = 512
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#050506'
  ctx.fillRect(0, 0, width, height)

  const blobColors = [
    'rgba(142, 110, 255, 0.16)',
    'rgba(74, 140, 255, 0.13)',
    'rgba(232, 163, 61, 0.1)',
    'rgba(255, 255, 255, 0.05)',
  ]
  for (let i = 0; i < 26; i++) {
    const x = rand() * width
    const y = height * 0.2 + rand() * height * 0.6
    const r = 60 + rand() * 200
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
    gradient.addColorStop(0, blobColors[Math.floor(rand() * blobColors.length)])
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  for (let i = 0; i < 700; i++) {
    const x = rand() * width
    const y = rand() * height
    const s = rand() * 1.3
    ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + rand() * 0.5})`
    ctx.fillRect(x, y, s, s)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function buildGalaxyBackdrop(radius, seed) {
  const texture = buildGalaxyTexture(seed)
  const geometry = new THREE.SphereGeometry(radius, 32, 32)
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  })
  return new THREE.Mesh(geometry, material)
}

// A dense, tinted band of points arranged near a randomly tilted plane —
// layered on top of buildGalaxyBackdrop for a Milky-Way-like streak that
// reads as depth rather than a flat painted texture.
export function buildGalaxyBand(count, radius, seed) {
  const rand = mulberry32(seed)
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  const tilt = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize()
  const up = Math.abs(tilt.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
  const basisA = new THREE.Vector3().crossVectors(tilt, up).normalize()
  const basisB = new THREE.Vector3().crossVectors(tilt, basisA).normalize()

  const palette = [
    [1, 0.95, 0.85],
    [0.75, 0.82, 1],
    [0.9, 0.78, 1],
    [1, 1, 1],
  ]

  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2
    const r = radius * (0.8 + rand() * 0.2)
    const spread = (rand() - 0.5) * radius * 0.14
    const point = basisA
      .clone()
      .multiplyScalar(Math.cos(angle) * r)
      .add(basisB.clone().multiplyScalar(Math.sin(angle) * r))
      .add(tilt.clone().multiplyScalar(spread))

    positions[i * 3] = point.x
    positions[i * 3 + 1] = point.y
    positions[i * 3 + 2] = point.z

    const [cr, cg, cb] = palette[Math.floor(rand() * palette.length)]
    colors[i * 3] = cr
    colors[i * 3 + 1] = cg
    colors[i * 3 + 2] = cb
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geometry
}

// A real view-dependent Fresnel rim glow (unlike buildGlowHalo's layered-sphere
// approximation): intensity is driven by how edge-on each fragment's normal is
// relative to the camera, so the glow concentrates at the silhouette the way an
// atmosphere scattering sunlight actually looks, rather than a uniform halo.
export function buildAtmosphereGlow(radius, color, { power = 2.2, intensity = 0.9 } = {}) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(color) },
      power: { value: power },
      intensity: { value: intensity },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      uniform float power;
      uniform float intensity;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        float rim = 1.0 - max(dot(vNormal, vViewDir), 0.0);
        float glow = pow(rim, power) * intensity;
        gl_FragColor = vec4(glowColor, glow);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  })
  return new THREE.Mesh(new THREE.SphereGeometry(radius * 1.06, 48, 48), material)
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

// Linearly maps `value` from [inMin, inMax] into [outMin, outMax], clamped —
// used to turn raw API fields (miss distance, relative velocity) into scene
// scale (orbit radius, angular speed) without any one outlier asteroid
// blowing up the whole layout.
export function mapRange(value, inMin, inMax, outMin, outMax) {
  if (!Number.isFinite(value)) return outMin
  const t = clamp((value - inMin) / (inMax - inMin || 1), 0, 1)
  return outMin + t * (outMax - outMin)
}
