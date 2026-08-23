import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  buildAsteroidGeometry,
  buildAtmosphereGlow,
  buildGalaxyBackdrop,
  buildGalaxyBand,
  buildGlowHalo,
  buildLabelSprite,
  buildStarField,
  clamp,
  hashSeed,
  mapRange,
  mulberry32,
} from './sceneObjects'
import { formatAsteroidName, kmToLunarDistance, kmhToKmS } from '../lib/format'

const EARTH_TINT = '#a8c9c2' // light desaturated teal-gray tint — cools the day map without muddying its detail
const ATMOSPHERE_COLOR = '#a9dde2'
const HAZARD_COLOR = '#e8a33d'
const ROCK_COLOR = '#8a7864' // matte warm gray/brown rock tone
const SUN_COLOR = '#ffcf87'
const SUN_DIRECTION = new THREE.Vector3(0.55, 0.35, 0.65).normalize()
const MAX_MARKERS = 40
const CLICK_DRAG_THRESHOLD = 6 // px — pointerdown/up further apart than this counts as a drag, not a click

const EARTH_ROTATION_SPEED = (2 * Math.PI) / 60 // ~60s per revolution
const CLOUD_ROTATION_SPEED = EARTH_ROTATION_SPEED * 1.18
const HAZARD_PULSE_HZ = (2 * Math.PI) / 3 // 3s breathing period
const ORBIT_RADIUS_MIN = 2.4
const ORBIT_RADIUS_MAX = 6.4
const ANGULAR_SPEED_MIN = 0.05
const ANGULAR_SPEED_MAX = 0.42
const CAMERA_TWEEN_MS = 2000
const DEFAULT_CAMERA_POS = new THREE.Vector3(6.5, 4.5, 9)
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0)

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// The main Orbit view's 3D scene: a photoreal Earth with a Fresnel atmosphere,
// a galaxy backdrop, and every tracked asteroid as a real irregular rock
// orbiting Earth at a radius/speed derived from its actual miss distance and
// relative velocity. Hovering scales a rock up and labels it; clicking tweens
// the camera in and shows a tracking line + label for the selection; clicking
// empty space (or `onSelect(null)`) tweens back out. Mounts once and updates
// in place as `rows`/`selectedId` change, reading them via refs so it never
// needs to tear down and rebuild the whole scene.
export function SystemScene({ rows, selectedId, onSelect, onUnavailable }) {
  const containerRef = useRef(null)
  const rowsRef = useRef(rows)
  const selectedIdRef = useRef(selectedId)
  const onSelectRef = useRef(onSelect)
  const onUnavailableRef = useRef(onUnavailable)

  useEffect(() => {
    rowsRef.current = rows
  }, [rows])
  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])
  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])
  useEffect(() => {
    onUnavailableRef.current = onUnavailable
  }, [onUnavailable])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      600,
    )
    camera.position.copy(DEFAULT_CAMERA_POS)
    camera.lookAt(DEFAULT_TARGET)

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      onUnavailableRef.current?.()
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 2.5
    controls.maxDistance = 40
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.4
    controls.target.copy(DEFAULT_TARGET)

    // --- lighting: one shared sun ---
    scene.add(new THREE.AmbientLight('#4a4d53', 0.9))
    const sunLight = new THREE.DirectionalLight(SUN_COLOR, 1.6)
    sunLight.position.copy(SUN_DIRECTION.clone().multiplyScalar(20))
    scene.add(sunLight)

    const sunDistance = 45
    const sunPosition = SUN_DIRECTION.clone().multiplyScalar(sunDistance)
    const sunRadius = 4
    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(sunRadius, 32, 32),
      new THREE.MeshBasicMaterial({ color: SUN_COLOR }),
    )
    sunMesh.position.copy(sunPosition)
    scene.add(sunMesh)
    const sunGlow = buildGlowHalo(sunRadius, SUN_COLOR, 2.2)
    sunGlow.position.copy(sunPosition)
    scene.add(sunGlow)

    // --- earth: real NASA day/normal/specular/cloud maps, desaturated to the
    // moody teal-blue palette via a color tint rather than a bright literal map ---
    const textureLoader = new THREE.TextureLoader()
    const dayMap = textureLoader.load('/textures/earth_atmos_2048.jpg')
    dayMap.colorSpace = THREE.SRGBColorSpace
    const normalMap = textureLoader.load('/textures/earth_normal_2048.jpg')
    const cloudsMap = textureLoader.load('/textures/earth_clouds_1024.png')
    cloudsMap.colorSpace = THREE.SRGBColorSpace

    const earthGroup = new THREE.Group()
    const earthMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 64),
      new THREE.MeshStandardMaterial({
        map: dayMap,
        normalMap,
        normalScale: new THREE.Vector2(0.3, 0.3),
        // No roughnessMap: the source specular map is bright on ocean/dark on
        // land (a "how shiny" mask), which is the inverse of what
        // MeshStandardMaterial's roughnessMap expects (bright = rough) — wiring
        // it in directly made oceans look dull and land look plastic-shiny.
        // A flat matte value reads far better at this scene's small scale.
        roughness: 0.75,
        metalness: 0.05,
        color: EARTH_TINT,
      }),
    )
    earthGroup.add(earthMesh)

    const cloudMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.012, 64, 64),
      new THREE.MeshStandardMaterial({
        map: cloudsMap,
        alphaMap: cloudsMap,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        roughness: 1,
        metalness: 0,
      }),
    )
    earthGroup.add(cloudMesh)

    earthGroup.add(buildAtmosphereGlow(1, ATMOSPHERE_COLOR, { power: 3.4, intensity: 0.5 }))

    const earthLabel = buildLabelSprite('EARTH', { color: '#8a8d93', fontSize: 40 })
    earthLabel.position.set(0, -1.6, 0)
    earthGroup.add(earthLabel)
    scene.add(earthGroup)

    // --- galaxy backdrop + starfield ---
    scene.add(buildGalaxyBackdrop(200, 11))
    const bandGeometry = buildGalaxyBand(2200, 140, 33)
    scene.add(
      new THREE.Points(
        bandGeometry,
        new THREE.PointsMaterial({
          size: 0.4,
          vertexColors: true,
          transparent: true,
          opacity: 0.5,
          sizeAttenuation: true,
          depthWrite: false,
        }),
      ),
    )
    scene.add(
      new THREE.Points(
        buildStarField(500, 150, 7),
        new THREE.PointsMaterial({
          color: '#ffffff',
          size: 0.06,
          transparent: true,
          opacity: 0.5,
          sizeAttenuation: true,
        }),
      ),
    )

    // --- asteroid markers: every one a real irregular rock, orbiting Earth at
    // a radius/speed derived from its actual miss distance / relative velocity ---
    const markerGroup = new THREE.Group()
    scene.add(markerGroup)
    const trajectoryGroup = new THREE.Group()
    scene.add(trajectoryGroup)
    const hoverGroup = new THREE.Group()
    scene.add(hoverGroup)
    const markersById = new Map()
    let hoveredId = null

    function clearGroup(group) {
      for (const obj of [...group.children]) {
        group.remove(obj)
        obj.geometry?.dispose()
        // Material.dispose() doesn't cascade to the textures it references —
        // buildLabelSprite() allocates a fresh CanvasTexture per call, and this
        // group gets rebuilt on nearly every hover/selection change, so skipping
        // this leaks a GPU texture each time.
        obj.material?.map?.dispose()
        obj.material?.dispose()
      }
    }

    function rebuildMarkers() {
      clearGroup(markerGroup)
      markersById.clear()
      // A row-set change (e.g. a re-ingest) can drop the marker currently
      // hovered out from under the pointer — without this the hover label
      // stays frozen pointing at a mesh that no longer exists.
      if (hoveredId != null) {
        hoveredId = null
        clearGroup(hoverGroup)
      }
      for (const row of rowsRef.current.slice(0, MAX_MARKERS)) {
        const seed = hashSeed(row.asteroid.id)
        const rand = mulberry32(seed)
        const approach = row.approach
        const lunarDistance = kmToLunarDistance(approach?.missDistanceKm) ?? 20
        const relativeKms = kmhToKmS(approach?.relativeVelocityKmh) ?? 15

        const orbitRadius = mapRange(
          Math.log10(1 + Math.max(lunarDistance, 0)),
          0,
          2.6,
          ORBIT_RADIUS_MIN,
          ORBIT_RADIUS_MAX,
        )
        const angularSpeed = mapRange(relativeKms, 3, 40, ANGULAR_SPEED_MIN, ANGULAR_SPEED_MAX)
        const phase = rand() * Math.PI * 2
        // Random orbital-plane tilt so orbits scatter in 3D rather than stacking coplanar.
        const orbitQuat = new THREE.Quaternion().setFromEuler(
          new THREE.Euler((rand() - 0.5) * Math.PI * 0.7, 0, (rand() - 0.5) * Math.PI * 0.7),
        )

        const avgDiameterKm =
          ((row.asteroid.estimatedDiameterMinKm ?? 0.05) +
            (row.asteroid.estimatedDiameterMaxKm ?? 0.15)) /
          2
        const rockRadius = clamp(0.1 + avgDiameterKm * 0.018, 0.08, 0.34)
        const hazardous = row.asteroid.isPotentiallyHazardous

        const material = new THREE.MeshStandardMaterial({
          color: ROCK_COLOR,
          roughness: 1,
          metalness: 0.05,
          flatShading: true,
          emissive: hazardous ? new THREE.Color(HAZARD_COLOR) : new THREE.Color('#000000'),
          emissiveIntensity: 0,
        })
        const mesh = new THREE.Mesh(buildAsteroidGeometry(rockRadius, seed), material)
        mesh.userData = { id: row.asteroid.id, orbitRadius, angularSpeed, phase, orbitQuat, rockRadius }
        markerGroup.add(mesh)
        markersById.set(row.asteroid.id, mesh)
      }
    }
    rebuildMarkers()

    function rebuildSelectionVisual(id) {
      clearGroup(trajectoryGroup)
      if (id == null) return
      const row = rowsRef.current.find((r) => r.asteroid.id === id)
      if (!row || !markersById.has(id)) return

      trajectoryGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry(),
          new THREE.LineDashedMaterial({
            color: HAZARD_COLOR,
            dashSize: 0.15,
            gapSize: 0.1,
            transparent: true,
            opacity: 0.6,
          }),
        ),
      )
      trajectoryGroup.add(
        buildLabelSprite(formatAsteroidName(row.asteroid.name).toUpperCase(), {
          color: HAZARD_COLOR,
          fontSize: 30,
        }),
      )
    }

    function updateHoverLabel(id) {
      clearGroup(hoverGroup)
      if (id == null || id === selectedIdRef.current) return
      const row = rowsRef.current.find((r) => r.asteroid.id === id)
      if (!row) return
      hoverGroup.add(
        buildLabelSprite(formatAsteroidName(row.asteroid.name).toUpperCase(), {
          color: '#ededec',
          fontSize: 24,
        }),
      )
    }

    // --- camera tween: eased move toward/away from the selected asteroid ---
    let cameraTween = null
    function startCameraTween(id) {
      const fromPos = camera.position.clone()
      const fromTarget = controls.target.clone()
      let toPos
      let toTarget
      if (id == null) {
        toPos = DEFAULT_CAMERA_POS.clone()
        toTarget = DEFAULT_TARGET.clone()
      } else {
        const marker = markersById.get(id)
        if (!marker) return
        const markerPos = marker.position.clone()
        toTarget = fromTarget.clone().lerp(markerPos, 0.7)
        toPos = fromPos.clone().lerp(markerPos, 0.35)
      }
      cameraTween = { fromPos, fromTarget, toPos, toTarget, startMs: performance.now() }
    }

    // --- hover + click-to-select / click-empty-to-deselect ---
    const raycaster = new THREE.Raycaster()
    let downPos = null

    function raycastMarkers(e) {
      const rect = renderer.domElement.getBoundingClientRect()
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(ndc, camera)
      return raycaster.intersectObjects(markerGroup.children, false)
    }

    function onPointerMove(e) {
      const hits = raycastMarkers(e)
      const id = hits.length > 0 ? hits[0].object.userData.id : null
      if (id !== hoveredId) {
        hoveredId = id
        renderer.domElement.style.cursor = id != null ? 'pointer' : ''
        updateHoverLabel(id)
      }
    }
    function onPointerDown(e) {
      downPos = { x: e.clientX, y: e.clientY }
    }
    function onPointerUp(e) {
      if (!downPos) return
      const dx = e.clientX - downPos.x
      const dy = e.clientY - downPos.y
      downPos = null
      if (Math.hypot(dx, dy) > CLICK_DRAG_THRESHOLD) return

      const hits = raycastMarkers(e)
      onSelectRef.current?.(hits.length > 0 ? hits[0].object.userData.id : null)
    }
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointerup', onPointerUp)

    // --- animation loop ---
    let frameId
    let lastRows = rowsRef.current
    let lastSelected
    const clock = new THREE.Clock()
    const tmpVec = new THREE.Vector3()
    function animate() {
      const elapsed = clock.getElapsedTime()
      earthMesh.rotation.y = elapsed * EARTH_ROTATION_SPEED
      cloudMesh.rotation.y = elapsed * CLOUD_ROTATION_SPEED

      if (rowsRef.current !== lastRows) {
        lastRows = rowsRef.current
        rebuildMarkers()
        rebuildSelectionVisual(selectedIdRef.current)
        lastSelected = selectedIdRef.current
      }
      if (selectedIdRef.current !== lastSelected) {
        lastSelected = selectedIdRef.current
        rebuildSelectionVisual(selectedIdRef.current)
        startCameraTween(selectedIdRef.current)
        controls.autoRotate = selectedIdRef.current == null
      }

      for (const marker of markerGroup.children) {
        const { orbitRadius, angularSpeed, phase, orbitQuat, id } = marker.userData
        const angle = phase + elapsed * angularSpeed
        tmpVec.set(Math.cos(angle) * orbitRadius, 0, Math.sin(angle) * orbitRadius)
        tmpVec.applyQuaternion(orbitQuat)
        marker.position.copy(tmpVec)

        if (marker.material.emissive.r > 0 || marker.material.emissive.g > 0) {
          marker.material.emissiveIntensity = 0.25 + 0.25 * (0.5 + 0.5 * Math.sin(elapsed * HAZARD_PULSE_HZ))
        }

        let targetScale = 1
        if (id === hoveredId) targetScale = 1.35
        if (id === selectedIdRef.current) targetScale = 1.5
        marker.scale.setScalar(THREE.MathUtils.lerp(marker.scale.x, targetScale, 0.15))
      }

      if (hoveredId != null && hoverGroup.children.length > 0) {
        const marker = markersById.get(hoveredId)
        if (marker) {
          hoverGroup.children[0].position
            .copy(marker.position)
            .add(new THREE.Vector3(0, marker.userData.rockRadius + 0.22, 0))
        }
      }

      if (selectedIdRef.current != null && trajectoryGroup.children.length >= 2) {
        const marker = markersById.get(selectedIdRef.current)
        if (marker) {
          const target = marker.position.clone()
          const start = target.clone().normalize().multiplyScalar(1.03)
          const mid = start.clone().lerp(target, 0.5).multiplyScalar(1.08)
          const curve = new THREE.CatmullRomCurve3([start, mid, target])
          const line = trajectoryGroup.children[0]
          line.geometry.setFromPoints(curve.getPoints(40))
          line.computeLineDistances()
          trajectoryGroup.children[1].position
            .copy(target)
            .add(new THREE.Vector3(0, marker.userData.rockRadius + 0.28, 0))
        }
      }

      if (cameraTween) {
        const t = clamp((performance.now() - cameraTween.startMs) / CAMERA_TWEEN_MS, 0, 1)
        const eased = easeInOutCubic(t)
        camera.position.lerpVectors(cameraTween.fromPos, cameraTween.toPos, eased)
        controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, eased)
        if (t >= 1) cameraTween = null
      }

      controls.update()
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    function handleResize() {
      const { clientWidth, clientHeight } = container
      if (clientWidth === 0 || clientHeight === 0) return
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(clientWidth, clientHeight)
    }
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      controls.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
          for (const m of materials) {
            for (const slot of ['map', 'normalMap', 'roughnessMap', 'alphaMap']) {
              m[slot]?.dispose()
            }
            m.dispose()
          }
        }
      })
    }
    // Mount-once by design — props are read via refs above so this never
    // needs to re-run (see the component doc comment).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} className="absolute inset-0" />
}
