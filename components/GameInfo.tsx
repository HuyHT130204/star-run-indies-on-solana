import React from 'react'
import styles from '../styles/GameInfo.module.scss'

interface GameInfoProps {
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
}

const GameInfo: React.FC<GameInfoProps> = ({
  score,
  highScore,
  level,
  health,
  maxHealth,
  nextLevelProgress,
  newHighScore,
  shield,
  boost,
  isInvisible,
  hasMultishot,
  hasMagnet,
  isTimeFrozen,
  gravityWellActive,
  meteorShowerActive
}) => {
  return (
    <div className={styles.gameInfo}>
      <div className={styles.scoreSection}>
        <div className={styles.scoreRow}>
          <div className={styles.score}>Score: {score}</div>
          <div className={styles.highScore}>High: {highScore}</div>
        </div>
        <div className={styles.levelRow}>
          <div className={styles.level}>Level: {level}</div>
          <div className={styles.healthBar}>
            <div className={styles.healthLabel}>HP:</div>
            <div className={styles.healthContainer}>
              <div 
                className={styles.healthFill}
                style={{ 
                  width: `${(health / maxHealth) * 100}%`,
                  backgroundColor: health > 50 ? '#4CAF50' : health > 25 ? '#FF9800' : '#F44336'
                }}
              ></div>
            </div>
            <div className={styles.healthText}>{health}</div>
          </div>
        </div>
        <div className={styles.levelProgress}>
          <div className={styles.levelProgressLabel}>Next Level:</div>
          <div className={styles.levelProgressBar}>
            <div 
              className={styles.levelProgressFill}
              style={{ width: `${nextLevelProgress}%` }}
            />
          </div>
        </div>
        {newHighScore && <div className={styles.newHighScore}>NEW HIGH SCORE!</div>}
      </div>


        <div className={styles.statusSection}>
          <h4>Active Effects:</h4>
          <div className={styles.statusList}>
            {shield && <div className={styles.statusItem}>🛡️ Shield Active</div>}
            {boost && <div className={styles.statusItem}>⚡ Boost Active</div>}
            {isInvisible && <div className={styles.statusItem}>👻 Invisible</div>}
            {hasMultishot && <div className={styles.statusItem}>🔫 Multishot</div>}
            {hasMagnet && <div className={styles.statusItem}>🧲 Magnet</div>}
            {isTimeFrozen && <div className={styles.statusItem}>⏰ Time Freeze</div>}
            {gravityWellActive && <div className={styles.statusItem}>🌀 Gravity Well</div>}
            {meteorShowerActive && <div className={styles.statusItem}>☄️ Meteor Shower</div>}
          </div>
        </div>
    </div>
  )
}

export default GameInfo
