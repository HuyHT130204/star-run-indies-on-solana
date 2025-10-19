"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { VorldAuthService } from "../lib/auth/VorldAuthService"
import styles from "../styles/EmailLogin.module.scss"

interface EmailLoginProps {
  onLoginSuccess: () => void
}

const EmailLogin: React.FC<EmailLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [requiresOTP, setRequiresOTP] = useState(false)
  const [otp, setOtp] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [emailValid, setEmailValid] = useState(true)
  const [passwordValid, setPasswordValid] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const otpRef = useRef<HTMLInputElement>(null)
  
  const authService = new VorldAuthService()
  
  // Auto-focus first input on mount
  useEffect(() => {
    if (emailRef.current && !requiresOTP) {
      emailRef.current.focus()
    } else if (otpRef.current && requiresOTP) {
      otpRef.current.focus()
    }
  }, [requiresOTP])
  
  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  
  // Password validation
  const validatePassword = (password: string) => {
    return password.length >= 6
  }
  
  // Handle input changes with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    setEmailValid(validateEmail(value) || value === "")
    if (error) setError("")
  }
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    setPasswordValid(validatePassword(value) || value === "")
    if (error) setError("")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate inputs
    const isEmailValid = validateEmail(email)
    const isPasswordValid = validatePassword(password)
    
    setEmailValid(isEmailValid)
    setPasswordValid(isPasswordValid)
    
    if (!isEmailValid || !isPasswordValid) {
      setError("Please check your email and password")
      return
    }
    
    setLoading(true)
    setError("")
    setIsAnimating(true)

    try {
      const result = await authService.loginWithEmail(email, password)

      if (result.success) {
        if (result.data?.requiresOTP) {
          setRequiresOTP(true)
          setTimeout(() => {
            if (otpRef.current) otpRef.current.focus()
          }, 300)
        } else {
          onLoginSuccess()
        }
      } else {
        setError(result.error || "Login failed")
      }
    } catch (err) {
      setError("An error occurred during login")
    } finally {
      setLoading(false)
      setIsAnimating(false)
    }
  }

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }
    
    setLoading(true)
    setError("")
    setIsAnimating(true)

    try {
      const result = await authService.verifyOTP(email, otp)

      if (result.success) {
        onLoginSuccess()
      } else {
        setError(result.error || "OTP verification failed")
      }
    } catch (err) {
      setError("An error occurred during OTP verification")
    } finally {
      setLoading(false)
      setIsAnimating(false)
    }
  }
  
  const handleBackToLogin = () => {
    setRequiresOTP(false)
    setOtp("")
    setError("")
    setTimeout(() => {
      if (emailRef.current) emailRef.current.focus()
    }, 300)
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.loginBox} ${isAnimating ? styles.animating : ''}`}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>⭐</div>
            <h1 className={styles.title}>Star Run</h1>
          </div>
          <p className={styles.subtitle}>Interactive Space Runner Game</p>
        </div>

        {!requiresOTP ? (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                <span className={styles.labelText}>Email Address</span>
                {!emailValid && email && (
                  <span className={styles.errorText}>Invalid email format</span>
                )}
              </label>
              <div className={styles.inputWrapper}>
                <input
                  ref={emailRef}
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="your@email.com"
                  className={`${styles.input} ${!emailValid && email ? styles.inputError : ''}`}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                <span className={styles.labelText}>Password</span>
                {!passwordValid && password && (
                  <span className={styles.errorText}>Password must be at least 6 characters</span>
                )}
              </label>
              <div className={styles.inputWrapper}>
                <input
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  className={`${styles.input} ${!passwordValid && password ? styles.inputError : ''}`}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {error && (
              <div className={styles.error}>
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              className={`${styles.button} ${loading ? styles.buttonLoading : ''}`} 
              disabled={loading || !emailValid || !passwordValid || !email || !password}
            >
              {loading ? (
                <>
                  <div className={styles.spinner}></div>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOTPVerify} className={styles.form}>
            <div className={styles.otpHeader}>
              <button 
                type="button" 
                className={styles.backButton}
                onClick={handleBackToLogin}
              >
                ← Back to Login
              </button>
              <p className={styles.otpSubtitle}>
                We've sent a 6-digit code to<br />
                <strong>{email}</strong>
              </p>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="otp" className={styles.label}>
                <span className={styles.labelText}>Verification Code</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  ref={otpRef}
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setOtp(value)
                    if (error) setError("")
                  }}
                  placeholder="000000"
                  className={styles.input}
                  required
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>
            </div>

            {error && (
              <div className={styles.error}>
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              className={`${styles.button} ${loading ? styles.buttonLoading : ''}`} 
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <>
                  <div className={styles.spinner}></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Verify Code</span>
                </>
              )}
            </button>
          </form>
        )}
        
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Powered by <span className={styles.brand}>Vorld</span> • Built on <span className={styles.brand}>Solana</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default EmailLogin
