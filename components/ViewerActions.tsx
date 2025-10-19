import React from 'react'
import { ViewerAction } from '../types'
import styles from '../styles/ViewerActions.module.scss'

interface ViewerActionsProps {
  actions: ViewerAction[]
  maxDisplay?: number
}

const ViewerActions: React.FC<ViewerActionsProps> = ({ 
  actions, 
  maxDisplay = 5 
}) => {
  const recentActions = actions.slice(0, maxDisplay)

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'powerup':
        return '🎁'
      case 'obstacle':
        return '💥'
      case 'boost':
        return '⚡'
      default:
        return '🎮'
    }
  }

  const getActionText = (action: ViewerAction) => {
    switch (action.type) {
      case 'powerup':
        return `Viewer dropped ${action.data.type || 'power-up'}!`
      case 'obstacle':
        return `Viewer spawned ${action.data.type || 'obstacle'}!`
      case 'boost':
        return 'Viewer activated boost!'
      default:
        return 'Viewer action!'
    }
  }

  const getActionColor = (type: string) => {
    switch (type) {
      case 'powerup':
        return '#00ff00'
      case 'obstacle':
        return '#ff0000'
      case 'boost':
        return '#ffff00'
      default:
        return '#00ffff'
    }
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    
    if (seconds < 60) {
      return `${seconds}s ago`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      return `${minutes}m ago`
    } else {
      const hours = Math.floor(seconds / 3600)
      return `${hours}h ago`
    }
  }

  if (recentActions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3>Viewer Actions</h3>
        </div>
        <div className={styles.emptyState}>
          <p>No recent viewer actions</p>
          <p className={styles.subtitle}>Viewers can drop items using tokens!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Viewer Actions</h3>
        <div className={styles.count}>
          {actions.length} total
        </div>
      </div>
      
      <div className={styles.actionsList}>
        {recentActions.map((action, index) => (
          <div
            key={action.id}
            className={styles.actionItem}
            style={{
              animationDelay: `${index * 0.1}s`
            }}
          >
            <div className={styles.actionIcon}>
              {getActionIcon(action.type)}
            </div>
            
            <div className={styles.actionContent}>
              <div 
                className={styles.actionText}
                style={{ color: getActionColor(action.type) }}
              >
                {getActionText(action)}
              </div>
              <div className={styles.actionTime}>
                {formatTimeAgo(action.timestamp)}
              </div>
            </div>
            
            <div className={styles.actionEffect}>
              {action.type === 'powerup' && action.data.points && (
                <span className={styles.points}>+{action.data.points}</span>
              )}
              {action.type === 'boost' && (
                <span className={styles.boostEffect}>⚡</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {actions.length > maxDisplay && (
        <div className={styles.moreActions}>
          <p>+{actions.length - maxDisplay} more actions</p>
        </div>
      )}
    </div>
  )
}

export default ViewerActions
