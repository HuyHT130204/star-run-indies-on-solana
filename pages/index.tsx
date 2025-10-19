import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import StarRunGame from '../components/StarRunGame'
import EmailLogin from '../components/EmailLogin'
import WebSocketHandler from '../components/WebSocketHandler'
import GameInfo from '../components/GameInfo'
import PowerUp3DPreview from '../components/PowerUp3DPreview'
import { VorldAuthService } from '../lib/auth/VorldAuthService'
import { ViewerAction, ScoreSubmission, BonkReward } from '../types'
import styles from '../styles/Home.module.scss'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [showGame, setShowGame] = useState<boolean>(false)
  const [isWebSocketConnected, setIsWebSocketConnected] = useState<boolean>(false)
  const [viewerActions, setViewerActions] = useState<ViewerAction[]>([])
  const [processedActions, setProcessedActions] = useState<Set<string>>(new Set())
  const [gameStats, setGameStats] = useState<{
    score: number
    distance: number
    itemsCollected: number
  } | null>(null)
  
  const [gameInfo, setGameInfo] = useState<{
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
  }>({
    score: 0,
    highScore: 0,
    level: 1,
    health: 100,
    maxHealth: 100,
    nextLevelProgress: 0,
    newHighScore: false,
    shield: false,
    boost: false,
    isInvisible: false,
    hasMultishot: false,
    hasMagnet: false,
    isTimeFrozen: false,
    gravityWellActive: false,
    meteorShowerActive: false
  })

  const authService = new VorldAuthService()

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking authentication status...')
        const isAuth = await authService.checkAuthStatus()
        setIsAuthenticated(isAuth)
        console.log('✅ Authentication check complete:', isAuth)
      } catch (error) {
        console.error('❌ Auth check failed:', error)
        authService.clearAuthToken()
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Handle login success
  const handleLoginSuccess = useCallback(() => {
    console.log('🎉 Login successful!')
    setIsAuthenticated(true)
    setShowGame(true)
  }, [])

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      console.log('🚪 Logging out...')
      await authService.logout()
    } catch (error) {
      console.error('❌ Logout error:', error)
    } finally {
      authService.clearAuthToken()
      setIsAuthenticated(false)
      setShowGame(false)
      setViewerActions([])
      setProcessedActions(new Set())
      setGameStats(null)
    }
  }, [authService])

  // Handle viewer actions from WebSocket
  const handleViewerAction = useCallback((action: ViewerAction) => {
    console.log('🎮 New viewer action:', action)
    setViewerActions(prev => [action, ...prev.slice(0, 49)]) // Keep last 50 actions
  }, [])

  // Handle processed viewer actions
  const handleViewerActionProcessed = useCallback((actionId: string) => {
    setProcessedActions(prev => new Set(prev).add(actionId))
  }, [])

  // Handle game over
  const handleGameOver = useCallback(async (score: number, distance: number) => {
    console.log('🎮 Game over! Score:', score, 'Distance:', distance)
    
    setGameStats({
      score,
      distance,
      itemsCollected: Math.floor(score / 10) // Estimate items collected
    })

    // Submit score to API
    try {
      await submitScore(score, distance)
    } catch (error) {
      console.error('❌ Failed to submit score:', error)
    }

    // Trigger Bonk rewards
    try {
      await triggerBonkRewards(score)
    } catch (error) {
      console.error('❌ Failed to trigger Bonk rewards:', error)
    }
  }, [])

  // Submit score to game API
  const submitScore = async (score: number, distance: number) => {
    const gameApiUrl = process.env.NEXT_PUBLIC_GAME_API_URL
    if (!gameApiUrl) {
      console.warn('⚠️ NEXT_PUBLIC_GAME_API_URL not defined')
      return
    }

    const token = authService.getAuthToken()
    if (!token) {
      console.warn('⚠️ No auth token available')
      return
    }

    const scoreData: ScoreSubmission = {
      score,
      distance,
      itemsCollected: Math.floor(score / 10),
      userId: 'current_user', // In real app, get from auth
      timestamp: Date.now()
    }

    try {
      const response = await fetch(`${gameApiUrl}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(scoreData)
      })

      if (response.ok) {
        console.log('✅ Score submitted successfully')
      } else {
        console.error('❌ Failed to submit score:', response.statusText)
      }
    } catch (error) {
      console.error('❌ Error submitting score:', error)
    }
  }

  // Trigger Bonk token rewards
  const triggerBonkRewards = async (score: number) => {
    const gameApiUrl = process.env.NEXT_PUBLIC_GAME_API_URL
    if (!gameApiUrl) {
      console.warn('⚠️ NEXT_PUBLIC_GAME_API_URL not defined')
      return
    }

    const token = authService.getAuthToken()
    if (!token) {
      console.warn('⚠️ No auth token available')
      return
    }

    // Calculate reward amount based on score
    const baseReward = Math.floor(score / 100) // 1 Bonk per 100 points
    const bonusReward = score > 1000 ? Math.floor(score / 500) : 0 // Bonus for high scores
    const totalReward = Math.max(1, baseReward + bonusReward)

    const rewardData: BonkReward = {
      amount: totalReward,
      recipient: 'current_user', // In real app, get from auth
      reason: `Star Run Score: ${score}`,
    }

    try {
      const response = await fetch(`${gameApiUrl}/rewards/bonk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(rewardData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Bonk reward triggered:', result)
      } else {
        console.error('❌ Failed to trigger Bonk reward:', response.statusText)
      }
    } catch (error) {
      console.error('❌ Error triggering Bonk reward:', error)
    }
  }

  // Handle WebSocket connection status
  const handleWebSocketStatusChange = useCallback((connected: boolean) => {
    console.log('🔌 WebSocket connection status:', connected)
    setIsWebSocketConnected(connected)
  }, [])

  // Handle game info updates
  const handleGameInfoUpdate = useCallback((info: typeof gameInfo) => {
    setGameInfo(info)
  }, [])

  // Show loading screen
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Head>
          <title>Star Run - Loading...</title>
        </Head>
        <div className={styles.loadingSpinner}></div>
        <p>Loading Star Run...</p>
      </div>
    )
  }

  // Show login screen
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Star Run - Login</title>
          <meta name="description" content="A Streamer-Friendly Interactive Runner Game on Solana" />
        </Head>
        <EmailLogin onLoginSuccess={handleLoginSuccess} />
      </>
    )
  }

  // Show game
  return (
    <>
      <Head>
        <title>Star Run - Interactive Space Runner</title>
        <meta name="description" content="A Streamer-Friendly Interactive Runner Game on Solana" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.gameContainer}>
        {/* WebSocket Handler */}
        <WebSocketHandler
          onViewerAction={handleViewerAction}
          onConnectionStatusChange={handleWebSocketStatusChange}
          userToken={authService.getAuthToken() || ''}
        />

        {/* Compact Status Bar */}
        <div className={styles.compactStatusBar}>
          <div className={styles.statusLeft}>
            <div className={styles.gameTitle}>
              <span>Star Run</span>
            </div>
          </div>
          <div className={styles.statusRight}>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>

        {/* Main Layout Container */}
        <div className={styles.mainLayout}>
          {/* Left Panel - Game Info & Stats */}
          <div className={styles.leftPanel}>
            {/* Game Info */}
            <GameInfo
              score={gameInfo.score}
              highScore={gameInfo.highScore}
              level={gameInfo.level}
              health={gameInfo.health}
              maxHealth={gameInfo.maxHealth}
              nextLevelProgress={gameInfo.nextLevelProgress}
              newHighScore={gameInfo.newHighScore}
              shield={gameInfo.shield}
              boost={gameInfo.boost}
              isInvisible={gameInfo.isInvisible}
              hasMultishot={gameInfo.hasMultishot}
              hasMagnet={gameInfo.hasMagnet}
              isTimeFrozen={gameInfo.isTimeFrozen}
              gravityWellActive={gameInfo.gravityWellActive}
              meteorShowerActive={gameInfo.meteorShowerActive}
            />

            {/* Game Stats (if available) */}
            {gameStats && (
              <div className={styles.gameStats}>
                <h3>Last Game Results</h3>
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Score:</span>
                    <span className={styles.statValue}>{gameStats.score.toLocaleString()}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Distance:</span>
                    <span className={styles.statValue}>{gameStats.distance.toLocaleString()} ly</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Items:</span>
                    <span className={styles.statValue}>{gameStats.itemsCollected}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Center - Game Only */}
          <div className={styles.gameArea}>
            <div className={styles.gameWrapper}>
              <StarRunGame
                onGameOver={handleGameOver}
                viewerActions={viewerActions.filter(action => !processedActions.has(action.id))}
                onViewerActionProcessed={handleViewerActionProcessed}
                onGameInfoUpdate={handleGameInfoUpdate}
              />
            </div>
          </div>

          {/* Right Panel - Collectible Items Only */}
          <div className={styles.rightPanel}>
            <div className={styles.powerUpGuide}>
              <div className={styles.powerUpTitle}>Collectible Items</div>
              <div className={styles.powerUpList}>
                <div className={styles.powerUpItem}>
                  <div className={styles.powerUpIcon}>
                    <PowerUp3DPreview type="shield" size={0.6} />
                  </div>
                  <div className={styles.powerUpInfo}>
                    <div className={styles.powerUpName}>Shield</div>
                    <div className={styles.powerUpDesc}>Cyan octahedron - Protects from damage</div>
                  </div>
                </div>
                <div className={styles.powerUpItem}>
                  <div className={styles.powerUpIcon}>
                    <PowerUp3DPreview type="boost" size={0.6} />
                  </div>
                  <div className={styles.powerUpInfo}>
                    <div className={styles.powerUpName}>Boost</div>
                    <div className={styles.powerUpDesc}>Yellow tetrahedron - x2 Speed boost</div>
                  </div>
                </div>
                <div className={styles.powerUpItem}>
                  <div className={styles.powerUpIcon}>
                    <PowerUp3DPreview type="bonus" size={0.6} />
                  </div>
                  <div className={styles.powerUpInfo}>
                    <div className={styles.powerUpName}>Bonus</div>
                    <div className={styles.powerUpDesc}>Green cube - Extra points</div>
                  </div>
                </div>
                <div className={styles.powerUpItem}>
                  <div className={styles.powerUpIcon}>
                    <PowerUp3DPreview type="multishot" size={0.6} />
                  </div>
                  <div className={styles.powerUpInfo}>
                    <div className={styles.powerUpName}>Multishot</div>
                    <div className={styles.powerUpDesc}>Orange torus - Multiple attacks</div>
                  </div>
                </div>
                <div className={styles.powerUpItem}>
                  <div className={styles.powerUpIcon}>
                    <PowerUp3DPreview type="timefreeze" size={0.6} />
                  </div>
                  <div className={styles.powerUpInfo}>
                    <div className={styles.powerUpName}>Time Freeze</div>
                    <div className={styles.powerUpDesc}>Blue icosahedron - Slow down enemies</div>
                  </div>
                </div>
                <div className={styles.powerUpItem}>
                  <div className={styles.powerUpIcon}>
                    <PowerUp3DPreview type="magnet" size={0.6} />
                  </div>
                  <div className={styles.powerUpInfo}>
                    <div className={styles.powerUpName}>Magnet</div>
                    <div className={styles.powerUpDesc}>Green torus - Attract items</div>
                  </div>
                </div>
                <div className={styles.powerUpItem}>
                  <div className={styles.powerUpIcon}>
                    <PowerUp3DPreview type="invisibility" size={0.6} />
                  </div>
                  <div className={styles.powerUpInfo}>
                    <div className={styles.powerUpName}>Invisibility</div>
                    <div className={styles.powerUpDesc}>Purple dodecahedron - Become invisible</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

