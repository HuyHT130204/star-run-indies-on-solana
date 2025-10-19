import axios from "axios"
import Cookies from "js-cookie"

export class VorldAuthService {
  private authServerUrl: string
  private appId: string
  private readonly AUTH_TOKEN_KEY = "vorld_auth_token"

  constructor() {
    this.authServerUrl = process.env.NEXT_PUBLIC_AUTH_SERVER_URL || ""
    this.appId = process.env.NEXT_PUBLIC_VORLD_APP_ID || ""

    if (!this.authServerUrl || !this.appId) {
      console.warn("⚠️ VorldAuthService: Missing environment variables")
      console.log("Auth Server URL:", this.authServerUrl ? "✓" : "✗")
      console.log("App ID:", this.appId ? "✓" : "✗")
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  async loginWithEmail(email: string, password: string) {
    try {
      console.log("🔐 VorldAuthService: Starting login process")
      console.log("🔗 Auth Server URL:", this.authServerUrl)
      console.log("🆔 App ID:", this.appId)

      if (!this.authServerUrl || !this.appId) {
        console.warn("⚠️ Missing environment variables, using mock authentication")
        return this.mockLogin(email, password)
      }

      const hashedPassword = await this.hashPassword(password)

      const response = await axios.post(
        `${this.authServerUrl}/auth/login`,
        {
          email,
          password: hashedPassword,
          appId: this.appId,
        },
        {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      console.log("📋 Login response:", response.data)

      if (response.data.success) {
        const token = response.data.data?.token
        if (token) {
          this.setAuthToken(token)
          console.log("✅ Login successful, token stored")
        }
        return {
          success: true,
          data: response.data.data,
          error: null,
        }
      } else {
        return {
          success: false,
          data: null,
          error: response.data.error || "Login failed",
        }
      }
    } catch (error: any) {
      console.error("❌ Login error:", error)

      if (error.response?.status === 404 || error.code === "ECONNREFUSED") {
        console.warn("⚠️ API not available, using mock authentication")
        return this.mockLogin(email, password)
      }

      return {
        success: false,
        data: null,
        error: error.response?.data?.error || error.message || "Login failed",
      }
    }
  }

  private async mockLogin(email: string, password: string) {
    console.log("🎭 Using mock authentication for development")

    if (email && password && password.length >= 6) {
      const mockToken = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      this.setAuthToken(mockToken)

      return {
        success: true,
        data: {
          token: mockToken,
          user: {
            id: "mock_user_id",
            email: email,
            username: email.split("@")[0],
          },
          requiresOTP: false,
        },
        error: null,
      }
    } else {
      return {
        success: false,
        data: null,
        error: "Invalid email or password",
      }
    }
  }

  async verifyOTP(email: string, otp: string) {
    try {
      console.log("🔐 VorldAuthService: Starting OTP verification")

      const response = await axios.post(`${this.authServerUrl}/auth/verify-otp`, {
        email,
        otp,
        appId: this.appId,
      })

      console.log("📋 OTP verification response:", response.data)

      if (response.data.success) {
        const token = response.data.data?.token
        if (token) {
          this.setAuthToken(token)
          console.log("✅ OTP verification successful, token stored")
        }
        return {
          success: true,
          data: response.data.data,
          error: null,
        }
      } else {
        return {
          success: false,
          data: null,
          error: response.data.error || "OTP verification failed",
        }
      }
    } catch (error: any) {
      console.error("❌ OTP verification error:", error)
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "OTP verification failed",
      }
    }
  }

  async checkAuthStatus(): Promise<boolean> {
    const token = this.getAuthToken()
    if (!token) {
      console.log("🔍 No auth token found")
      return false
    }

    if (token.startsWith("mock_token_")) {
      console.log("🔍 Mock token found, considering authenticated")
      return true
    }

    if (!this.authServerUrl || !this.appId) {
      console.warn("⚠️ Missing environment variables, using mock auth status")
      return true
    }

    try {
      console.log("🔍 Checking auth status with server")
      const response = await axios.get(`${this.authServerUrl}/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-App-Id": this.appId,
        },
        timeout: 5000,
      })

      const isValid = response.data.success
      console.log("🔍 Auth status check result:", isValid)

      if (!isValid) {
        this.clearAuthToken()
      }

      return isValid
    } catch (error: any) {
      console.error("❌ Auth status check failed:", error)

      if (error.response?.status === 404 || error.code === "ECONNREFUSED") {
        console.warn("⚠️ API not available, assuming mock token is valid")
        return true
      }

      this.clearAuthToken()
      return false
    }
  }

  async logout() {
    try {
      const token = this.getAuthToken()
      if (token) {
        // Skip server logout if no auth server URL or if using mock token
        if (!this.authServerUrl || !this.appId || token.startsWith("mock_token_")) {
          console.log("🎭 Skipping server logout (mock token or missing config)")
          return
        }

        await axios.post(
          `${this.authServerUrl}/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-App-Id": this.appId,
            },
            timeout: 5000,
          },
        )
        console.log("✅ Server logout successful")
      }
    } catch (error: any) {
      console.error("❌ Logout error:", error)
      
      // Handle 404 and connection errors gracefully
      if (error.response?.status === 404 || error.code === "ECONNREFUSED") {
        console.warn("⚠️ Auth server not available, proceeding with local logout")
      } else {
        console.error("❌ Unexpected logout error:", error.message)
      }
    } finally {
      this.clearAuthToken()
      console.log("🧹 Auth token cleared")
    }
  }

  getAuthToken(): string | null {
    if (typeof window === "undefined") return null
    return Cookies.get(this.AUTH_TOKEN_KEY) || null
  }

  private setAuthToken(token: string) {
    if (typeof window === "undefined") return
    Cookies.set(this.AUTH_TOKEN_KEY, token, { expires: 7 })
  }

  clearAuthToken() {
    if (typeof window === "undefined") return
    Cookies.remove(this.AUTH_TOKEN_KEY)
  }

  async getUserProfile() {
    try {
      const token = this.getAuthToken()
      if (!token) {
        throw new Error("No auth token")
      }

      const response = await axios.get(`${this.authServerUrl}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-App-Id": this.appId,
        },
      })

      return {
        success: true,
        data: response.data.data,
        error: null,
      }
    } catch (error: any) {
      console.error("❌ Get profile error:", error)
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || "Failed to get profile",
      }
    }
  }
}
