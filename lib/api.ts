// API service for Star Run game
import axios from 'axios'
import { ScoreSubmission, BonkReward, LeaderboardEntry } from '../types'

export class GameAPIService {
  private baseURL: string
  private authToken: string | null = null

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_GAME_API_URL || ''
    
    if (!this.baseURL) {
      console.warn('⚠️ GameAPIService: NEXT_PUBLIC_GAME_API_URL not defined')
    }
  }

  // Set authentication token
  setAuthToken(token: string): void {
    this.authToken = token
  }

  // Get headers for API requests
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }

    return headers
  }

  // Submit game score
  async submitScore(scoreData: ScoreSubmission): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('📊 Submitting score:', scoreData)
      
      const response = await axios.post(`${this.baseURL}/scores`, scoreData, {
        headers: this.getHeaders(),
        timeout: 10000
      })

      console.log('✅ Score submitted successfully:', response.data)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      console.error('❌ Failed to submit score:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to submit score'
      }
    }
  }

  // Trigger Bonk token reward
  async triggerBonkReward(rewardData: BonkReward): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('💰 Triggering Bonk reward:', rewardData)
      
      const response = await axios.post(`${this.baseURL}/rewards/bonk`, rewardData, {
        headers: this.getHeaders(),
        timeout: 10000
      })

      console.log('✅ Bonk reward triggered successfully:', response.data)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      console.error('❌ Failed to trigger Bonk reward:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to trigger Bonk reward'
      }
    }
  }

  // Get leaderboard
  async getLeaderboard(limit: number = 10): Promise<{ success: boolean; data?: LeaderboardEntry[]; error?: string }> {
    try {
      console.log('🏆 Fetching leaderboard...')
      
      const response = await axios.get(`${this.baseURL}/leaderboard?limit=${limit}`, {
        headers: this.getHeaders(),
        timeout: 10000
      })

      console.log('✅ Leaderboard fetched successfully:', response.data)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch leaderboard:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch leaderboard'
      }
    }
  }

  // Get user stats
  async getUserStats(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('📈 Fetching user stats for:', userId)
      
      const response = await axios.get(`${this.baseURL}/users/${userId}/stats`, {
        headers: this.getHeaders(),
        timeout: 10000
      })

      console.log('✅ User stats fetched successfully:', response.data)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch user stats:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch user stats'
      }
    }
  }

  // Send viewer action to server
  async sendViewerAction(actionData: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('👥 Sending viewer action:', actionData)
      
      const response = await axios.post(`${this.baseURL}/viewer-actions`, actionData, {
        headers: this.getHeaders(),
        timeout: 5000
      })

      console.log('✅ Viewer action sent successfully:', response.data)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      console.error('❌ Failed to send viewer action:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to send viewer action'
      }
    }
  }

  // Health check
  async healthCheck(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🏥 Checking API health...')
      
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000
      })

      console.log('✅ API health check successful:', response.data)
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      console.error('❌ API health check failed:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'API health check failed'
      }
    }
  }
}

// Singleton instance
export const gameAPI = new GameAPIService()

