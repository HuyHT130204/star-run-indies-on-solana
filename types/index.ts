// Authentication types
export interface AuthResponse {
  success: boolean
  data?: any
  error?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  username: string
}

export interface OTPData {
  email: string
  otp: string
}

// Component props
export interface EmailLoginProps {
  onLoginSuccess: () => void
}

export interface GameOverProps {
  score: number
  onRestart: () => void
  width: number
  height: number
  newHighScore?: boolean
  highScore: number
}

// Game types
export interface Position {
  x: number
  y: number
}

export interface GameState {
  width: number
  height: number
  isGameOver: boolean
  score: number
  highScore: number
  newHighScore: boolean
  gameSpeed: number
  paused: boolean
  gameLoopTimeout: number
  timeoutId: NodeJS.Timeout | number
  // Enhanced difficulty system
  difficultyLevel: number
  obstacleSpawnRate: number
  powerUpSpawnRate: number
  obstacleSpeedMultiplier: number
  obstacleSizeMultiplier: number
  obstacleCountMultiplier: number
  powerUpRarity: number
  screenShakeIntensity: number
  gravityWellActive: boolean
  gravityWellStrength: number
  meteorShowerActive: boolean
  meteorShowerIntensity: number
}

// Star Run specific types
export interface Spaceship {
  x: number
  y: number
  width: number
  height: number
  velocity: number
  boost: boolean
  boostTime: number
  shield: boolean
  shieldTime: number
  // Enhanced spaceship properties
  health: number
  maxHealth: number
  energy: number
  maxEnergy: number
  isInvisible: boolean
  invisibilityTime: number
  hasMultishot: boolean
  multishotTime: number
  hasMagnet: boolean
  magnetTime: number
  magnetRange: number
  isTimeFrozen: boolean
  timeFreezeTime: number
  screenShakeX: number
  screenShakeY: number
  screenShakeIntensity: number
}

export interface Obstacle {
  x: number
  y: number
  width: number
  height: number
  type: 'asteroid' | 'debris' | 'enemy' | 'meteor' | 'blackhole' | 'laser'
  speed: number
  id: string
  // Enhanced obstacle properties
  rotation: number
  rotationSpeed: number
  health?: number
  damage?: number
  isTracking?: boolean
  trackingSpeed?: number
  isBouncing?: boolean
  bounceCount?: number
  maxBounces?: number
  isExplosive?: boolean
  explosionRadius?: number
  isInvulnerable?: boolean
  invulnerabilityTime?: number
  // Free flying movement properties
  velocityX: number
  velocityY: number
  spawnSide: 'left' | 'right' | 'top' | 'center' | 'random' | 'bottom'
  diagonalAngle: number
  gravity: number
  bounceEnergy: number
  // AI behavior for free flying
  aiType: 'passive' | 'aggressive' | 'patrol' | 'swarm' | 'kamikaze'
  aiState: 'idle' | 'hunting' | 'patrolling' | 'attacking' | 'fleeing'
  aiTimer: number
  aiCooldown: number
  patrolPoints: Array<{x: number, y: number}>
  currentPatrolIndex: number
  swarmCenter: {x: number, y: number}
  avoidanceRadius: number
  maxSpeed: number
  acceleration: number
  friction: number
}

export interface PowerUp {
  x: number
  y: number
  width: number
  height: number
  type: 'shield' | 'boost' | 'bonus' | 'multishot' | 'timefreeze' | 'magnet' | 'invisibility'
  points: number
  id: string
  duration: number
  // Enhanced power-up properties
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  effectStrength: number
  isPulsing?: boolean
  pulseSpeed?: number
  isRotating?: boolean
  rotationSpeed?: number
  isTracking?: boolean
  trackingRange?: number
}

export interface ViewerAction {
  id: string
  type: 'powerup' | 'obstacle' | 'boost'
  timestamp: number
  data: any
}

export interface StarField {
  x: number
  y: number
  speed: number
  size: number
  opacity: number
}

// WebSocket event types
export interface WebSocketEvent {
  type: string
  data: any
  timestamp: number
}

export interface DropEvent {
  eventName: string
  itemName: string
  position?: Position
  data?: any
}

// API response types
export interface ScoreSubmission {
  score: number
  distance: number
  itemsCollected: number
  userId: string
  timestamp: number
}

export interface LeaderboardEntry {
  rank: number
  score: number
  username: string
  timestamp: number
}

export interface BonkReward {
  amount: number
  recipient: string
  reason: string
  transactionId?: string
}

