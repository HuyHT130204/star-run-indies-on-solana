// Performance optimization utilities for Star Run game

export class PerformanceManager {
  private static instance: PerformanceManager
  private frameCount = 0
  private lastFPSUpdate = 0
  private fps = 60
  private targetFPS = 60
  private frameTime = 1000 / this.targetFPS
  private lastFrameTime = 0

  private constructor() {}

  static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager()
    }
    return PerformanceManager.instance
  }

  // Check if we should skip this frame to maintain target FPS
  shouldSkipFrame(currentTime: number): boolean {
    const deltaTime = currentTime - this.lastFrameTime
    
    if (deltaTime < this.frameTime) {
      return true
    }
    
    this.lastFrameTime = currentTime
    return false
  }

  // Update FPS calculation
  updateFPS(currentTime: number): void {
    this.frameCount++
    
    if (currentTime - this.lastFPSUpdate >= 1000) {
      this.fps = this.frameCount
      this.frameCount = 0
      this.lastFPSUpdate = currentTime
      
      // Adjust target FPS based on performance
      if (this.fps < 30) {
        this.targetFPS = Math.max(30, this.targetFPS - 5)
      } else if (this.fps > 50) {
        this.targetFPS = Math.min(60, this.targetFPS + 1)
      }
      
      this.frameTime = 1000 / this.targetFPS
    }
  }

  // Get current FPS
  getFPS(): number {
    return this.fps
  }

  // Get target FPS
  getTargetFPS(): number {
    return this.targetFPS
  }

  // Reset performance counters
  reset(): void {
    this.frameCount = 0
    this.lastFPSUpdate = 0
    this.fps = 60
    this.targetFPS = 60
    this.frameTime = 1000 / this.targetFPS
    this.lastFrameTime = 0
  }
}

// Object pooling for game objects
export class ObjectPool<T> {
  private pool: T[] = []
  private createFn: () => T
  private resetFn: (obj: T) => void

  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize = 10) {
    this.createFn = createFn
    this.resetFn = resetFn
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn())
    }
  }

  get(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return this.createFn()
  }

  release(obj: T): void {
    this.resetFn(obj)
    this.pool.push(obj)
  }

  getPoolSize(): number {
    return this.pool.length
  }
}

// Throttle function calls
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Debounce function calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

// Memory usage monitoring
export class MemoryMonitor {
  private static instance: MemoryMonitor
  private memoryInfo: any = null

  private constructor() {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      this.memoryInfo = (performance as any).memory
    }
  }

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor()
    }
    return MemoryMonitor.instance
  }

  getMemoryUsage(): {
    used: number
    total: number
    limit: number
    percentage: number
  } | null {
    if (!this.memoryInfo) return null

    const used = this.memoryInfo.usedJSHeapSize
    const total = this.memoryInfo.totalJSHeapSize
    const limit = this.memoryInfo.jsHeapSizeLimit
    const percentage = (used / limit) * 100

    return { used, total, limit, percentage }
  }

  isMemoryLow(): boolean {
    const usage = this.getMemoryUsage()
    return usage ? usage.percentage > 80 : false
  }
}

// Game loop optimization
export class GameLoop {
  private static instance: GameLoop
  private isRunning = false
  private lastTime = 0
  private frameId: number | null = null
  private callbacks: Array<(deltaTime: number) => void> = []
  private performanceManager = PerformanceManager.getInstance()

  private constructor() {}

  static getInstance(): GameLoop {
    if (!GameLoop.instance) {
      GameLoop.instance = new GameLoop()
    }
    return GameLoop.instance
  }

  addCallback(callback: (deltaTime: number) => void): void {
    this.callbacks.push(callback)
  }

  removeCallback(callback: (deltaTime: number) => void): void {
    const index = this.callbacks.indexOf(callback)
    if (index > -1) {
      this.callbacks.splice(index, 1)
    }
  }

  start(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.lastTime = performance.now()
    this.loop()
  }

  stop(): void {
    this.isRunning = false
    if (this.frameId) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
  }

  private loop = (currentTime: number = 0): void => {
    if (!this.isRunning) return

    const deltaTime = currentTime - this.lastTime
    
    // Skip frame if too early
    if (this.performanceManager.shouldSkipFrame(currentTime)) {
      this.frameId = requestAnimationFrame(this.loop)
      return
    }

    // Update performance metrics
    this.performanceManager.updateFPS(currentTime)

    // Execute callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(deltaTime)
      } catch (error) {
        console.error('Game loop callback error:', error)
      }
    })

    this.lastTime = currentTime
    this.frameId = requestAnimationFrame(this.loop)
  }

  getFPS(): number {
    return this.performanceManager.getFPS()
  }

  isActive(): boolean {
    return this.isRunning
  }
}

