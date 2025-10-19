import React from 'react'
import { GameOverProps } from '../types'
import styles from '../styles/GameOver.module.scss'

const GameOver: React.FC<GameOverProps> = ({
  score,
  onRestart,
  width,
  height,
  newHighScore = false,
  highScore
}) => {
  const distance = score * 10 // Convert score to distance in light years

  return (
    <div className={styles.gameOverOverlay}>
      <div className={styles.gameOverContent}>
        <div className={styles.header}>
          <h1 className={styles.title}>GAME OVER</h1>
          <div className={styles.explosion}>💥</div>
        </div>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <div className={styles.statLabel}>Final Score</div>
            <div className={styles.statValue}>{score.toLocaleString()}</div>
          </div>

          <div className={styles.statItem}>
            <div className={styles.statLabel}>Distance Traveled</div>
            <div className={styles.statValue}>{distance.toLocaleString()} light years</div>
          </div>

          <div className={styles.statItem}>
            <div className={styles.statLabel}>High Score</div>
            <div className={styles.statValue}>{highScore.toLocaleString()}</div>
          </div>
        </div>

        {newHighScore && (
          <div className={styles.newHighScore}>
            <div className={styles.newHighScoreIcon}>🏆</div>
            <div className={styles.newHighScoreText}>NEW HIGH SCORE!</div>
          </div>
        )}

        <div className={styles.actions}>
          <button onClick={onRestart} className={styles.restartButton}>
            <span className={styles.buttonIcon}>🚀</span>
            Play Again
          </button>
        </div>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Thanks for playing Star Run!
          </p>
          <p className={styles.footerSubtext}>
            Press SPACE or click to restart
          </p>
        </div>
      </div>
    </div>
  )
}

export default GameOver

