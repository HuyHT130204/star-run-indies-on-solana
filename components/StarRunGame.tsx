"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
import * as THREE from "three"
import type { Spaceship, Obstacle, PowerUp, ViewerAction, StarField, GameState } from "../types"
import styles from "../styles/StarRunGame.module.scss"
import PowerUp3DPreview from "./PowerUp3DPreview"

interface StarRunGameProps {
  onGameOver: (score: number, distance: number) => void
  viewerActions: ViewerAction[]
  onViewerActionProcessed: (actionId: string) => void
  onGameInfoUpdate?: (gameInfo: {
    score: number
    highScore: number
    level: number
    health: number
    maxHealth: number
    nextLevelProgress: number
    newHighScore: boolean
    shield: boolean
    boost: boolean
    isInvisible: boolean
    hasMultishot: boolean
    hasMagnet: boolean
    isTimeFrozen: boolean
    gravityWellActive: boolean
    meteorShowerActive: boolean
  }) => void
}

const StarRunGame: React.FC<StarRunGameProps> = ({ onGameOver, viewerActions, onViewerActionProcessed, onGameInfoUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const spaceshipMeshRef = useRef<THREE.Group | null>(null)
  const obstacleMeshesRef = useRef<Map<string, THREE.Group>>(new Map())
  const powerUpMeshesRef = useRef<Map<string, THREE.Group>>(new Map())
  const particleSystemsRef = useRef<THREE.Points[]>([])
  
  const gameLoopRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)
  const gameStateRef = useRef<GameState>({
    width: 800,
    height: 600,
    isGameOver: false,
    score: 0,
    highScore: typeof window !== "undefined" ? Number(localStorage.getItem("starRunHighScore")) || 0 : 0,
    newHighScore: false,
    gameSpeed: 2,
    paused: false,
    gameLoopTimeout: 16,
    timeoutId: 0,
    difficultyLevel: 1,
    obstacleSpawnRate: 1800, // Balanced spawn rate
    powerUpSpawnRate: 5000,
    obstacleSpeedMultiplier: 1,
    obstacleSizeMultiplier: 1,
    obstacleCountMultiplier: 1.0, // Start with normal count
    powerUpRarity: 1,
    screenShakeIntensity: 0,
    gravityWellActive: false,
    gravityWellStrength: 0,
    meteorShowerActive: false,
    meteorShowerIntensity: 0,
  })

  const spaceshipRef = useRef<Spaceship>({
    x: 400,
    y: 500,
    width: 40,
    height: 30,
    velocity: 0,
    boost: false,
    boostTime: 0,
    shield: false,
    shieldTime: 0,
    health: 100,
    maxHealth: 100,
    energy: 100,
    maxEnergy: 100,
    isInvisible: false,
    invisibilityTime: 0,
    hasMultishot: false,
    multishotTime: 0,
    hasMagnet: false,
    magnetTime: 0,
    magnetRange: 50,
    isTimeFrozen: false,
    timeFreezeTime: 0,
    screenShakeX: 0,
    screenShakeY: 0,
    screenShakeIntensity: 0,
  })

  const obstaclesRef = useRef<Obstacle[]>([])
  const powerUpsRef = useRef<PowerUp[]>([])
  const starFieldRef = useRef<StarField[]>([])
  const keysRef = useRef<Set<string>>(new Set())
  const lastObstacleSpawnRef = useRef<number>(0)
  const lastPowerUpSpawnRef = useRef<number>(0)
  const frameCountRef = useRef<number>(0)

  const [gameState, setGameState] = useState<GameState>(gameStateRef.current)
  const [spaceship, setSpaceship] = useState<Spaceship>(spaceshipRef.current)
  const [frameCount, setFrameCount] = useState(0)

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return

    const width = Math.min(window.innerWidth - 100, 900) // Reduced max width
    const height = Math.min(window.innerHeight - 120, 600) // Reduced max height

    // Scene
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x000011, 50, 200)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(0, 10, 30)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer with enhanced settings
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Enhanced lighting system
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
    directionalLight.position.set(10, 20, 10)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 50
    directionalLight.shadow.camera.left = -20
    directionalLight.shadow.camera.right = 20
    directionalLight.shadow.camera.top = 20
    directionalLight.shadow.camera.bottom = -20
    scene.add(directionalLight)

    const pointLight = new THREE.PointLight(0x00ffff, 1.5, 100)
    pointLight.position.set(0, 10, 20)
    pointLight.castShadow = true
    pointLight.shadow.mapSize.width = 1024
    pointLight.shadow.mapSize.height = 1024
    scene.add(pointLight)

    // Add rim light for better depth
    const rimLight = new THREE.DirectionalLight(0x00ffff, 0.5)
    rimLight.position.set(-10, -10, -10)
    scene.add(rimLight)

    // Starfield
    createStarField(scene)

    // Spaceship
    const spaceship = createSpaceship()
    scene.add(spaceship)
    spaceshipMeshRef.current = spaceship

    // Update game state
    gameStateRef.current.width = width
    gameStateRef.current.height = height
    spaceshipRef.current.x = width / 2 - 20
    spaceshipRef.current.y = height - 80

    return () => {
      renderer.dispose()
      containerRef.current?.removeChild(renderer.domElement)
    }
  }, [])

  // Create starfield
  const createStarField = (scene: THREE.Scene) => {
    const starGeometry = new THREE.BufferGeometry()
    const starCount = 1000
    const positions = new Float32Array(starCount * 3)

    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200
      positions[i + 1] = (Math.random() - 0.5) * 200
      positions[i + 2] = (Math.random() - 0.5) * 200
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
    })

    const stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)
    particleSystemsRef.current.push(stars)
  }

  // Create spaceship 3D model - Realistic UFO
  const createSpaceship = () => {
    const group = new THREE.Group()

    // Main UFO body - saucer shape
    const bodyGeometry = new THREE.CylinderGeometry(2, 2.5, 0.8, 16)
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xcccccc,
      emissive: 0x222222,
      shininess: 100,
      specular: 0x666666
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.castShadow = true
    body.receiveShadow = true
    group.add(body)

    // Top dome - cockpit
    const domeGeometry = new THREE.SphereGeometry(1.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)
    const domeMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x00ffff,
      emissive: 0x004444,
      transparent: true,
      opacity: 0.8,
      shininess: 150,
      specular: 0x00ffff
    })
    const dome = new THREE.Mesh(domeGeometry, domeMaterial)
    dome.position.y = 0.4
    dome.castShadow = true
    dome.receiveShadow = true
    group.add(dome)

    // Bottom dome
    const bottomDomeGeometry = new THREE.SphereGeometry(1.5, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)
    const bottomDomeMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x888888,
      emissive: 0x111111,
      shininess: 80,
      specular: 0x444444
    })
    const bottomDome = new THREE.Mesh(bottomDomeGeometry, bottomDomeMaterial)
    bottomDome.position.y = -0.4
    bottomDome.castShadow = true
    bottomDome.receiveShadow = true
    group.add(bottomDome)

    // Antenna
    const antennaGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8)
    const antennaMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x00ffff,
      emissive: 0x002222
    })
    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial)
    antenna.position.y = 1.2
    antenna.castShadow = true
    group.add(antenna)

    // Antenna tip
    const tipGeometry = new THREE.SphereGeometry(0.1, 8, 8)
    const tipMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x00ffff,
      emissive: 0x004444
    })
    const tip = new THREE.Mesh(tipGeometry, tipMaterial)
    tip.position.y = 1.6
    group.add(tip)

    // Engine glow rings
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.TorusGeometry(0.3 + i * 0.1, 0.05, 8, 16)
      const ringMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff6600,
        transparent: true,
        opacity: 0.8 - i * 0.2
      })
      const ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.position.y = -0.8
      ring.rotation.x = Math.PI / 2
      group.add(ring)
    }

    // Engine light
    const engineLight = new THREE.PointLight(0xff6600, 2, 10)
    engineLight.position.y = -1.2
    group.add(engineLight)

    // UFO glow effect - removed to prevent permanent transparent sphere

    return group
  }

  // Create obstacle 3D model - Enhanced realistic obstacles
  const createObstacle = (obstacle: Obstacle) => {
    const group = new THREE.Group()

    switch (obstacle.type) {
      case 'asteroid':
        const asteroidGeometry = new THREE.DodecahedronGeometry(obstacle.width / 40, 1)
        const asteroidMaterial = new THREE.MeshPhongMaterial({ 
          color: 0x8B4513,
          shininess: 5,
          specular: 0x222222,
          bumpScale: 0.1
        })
        const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial)
        asteroid.castShadow = true
        asteroid.receiveShadow = true
        group.add(asteroid)

        // Add asteroid glow
        const asteroidGlow = new THREE.PointLight(0x8B4513, 0.5, 15)
        group.add(asteroidGlow)
        break

      case 'debris':
        const debrisGeometry = new THREE.BoxGeometry(
          obstacle.width / 40,
          obstacle.height / 40,
          obstacle.width / 40
        )
        const debrisMaterial = new THREE.MeshPhongMaterial({ 
          color: 0x696969,
          specular: 0x888888,
          shininess: 80
        })
        const debris = new THREE.Mesh(debrisGeometry, debrisMaterial)
        debris.castShadow = true
        debris.receiveShadow = true
        group.add(debris)

        // Add metallic shine
        const debrisGlow = new THREE.PointLight(0x888888, 0.3, 10)
        group.add(debrisGlow)
        break

      case 'enemy':
        const enemyGeometry = new THREE.OctahedronGeometry(obstacle.width / 40, 1)
        const enemyMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xFF0000,
          emissive: 0x440000,
          shininess: 100,
          specular: 0xFF4444
        })
        const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial)
        enemy.castShadow = true
        enemy.receiveShadow = true
        group.add(enemy)

        // Add enemy glow and pulsing effect
        const enemyGlow = new THREE.PointLight(0xFF0000, 1.5, 15)
        group.add(enemyGlow)

        // Add warning rings
        for (let i = 0; i < 2; i++) {
          const ringGeometry = new THREE.TorusGeometry(obstacle.width / 30 + i * 0.2, 0.05, 8, 16)
          const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFF0000,
            transparent: true,
            opacity: 0.6 - i * 0.2
          })
          const ring = new THREE.Mesh(ringGeometry, ringMaterial)
          ring.rotation.x = Math.PI / 2
          group.add(ring)
        }
        break

      case 'meteor':
        const meteorGeometry = new THREE.IcosahedronGeometry(obstacle.width / 40, 1)
        const meteorMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xFF4500,
          emissive: 0x661100,
          shininess: 30,
          specular: 0xFF6600
        })
        const meteor = new THREE.Mesh(meteorGeometry, meteorMaterial)
        meteor.castShadow = true
        meteor.receiveShadow = true
        group.add(meteor)

        // Add meteor trail
        const trailGeometry = new THREE.ConeGeometry(obstacle.width / 80, obstacle.width / 20, 8)
        const trailMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xFF6600,
          transparent: true,
          opacity: 0.7
        })
        const trail = new THREE.Mesh(trailGeometry, trailMaterial)
        trail.rotation.x = Math.PI / 2
        trail.position.z = -1
        group.add(trail)

        // Add meteor glow
        const meteorGlow = new THREE.PointLight(0xFF4500, 2, 20)
        group.add(meteorGlow)
        break

      case 'blackhole':
        const blackholeGeometry = new THREE.SphereGeometry(obstacle.width / 40, 32, 32)
        const blackholeMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x000000,
          transparent: true,
          opacity: 0.9
        })
        const blackhole = new THREE.Mesh(blackholeGeometry, blackholeMaterial)
        group.add(blackhole)

        // Add accretion disk with multiple rings
        for (let i = 0; i < 3; i++) {
          const diskGeometry = new THREE.TorusGeometry(obstacle.width / 30 + i * 0.3, obstacle.width / 200, 16, 100)
          const diskMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x8A2BE2,
            transparent: true,
            opacity: 0.6 - i * 0.15
          })
          const disk = new THREE.Mesh(diskGeometry, diskMaterial)
          disk.rotation.x = Math.PI / 2
          group.add(disk)
        }

        // Add gravitational distortion effect
        const distortionGeometry = new THREE.SphereGeometry(obstacle.width / 25, 16, 16)
        const distortionMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x4B0082,
          transparent: true,
          opacity: 0.2,
          side: THREE.DoubleSide
        })
        const distortion = new THREE.Mesh(distortionGeometry, distortionMaterial)
        group.add(distortion)
        break

      case 'laser':
        const laserGeometry = new THREE.CylinderGeometry(obstacle.width / 200, obstacle.width / 200, obstacle.height / 20, 8)
        const laserMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x00FFFF,
          transparent: true,
          opacity: 0.9
        })
        const laser = new THREE.Mesh(laserGeometry, laserMaterial)
        laser.rotation.z = Math.PI / 2
        group.add(laser)

        // Add laser glow and energy field
        const laserGlow = new THREE.PointLight(0x00FFFF, 3, 15)
        group.add(laserGlow)

        // Add energy rings
        for (let i = 0; i < 2; i++) {
          const energyRingGeometry = new THREE.TorusGeometry(obstacle.width / 100 + i * 0.1, 0.02, 8, 16)
          const energyRingMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00FFFF,
            transparent: true,
            opacity: 0.8 - i * 0.3
          })
          const energyRing = new THREE.Mesh(energyRingGeometry, energyRingMaterial)
          energyRing.rotation.x = Math.PI / 2
          group.add(energyRing)
        }
        break
    }

    return group
  }

  // Create power-up 3D model - Enhanced with realistic effects
  const createPowerUp = (powerUp: PowerUp) => {
    const group = new THREE.Group()

    let color = 0x00FF00
    let shape: THREE.BufferGeometry
    let emissiveColor = 0x002200

    switch (powerUp.type) {
      case 'shield':
        color = 0x00FFFF
        emissiveColor = 0x004444
        shape = new THREE.OctahedronGeometry(0.8, 1)
        break
      case 'boost':
        color = 0xFFFF00
        emissiveColor = 0x444400
        shape = new THREE.TetrahedronGeometry(0.8, 1)
        break
      case 'bonus':
        color = 0x00FF00
        emissiveColor = 0x002200
        shape = new THREE.BoxGeometry(0.8, 0.8, 0.8)
        break
      case 'multishot':
        color = 0xFF5722
        emissiveColor = 0x441100
        shape = new THREE.TorusGeometry(0.6, 0.2, 16, 100)
        break
      case 'timefreeze':
        color = 0x2196F3
        emissiveColor = 0x002244
        shape = new THREE.IcosahedronGeometry(0.8, 1)
        break
      case 'magnet':
        color = 0x4CAF50
        emissiveColor = 0x114411
        shape = new THREE.TorusGeometry(0.6, 0.3, 8, 6)
        break
      case 'invisibility':
        color = 0x9C27B0
        emissiveColor = 0x220022
        shape = new THREE.DodecahedronGeometry(0.8, 1)
        break
      default:
        shape = new THREE.SphereGeometry(0.8, 16, 16)
    }

    const material = new THREE.MeshPhongMaterial({ 
      color,
      emissive: emissiveColor,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9,
      shininess: 100,
      specular: color
    })

    const mesh = new THREE.Mesh(shape, material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)

    // Add enhanced glow effect
    const glowLight = new THREE.PointLight(color, 2, 20)
    group.add(glowLight)

    // Add outer glow sphere
    const outerGlowGeometry = new THREE.SphereGeometry(1.5, 16, 16)
    const outerGlowMaterial = new THREE.MeshBasicMaterial({ 
      color,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide
    })
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial)
    group.add(outerGlow)

    // Add rotating ring for rare items
    if (powerUp.rarity !== 'common') {
      const ringGeometry = new THREE.TorusGeometry(1.2, 0.05, 16, 100)
      const ringMaterial = new THREE.MeshBasicMaterial({ 
        color,
        transparent: true,
        opacity: 0.6
      })
      const ring = new THREE.Mesh(ringGeometry, ringMaterial)
      ring.rotation.x = Math.PI / 2
      group.add(ring)

      // Add additional rings for epic and legendary
      if (powerUp.rarity === 'epic' || powerUp.rarity === 'legendary') {
        const innerRingGeometry = new THREE.TorusGeometry(0.8, 0.03, 16, 100)
        const innerRingMaterial = new THREE.MeshBasicMaterial({ 
          color,
          transparent: true,
          opacity: 0.4
        })
        const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial)
        innerRing.rotation.x = Math.PI / 2
        group.add(innerRing)
      }

      // Add particle effect for legendary items
      if (powerUp.rarity === 'legendary') {
        const particleGeometry = new THREE.BufferGeometry()
        const particleCount = 20
        const positions = new Float32Array(particleCount * 3)
        
        for (let i = 0; i < particleCount * 3; i += 3) {
          positions[i] = (Math.random() - 0.5) * 3
          positions[i + 1] = (Math.random() - 0.5) * 3
          positions[i + 2] = (Math.random() - 0.5) * 3
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        
        const particleMaterial = new THREE.PointsMaterial({
          color,
          size: 0.1,
          transparent: true,
          opacity: 0.8
        })
        
        const particles = new THREE.Points(particleGeometry, particleMaterial)
        group.add(particles)
      }
    }

    return group
  }

  // Handle viewer actions
  useEffect(() => {
    viewerActions.forEach((action) => {
      if (action.type === "powerup") {
        spawnPowerUp(action.data)
      } else if (action.type === "obstacle") {
        spawnObstacle(action.data)
      } else if (action.type === "boost") {
        activateBoost()
      }
      onViewerActionProcessed(action.id)
    })
  }, [viewerActions, onViewerActionProcessed])

  // Keyboard input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current.isGameOver) {
        if (e.code === "Space") {
          resetGame()
        }
        return
      }

      keysRef.current.add(e.code)

      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)
      ) {
        e.preventDefault()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code)
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  // Game loop
  useEffect(() => {
    const gameLoop = (currentTime: number) => {
      if (gameStateRef.current.isGameOver) {
        gameLoopRef.current = requestAnimationFrame(gameLoop)
        return
      }

      const deltaTime = currentTime - lastTimeRef.current
      lastTimeRef.current = currentTime

      updateGame(deltaTime)
      renderGame()

      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    lastTimeRef.current = performance.now()
    gameLoopRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [])

  const updateGame = useCallback((deltaTime: number) => {
    if (gameStateRef.current.isGameOver) return

    const ship = spaceshipRef.current
    const gameState = gameStateRef.current

    // Update spaceship movement
    const moveSpeed = 8 // Increased from 5 to 8
    let moveX = 0
    let moveY = 0
    
    if (keysRef.current.has("ArrowLeft") || keysRef.current.has("KeyA")) {
      moveX = -moveSpeed
    }
    if (keysRef.current.has("ArrowRight") || keysRef.current.has("KeyD")) {
      moveX = moveSpeed
    }
    if (keysRef.current.has("ArrowUp") || keysRef.current.has("KeyW")) {
      moveY = -moveSpeed
    }
    if (keysRef.current.has("ArrowDown") || keysRef.current.has("KeyS")) {
      moveY = moveSpeed
    }
    
    ship.x = Math.max(0, Math.min(gameState.width - ship.width, ship.x + moveX + ship.screenShakeX))
    ship.y = Math.max(0, Math.min(gameState.height - ship.height, ship.y + moveY + ship.screenShakeY))
    
    // Update screen shake
    if (ship.screenShakeIntensity > 0) {
      ship.screenShakeX = (Math.random() - 0.5) * ship.screenShakeIntensity
      ship.screenShakeY = (Math.random() - 0.5) * ship.screenShakeIntensity
      ship.screenShakeIntensity *= 0.9
      
      if (ship.screenShakeIntensity < 0.1) {
        ship.screenShakeIntensity = 0
        ship.screenShakeX = 0
        ship.screenShakeY = 0
      }
    }

    // Handle boost with x2 speed multiplier
    if (keysRef.current.has("Space") && ship.boostTime > 0) {
      ship.velocity = moveSpeed * 2 // Exactly 2x the base movement speed
      ship.boost = true
      ship.boostTime = Math.max(0, ship.boostTime - deltaTime)
    } else {
      ship.velocity = moveSpeed // Base movement speed
      ship.boost = false
    }

    // Update shield timer
    if (ship.shieldTime > 0) {
      ship.shieldTime = Math.max(0, ship.shieldTime - deltaTime)
      ship.shield = ship.shieldTime > 0
    }

    // Update invisibility timer
    if (ship.invisibilityTime > 0) {
      ship.invisibilityTime = Math.max(0, ship.invisibilityTime - deltaTime)
      ship.isInvisible = ship.invisibilityTime > 0
    }

    // Update multishot timer
    if (ship.multishotTime > 0) {
      ship.multishotTime = Math.max(0, ship.multishotTime - deltaTime)
      ship.hasMultishot = ship.multishotTime > 0
    }

    // Update magnet timer
    if (ship.magnetTime > 0) {
      ship.magnetTime = Math.max(0, ship.magnetTime - deltaTime)
      ship.hasMagnet = ship.magnetTime > 0
    }

    // Update time freeze timer
    if (ship.timeFreezeTime > 0) {
      ship.timeFreezeTime = Math.max(0, ship.timeFreezeTime - deltaTime)
      ship.isTimeFrozen = ship.timeFreezeTime > 0
    }

    // Update obstacles
    for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
      const obstacle = obstaclesRef.current[i]
      
      // Time freeze effect - slow down obstacles
      if (ship.isTimeFrozen) {
        obstacle.x += obstacle.velocityX * 0.3 // 70% slower
        obstacle.y += obstacle.velocityY * 0.3
        obstacle.rotation += obstacle.rotationSpeed * 0.3
      } else {
        obstacle.x += obstacle.velocityX * 0.7 // Reduced speed multiplier
        obstacle.y += obstacle.velocityY * 0.7
        obstacle.rotation += obstacle.rotationSpeed
      }
      
      const margin = 100
      const isOffScreen = obstacle.x < -margin || 
                         obstacle.x > gameState.width + margin || 
                         obstacle.y < -margin || 
                         obstacle.y > gameState.height + margin
      
      if (isOffScreen) {
        const mesh = obstacleMeshesRef.current.get(obstacle.id)
        if (mesh && sceneRef.current) {
          sceneRef.current.remove(mesh)
        }
        obstacleMeshesRef.current.delete(obstacle.id)
        obstaclesRef.current.splice(i, 1)
        continue
      }
      
      avoidOtherObstacles(obstacle, obstaclesRef.current, i)
    }

    // Spawn new obstacles (with performance limit)
    const now = Date.now()
    const maxObstaclesOnScreen = Math.min(20 + gameState.difficultyLevel * 3, 35) // Increased from 15+2 to 20+3, max from 25 to 35
    if (now - lastObstacleSpawnRef.current > gameState.obstacleSpawnRate && obstaclesRef.current.length < maxObstaclesOnScreen) {
      spawnRandomObstacle()
      lastObstacleSpawnRef.current = now
    }

    // Update power-ups
    for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
      const powerUp = powerUpsRef.current[i]
      
      // Magnet attraction effect
      if (ship.hasMagnet) {
        const dx = ship.x + ship.width/2 - (powerUp.x + powerUp.width/2)
        const dy = ship.y + ship.height/2 - (powerUp.y + powerUp.height/2)
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < ship.magnetRange) {
          const attractionForce = 3
          const normalizedDx = dx / distance
          const normalizedDy = dy / distance
          
          powerUp.x += normalizedDx * attractionForce
          powerUp.y += normalizedDy * attractionForce
        }
      }
      
      // Time freeze effect - slow down power-ups
      if (ship.isTimeFrozen) {
        powerUp.x -= 1 // Half speed
      } else {
        powerUp.x -= 2 * gameState.gameSpeed // Apply game speed multiplier
      }

      if (powerUp.x < -powerUp.width) {
        const mesh = powerUpMeshesRef.current.get(powerUp.id)
        if (mesh && sceneRef.current) {
          sceneRef.current.remove(mesh)
        }
        powerUpMeshesRef.current.delete(powerUp.id)
        powerUpsRef.current.splice(i, 1)
      }
    }

    // Spawn new power-ups
    if (now - lastPowerUpSpawnRef.current > gameState.powerUpSpawnRate) {
      spawnRandomPowerUp()
      lastPowerUpSpawnRef.current = now
    }

    // Check collisions
    checkCollisions()

    // Update difficulty
    frameCountRef.current++
    if (frameCountRef.current % 60 === 0) {
      updateDifficulty()
    }

    // Update UI state (less frequently to improve performance)
    if (frameCountRef.current % 30 === 0) { // Reduced frequency from 10 to 30 frames
      setSpaceship({ ...ship })
      setGameState({ ...gameState })
      setFrameCount(frameCountRef.current)
      
      // Send game info to parent component
      if (onGameInfoUpdate) {
        const currentLevel = Math.floor(gameState.difficultyLevel)
        const pointsForCurrentLevel = currentLevel === 1 ? 0 : 100 * (currentLevel - 1) * currentLevel / 2
        const pointsInCurrentLevel = gameState.score - pointsForCurrentLevel
        const pointsNeededForNextLevel = 100 * currentLevel
        const nextLevelProgress = (pointsInCurrentLevel / pointsNeededForNextLevel) * 100
        
        onGameInfoUpdate({
          score: gameState.score,
          highScore: gameState.highScore,
          level: currentLevel,
          health: ship.health,
          maxHealth: ship.maxHealth,
          nextLevelProgress: Math.min(100, Math.max(0, nextLevelProgress)),
          newHighScore: gameState.newHighScore,
          shield: ship.shield,
          boost: ship.boost,
          isInvisible: ship.isInvisible,
          hasMultishot: ship.hasMultishot,
          hasMagnet: ship.hasMagnet,
          isTimeFrozen: ship.isTimeFrozen,
          gravityWellActive: gameState.gravityWellActive,
          meteorShowerActive: gameState.meteorShowerActive
        })
      }
    }
  }, [])

  const updateDifficulty = useCallback(() => {
    const gameState = gameStateRef.current
    
    let currentLevel = 1
    let pointsForNextLevel = 100
    
    while (gameState.score >= pointsForNextLevel) {
      currentLevel++
      pointsForNextLevel += 100 * currentLevel
    }
    
    const pointsForCurrentLevel = currentLevel === 1 ? 0 : 100 * (currentLevel - 1) * currentLevel / 2
    const pointsInCurrentLevel = gameState.score - pointsForCurrentLevel
    const pointsNeededForNextLevel = 100 * currentLevel
    const levelProgress = pointsInCurrentLevel / pointsNeededForNextLevel
    
    const smoothDifficulty = currentLevel + levelProgress
    const roundedDifficulty = Math.round(smoothDifficulty * 100) / 100
    
    const difficultyChange = Math.abs(gameState.difficultyLevel - roundedDifficulty)
    if (difficultyChange < 0.1) return
    
    gameState.difficultyLevel = Math.min(roundedDifficulty, 20)
    
    const level = gameState.difficultyLevel
    
    const newGameSpeed = Math.min(2 + (level * 1.2), 30)
    if (Math.abs(gameState.gameSpeed - newGameSpeed) > 0.1) {
      gameState.gameSpeed = Math.round(newGameSpeed * 100) / 100
    }
    
    const newObstacleSpawnRate = Math.max(1400 - (level * 60), 300) // Slightly slower spawn rate
    if (Math.abs(gameState.obstacleSpawnRate - newObstacleSpawnRate) > 50) {
      gameState.obstacleSpawnRate = newObstacleSpawnRate
    }
    
    const newPowerUpSpawnRate = Math.max(5000 + (level * 200), 3000)
    if (Math.abs(gameState.powerUpSpawnRate - newPowerUpSpawnRate) > 100) {
      gameState.powerUpSpawnRate = newPowerUpSpawnRate
    }
    
    setGameState({ ...gameState })
  }, [])

  const avoidOtherObstacles = useCallback((obstacle: Obstacle, allObstacles: Obstacle[], currentIndex: number) => {
    for (let i = 0; i < allObstacles.length; i++) {
      if (i === currentIndex) continue
      
      const other = allObstacles[i]
      const dx = obstacle.x - other.x
      const dy = obstacle.y - other.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < 30 && distance > 0) {
        const force = 0.1
        obstacle.velocityX += (dx / distance) * force
        obstacle.velocityY += (dy / distance) * force
      }
    }
  }, [])

  const spawnRandomObstacle = useCallback(() => {
    const gameState = gameStateRef.current
    const difficultyLevel = gameState.difficultyLevel
    
    const baseTypes: Array<"asteroid" | "debris" | "enemy"> = ["asteroid", "debris", "enemy"]
    const advancedTypes: Array<"meteor" | "blackhole" | "laser"> = ["meteor", "blackhole", "laser"]
    
    let availableTypes: Array<"asteroid" | "debris" | "enemy" | "meteor" | "blackhole" | "laser"> = baseTypes
    if (difficultyLevel > 3) { // Lowered threshold for advanced obstacles
      availableTypes = [...baseTypes, ...advancedTypes]
    }
    
    // Spawn obstacles based on difficulty level - more balanced approach
    let obstacleCount = 1
    if (difficultyLevel >= 2) obstacleCount = 2 // Lowered from 3 to 2
    if (difficultyLevel >= 4) obstacleCount = 3 // Lowered from 6 to 4
    if (difficultyLevel >= 7) obstacleCount = 4 // Lowered from 10 to 7
    if (difficultyLevel >= 12) obstacleCount = 5 // Added new level
    
    for (let i = 0; i < obstacleCount; i++) {
      const type = availableTypes[Math.floor(Math.random() * availableTypes.length)]
      
      const baseSize = 30 + Math.random() * 20
      const sizeMultiplier = gameState.obstacleSizeMultiplier
      const width = baseSize * sizeMultiplier
      const height = baseSize * sizeMultiplier
      
      const baseSpeed = 2 + Math.random() * gameState.gameSpeed
      const speedMultiplier = gameState.obstacleSpeedMultiplier
      const speed = baseSpeed * speedMultiplier

      const spawnSides: Array<'left' | 'right' | 'top' | 'bottom'> = ['left', 'right', 'top']
      if (difficultyLevel > 2) { // Lowered threshold for bottom spawn
        spawnSides.push('bottom')
      }
      
      const spawnSide = spawnSides[Math.floor(Math.random() * spawnSides.length)] as 'left' | 'right' | 'top' | 'bottom'
      
      let spawnX: number, spawnY: number
      let velocityX: number, velocityY: number
      let diagonalAngle: number
      
      // Add slight delay between multiple obstacles to prevent clustering
      const delayOffset = i * 200 // Increased delay to prevent clustering
      
      switch (spawnSide) {
        case 'left':
          spawnX = -width - delayOffset
          spawnY = Math.random() * (gameState.height - height)
          velocityX = speed * (0.8 + Math.random() * 0.4)
          velocityY = (Math.random() - 0.5) * speed * 0.3
          diagonalAngle = Math.atan2(velocityY, velocityX)
          break
        case 'right':
          spawnX = gameState.width + delayOffset
          spawnY = Math.random() * (gameState.height - height)
          velocityX = -speed * (0.8 + Math.random() * 0.4)
          velocityY = (Math.random() - 0.5) * speed * 0.3
          diagonalAngle = Math.atan2(velocityY, velocityX)
          break
        case 'top':
          spawnX = Math.random() * (gameState.width - width)
          spawnY = -height - delayOffset
          velocityX = (Math.random() - 0.5) * speed * 0.3
          velocityY = speed * (0.8 + Math.random() * 0.4)
          diagonalAngle = Math.atan2(velocityY, velocityX)
          break
        case 'bottom':
          spawnX = Math.random() * (gameState.width - width)
          spawnY = gameState.height + delayOffset
          velocityX = (Math.random() - 0.5) * speed * 0.3
          velocityY = -speed * (0.8 + Math.random() * 0.4)
          diagonalAngle = Math.atan2(velocityY, velocityX)
          break
        default:
          spawnX = gameState.width + delayOffset
          spawnY = Math.random() * (gameState.height - height)
          velocityX = -speed
          velocityY = 0
          diagonalAngle = 0
      }

      const obstacle: Obstacle = {
        x: spawnX,
        y: spawnY,
        width,
        height,
        type,
        speed,
        id: `obstacle_${Date.now()}_${Math.random()}_${i}`,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        health: type === 'enemy' ? 2 : 1,
        damage: type === 'meteor' ? 2 : 1,
        isTracking: false,
        trackingSpeed: 0,
        isBouncing: false,
        bounceCount: 0,
        maxBounces: 0,
        isExplosive: type === 'meteor',
        explosionRadius: type === 'meteor' ? 50 : 0,
        isInvulnerable: type === 'blackhole',
        invulnerabilityTime: type === 'blackhole' ? 1000 : 0,
        velocityX,
        velocityY,
        spawnSide,
        diagonalAngle,
        gravity: 0,
        bounceEnergy: 0,
        aiType: 'passive',
        aiState: 'idle',
        aiTimer: 0,
        aiCooldown: 0,
        patrolPoints: [],
        currentPatrolIndex: 0,
        swarmCenter: { x: 0, y: 0 },
        avoidanceRadius: 0,
        maxSpeed: speed,
        acceleration: 0,
        friction: 1,
      }

      obstaclesRef.current.push(obstacle)
      
      // Create 3D mesh
      if (sceneRef.current) {
        const mesh = createObstacle(obstacle)
        sceneRef.current.add(mesh)
        obstacleMeshesRef.current.set(obstacle.id, mesh)
      }
    }
  }, [])

  const spawnRandomPowerUp = useCallback(() => {
    const gameState = gameStateRef.current
    const difficultyLevel = gameState.difficultyLevel
    
    const baseTypes: Array<"shield" | "boost" | "bonus"> = ["shield", "boost", "bonus"]
    const advancedTypes: Array<"multishot" | "timefreeze" | "magnet" | "invisibility"> = ["multishot", "timefreeze", "magnet", "invisibility"]
    
    let availableTypes: Array<"shield" | "boost" | "bonus" | "multishot" | "timefreeze" | "magnet" | "invisibility"> = baseTypes
    if (difficultyLevel > 3) {
      availableTypes = [...baseTypes, ...advancedTypes]
    }
    
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)]
    
    const rarityRoll = Math.random()
    let rarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common'
    
    if (rarityRoll < 0.1 * gameState.powerUpRarity) {
      rarity = 'legendary'
    } else if (rarityRoll < 0.3 * gameState.powerUpRarity) {
      rarity = 'epic'
    } else if (rarityRoll < 0.6 * gameState.powerUpRarity) {
      rarity = 'rare'
    }
    
    const levelMultiplier = Math.max(1, Math.floor(difficultyLevel))
    const basePoints = type === "bonus" ? 10 * levelMultiplier : 5 * levelMultiplier
    const rarityMultiplier = rarity === 'legendary' ? 5 : rarity === 'epic' ? 3 : rarity === 'rare' ? 2 : 1
    const points = basePoints * rarityMultiplier

    const powerUp: PowerUp = {
      x: gameState.width,
      y: Math.random() * (gameState.height - 30),
      width: 25,
      height: 25,
      type,
      points,
      id: `powerup_${Date.now()}_${Math.random()}`,
      duration: 10000,
      rarity,
      effectStrength: rarity === 'legendary' ? 2 : rarity === 'epic' ? 1.5 : rarity === 'rare' ? 1.2 : 1,
      isPulsing: rarity !== 'common',
      pulseSpeed: rarity === 'legendary' ? 0.1 : 0.05,
      isRotating: rarity === 'epic' || rarity === 'legendary',
      rotationSpeed: rarity === 'legendary' ? 0.05 : 0.02,
      isTracking: rarity === 'legendary',
      trackingRange: rarity === 'legendary' ? 100 : 0,
    }

    powerUpsRef.current.push(powerUp)
    
    // Create 3D mesh
    if (sceneRef.current) {
      const mesh = createPowerUp(powerUp)
      sceneRef.current.add(mesh)
      powerUpMeshesRef.current.set(powerUp.id, mesh)
    }
  }, [])

  const spawnPowerUp = useCallback((data: any) => {
    const powerUp: PowerUp = {
      x: data.x || gameStateRef.current.width,
      y: data.y || Math.random() * (gameStateRef.current.height - 30),
      width: 25,
      height: 25,
      type: data.type || "bonus",
      points: data.points || 25,
      id: `viewer_powerup_${Date.now()}_${Math.random()}`,
      duration: data.duration || 15000,
      rarity: data.rarity || 'common',
      effectStrength: data.effectStrength || 1,
      isPulsing: false,
      pulseSpeed: 0,
      isRotating: false,
      rotationSpeed: 0,
      isTracking: false,
      trackingRange: 0,
    }

    powerUpsRef.current.push(powerUp)
    
    if (sceneRef.current) {
      const mesh = createPowerUp(powerUp)
      sceneRef.current.add(mesh)
      powerUpMeshesRef.current.set(powerUp.id, mesh)
    }
  }, [])

  const spawnObstacle = useCallback((data: any) => {
    const gameState = gameStateRef.current
    
    const spawnSide = data.spawnSide || (['left', 'right', 'top', 'bottom'][Math.floor(Math.random() * 4)])
    
    let spawnX: number, spawnY: number
    let velocityX: number, velocityY: number
    
    const speed = data.speed || 4
    const width = data.width || 40
    const height = data.height || 40
    
    switch (spawnSide) {
      case 'left':
        spawnX = -width
        spawnY = data.y || Math.random() * (gameState.height - height)
        velocityX = speed * (0.8 + Math.random() * 0.4)
        velocityY = (Math.random() - 0.5) * speed * 0.3
        break
      case 'right':
        spawnX = gameState.width
        spawnY = data.y || Math.random() * (gameState.height - height)
        velocityX = -speed * (0.8 + Math.random() * 0.4)
        velocityY = (Math.random() - 0.5) * speed * 0.3
        break
      case 'top':
        spawnX = data.x || Math.random() * (gameState.width - width)
        spawnY = -height
        velocityX = (Math.random() - 0.5) * speed * 0.3
        velocityY = speed * (0.8 + Math.random() * 0.4)
        break
      case 'bottom':
        spawnX = data.x || Math.random() * (gameState.width - width)
        spawnY = gameState.height
        velocityX = (Math.random() - 0.5) * speed * 0.3
        velocityY = -speed * (0.8 + Math.random() * 0.4)
        break
      default:
        spawnX = data.x || gameState.width
        spawnY = data.y || Math.random() * (gameState.height - height)
        velocityX = -speed
        velocityY = 0
    }

    const obstacle: Obstacle = {
      x: spawnX,
      y: spawnY,
      width,
      height,
      type: data.type || "asteroid",
      speed,
      id: `viewer_obstacle_${Date.now()}_${Math.random()}`,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      health: data.health || 1,
      damage: data.damage || 1,
      isTracking: false,
      trackingSpeed: 0,
      isBouncing: false,
      bounceCount: 0,
      maxBounces: 0,
      isExplosive: data.isExplosive || false,
      explosionRadius: data.explosionRadius || 0,
      isInvulnerable: data.isInvulnerable || false,
      invulnerabilityTime: data.invulnerabilityTime || 0,
      velocityX,
      velocityY,
      spawnSide,
      diagonalAngle: Math.atan2(velocityY, velocityX),
      gravity: 0,
      bounceEnergy: 0,
      aiType: 'passive',
      aiState: 'idle',
      aiTimer: 0,
      aiCooldown: 0,
      patrolPoints: [],
      currentPatrolIndex: 0,
      swarmCenter: { x: 0, y: 0 },
      avoidanceRadius: 0,
      maxSpeed: speed,
      acceleration: 0,
      friction: 1,
    }

    obstaclesRef.current.push(obstacle)
    
    if (sceneRef.current) {
      const mesh = createObstacle(obstacle)
      sceneRef.current.add(mesh)
      obstacleMeshesRef.current.set(obstacle.id, mesh)
    }
  }, [])

  const activateBoost = useCallback(() => {
    spaceshipRef.current.boostTime += 5000 // Increased from 3000 to 5000ms
  }, [])

  const checkCollisions = useCallback(() => {
    const ship = spaceshipRef.current

    for (const obstacle of obstaclesRef.current) {
      // Skip collision if invisible
      if (ship.isInvisible) continue
      
      if (ship.shield) continue

      if (
        ship.x < obstacle.x + obstacle.width &&
        ship.x + ship.width > obstacle.x &&
        ship.y < obstacle.y + obstacle.height &&
        ship.y + ship.height > obstacle.y
      ) {
        ship.screenShakeIntensity = Math.max(ship.screenShakeIntensity, 5)
        
        if (ship.health > 0) {
          ship.health -= obstacle.damage || 1
          if (ship.health <= 0) {
            gameOver()
            return
          }
        } else {
          gameOver()
          return
        }
      }
    }

    for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
      const powerUp = powerUpsRef.current[i]

      if (
        ship.x < powerUp.x + powerUp.width &&
        ship.x + ship.width > powerUp.x &&
        ship.y < powerUp.y + powerUp.height &&
        ship.y + ship.height > powerUp.y
      ) {
        collectPowerUp(powerUp)
        
        const mesh = powerUpMeshesRef.current.get(powerUp.id)
        if (mesh && sceneRef.current) {
          sceneRef.current.remove(mesh)
        }
        powerUpMeshesRef.current.delete(powerUp.id)
        powerUpsRef.current.splice(i, 1)
      }
    }
  }, [])

  const collectPowerUp = useCallback((powerUp: PowerUp) => {
    const gameState = gameStateRef.current
    
    const levelMultiplier = Math.max(1, Math.floor(gameState.difficultyLevel))
    const baseScoreGain = 10 * levelMultiplier
    
    let scoreGain = baseScoreGain
    
    switch (powerUp.rarity) {
      case 'common':
        scoreGain = baseScoreGain
        break
      case 'rare':
        scoreGain = baseScoreGain * 2
        break
      case 'epic':
        scoreGain = baseScoreGain * 3
        break
      case 'legendary':
        scoreGain = baseScoreGain * 5
        break
    }
    
    if (powerUp.type === 'bonus') {
      scoreGain += baseScoreGain
    }
    
    const newScore = gameState.score + scoreGain
    const newHighScore = newScore > gameState.highScore ? newScore : gameState.highScore

    gameState.score = newScore
    gameState.highScore = newHighScore
    gameState.newHighScore = newScore > gameState.highScore

    if (typeof window !== "undefined") {
      localStorage.setItem("starRunHighScore", String(newHighScore))
    }

    if (powerUp.type === "shield") {
      spaceshipRef.current.shield = true
      spaceshipRef.current.shieldTime = 5000
    } else if (powerUp.type === "boost") {
      spaceshipRef.current.boostTime += 5000 // Increased from 3000 to 5000ms
    } else if (powerUp.type === "invisibility") {
      spaceshipRef.current.isInvisible = true
      spaceshipRef.current.invisibilityTime = 4000
    } else if (powerUp.type === "multishot") {
      spaceshipRef.current.hasMultishot = true
      spaceshipRef.current.multishotTime = 6000
    } else if (powerUp.type === "magnet") {
      spaceshipRef.current.hasMagnet = true
      spaceshipRef.current.magnetTime = 8000
      spaceshipRef.current.magnetRange = 80
    } else if (powerUp.type === "timefreeze") {
      spaceshipRef.current.isTimeFrozen = true
      spaceshipRef.current.timeFreezeTime = 5000
    }

    setGameState({ ...gameState })
  }, [])

  const gameOver = useCallback(() => {
    gameStateRef.current.isGameOver = true
    setGameState({ ...gameStateRef.current })
    onGameOver(gameStateRef.current.score, gameStateRef.current.score * 10)
  }, [onGameOver])

  const resetGame = useCallback(() => {
    gameStateRef.current = {
      ...gameStateRef.current,
      isGameOver: false,
      score: 0,
      gameSpeed: 2,
      newHighScore: false,
      difficultyLevel: 1,
      obstacleSpawnRate: 1800, // Balanced initial spawn rate
      powerUpSpawnRate: 5000,
      obstacleSpeedMultiplier: 1,
      obstacleSizeMultiplier: 1,
      obstacleCountMultiplier: 1.0, // Normal initial count
      powerUpRarity: 1,
      screenShakeIntensity: 0,
      gravityWellActive: false,
      gravityWellStrength: 0,
      meteorShowerActive: false,
      meteorShowerIntensity: 0,
    }

    spaceshipRef.current = {
      x: gameStateRef.current.width / 2 - 20,
      y: gameStateRef.current.height - 80,
      width: 40,
      height: 30,
      velocity: 0,
      boost: false,
      boostTime: 0,
      shield: false,
      shieldTime: 0,
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      isInvisible: false,
      invisibilityTime: 0,
      hasMultishot: false,
      multishotTime: 0,
      hasMagnet: false,
      magnetTime: 0,
      magnetRange: 50,
      isTimeFrozen: false,
      timeFreezeTime: 0,
      screenShakeX: 0,
      screenShakeY: 0,
      screenShakeIntensity: 0,
    }

    // Clear all meshes
    obstacleMeshesRef.current.forEach((mesh) => {
      if (sceneRef.current) {
        sceneRef.current.remove(mesh)
      }
    })
    obstacleMeshesRef.current.clear()

    powerUpMeshesRef.current.forEach((mesh) => {
      if (sceneRef.current) {
        sceneRef.current.remove(mesh)
      }
    })
    powerUpMeshesRef.current.clear()

    obstaclesRef.current = []
    powerUpsRef.current = []
    frameCountRef.current = 0
    lastObstacleSpawnRef.current = 0
    lastPowerUpSpawnRef.current = 0

    setGameState({ ...gameStateRef.current })
    setSpaceship({ ...spaceshipRef.current })
  }, [])

  const renderGame = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return

    const gameState = gameStateRef.current
    const ship = spaceshipRef.current

    // Update spaceship position in 3D
    if (spaceshipMeshRef.current) {
      const x3d = (ship.x - gameState.width / 2) / 20
      const y3d = -(ship.y - gameState.height / 2) / 20
      spaceshipMeshRef.current.position.set(x3d, y3d, 0)
      
      // Add tilt effect
      spaceshipMeshRef.current.rotation.z = -ship.velocity * 0.05
      
      // Boost effect
      if (ship.boost) {
        const boostGlow = spaceshipMeshRef.current.children.find(
          (child: THREE.Object3D) => child instanceof THREE.Mesh && (child.material as any).color?.getHex() === 0xff6600
        )
        if (boostGlow) {
          (boostGlow as THREE.Mesh).scale.setScalar(1.5 + Math.sin(Date.now() * 0.01) * 0.5)
        }
      }
      
      // Shield effect
      if (ship.shield) {
        if (!spaceshipMeshRef.current.userData.shield) {
          const shieldGeometry = new THREE.SphereGeometry(2.5, 32, 32)
          const shieldMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            wireframe: false
          })
          const shield = new THREE.Mesh(shieldGeometry, shieldMaterial)
          spaceshipMeshRef.current.add(shield)
          spaceshipMeshRef.current.userData.shield = shield
        }
      } else if (spaceshipMeshRef.current.userData.shield) {
        spaceshipMeshRef.current.remove(spaceshipMeshRef.current.userData.shield)
        spaceshipMeshRef.current.userData.shield = null
      }

      // Invisibility effect
      if (ship.isInvisible) {
        spaceshipMeshRef.current.children.forEach((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh && child.material && child !== spaceshipMeshRef.current?.userData.shield) {
            (child.material as THREE.Material).transparent = true
            ;(child.material as THREE.Material).opacity = 0.3
          }
        })
      } else {
        spaceshipMeshRef.current.children.forEach((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh && child.material && child !== spaceshipMeshRef.current?.userData.shield) {
            (child.material as THREE.Material).transparent = false
            ;(child.material as THREE.Material).opacity = 1.0
          }
        })
      }
    }

    // Update obstacle positions in 3D
    obstaclesRef.current.forEach(obstacle => {
      const mesh = obstacleMeshesRef.current.get(obstacle.id)
      if (mesh) {
        const x3d = (obstacle.x - gameState.width / 2) / 20
        const y3d = -(obstacle.y - gameState.height / 2) / 20
        mesh.position.set(x3d, y3d, 0)
        mesh.rotation.x = obstacle.rotation
        mesh.rotation.y = obstacle.rotation * 0.5
        mesh.rotation.z = obstacle.rotation * 0.3
      }
    })

    // Update power-up positions in 3D
    powerUpsRef.current.forEach(powerUp => {
      const mesh = powerUpMeshesRef.current.get(powerUp.id)
      if (mesh) {
        const x3d = (powerUp.x - gameState.width / 2) / 20
        const y3d = -(powerUp.y - gameState.height / 2) / 20
        mesh.position.set(x3d, y3d, 0)
        
        // Rotation animation
        mesh.rotation.y += 0.02
        
        // Pulsing animation
        if (powerUp.isPulsing && powerUp.pulseSpeed) {
          const scale = 1 + Math.sin(Date.now() * powerUp.pulseSpeed) * 0.2
          mesh.scale.setScalar(scale)
        }
      }
    })

    // Animate starfield
    particleSystemsRef.current.forEach(particles => {
      particles.rotation.y += 0.0001
    })

    // Camera shake
    if (ship.screenShakeIntensity > 0) {
      cameraRef.current.position.x = ship.screenShakeX * 0.05
      cameraRef.current.position.y = 10 + ship.screenShakeY * 0.05
    } else {
      cameraRef.current.position.x = 0
      cameraRef.current.position.y = 10
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current)
  }, [])

  return (
    <div className={styles.gameContainer}>
      <div ref={containerRef} className={styles.gameCanvas} />

      {gameState.isGameOver && (
        <div className={styles.gameOverOverlay}>
          <div className={styles.gameOverContent}>
            <h2>GAME OVER</h2>
            <p>Final Score: {gameState.score}</p>
            <p>Distance: {gameState.score * 10} light years</p>
            <button onClick={resetGame} className={styles.restartButton}>
              Press SPACE to Restart
            </button>
          </div>
        </div>
      )}

      <div className={styles.controls}>
        <p>Use WASD or Arrow Keys to move</p>
        <p>Press SPACE to boost (when available)</p>
      </div>
    </div>
  )
}

export default StarRunGame