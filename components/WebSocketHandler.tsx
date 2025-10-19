"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import io from "socket.io-client"
import type { ViewerAction, WebSocketEvent, DropEvent } from "../types"

type SocketType = ReturnType<typeof io>

interface WebSocketHandlerProps {
  onViewerAction: (action: ViewerAction) => void
  onConnectionStatusChange: (connected: boolean) => void
  userToken: string
}

const WebSocketHandler: React.FC<WebSocketHandlerProps> = ({ onViewerAction, onConnectionStatusChange, userToken }) => {
  const [socket, setSocket] = useState<SocketType | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [lastReconnectTime, setLastReconnectTime] = useState(0)

  const maxReconnectAttempts = 5
  const reconnectDelay = 3000

  useEffect(() => {
    if (!userToken) return

    const arenaServerUrl = process.env.NEXT_PUBLIC_ARENA_SERVER_URL

    if (!arenaServerUrl) {
      console.warn("⚠️ WebSocketHandler: NEXT_PUBLIC_ARENA_SERVER_URL not defined")
      setIsConnected(false)
      onConnectionStatusChange(false)
      return
    }

    console.log("🔌 WebSocketHandler: Connecting to arena server...", arenaServerUrl)

    const newSocket = io(arenaServerUrl, {
      auth: {
        token: userToken,
      },
      transports: ["websocket", "polling"],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: reconnectDelay,
    })

    newSocket.on("connect", () => {
      console.log("✅ WebSocketHandler: Connected to arena server")
      setIsConnected(true)
      setReconnectAttempts(0)
      onConnectionStatusChange(true)
    })

    newSocket.on("disconnect", (reason: string) => {
      console.log("❌ WebSocketHandler: Disconnected from arena server:", reason)
      setIsConnected(false)
      onConnectionStatusChange(false)
    })

    newSocket.on("connect_error", (error: Error) => {
      console.error("❌ WebSocketHandler: Connection error:", error)
      setIsConnected(false)
      onConnectionStatusChange(false)
    })

    newSocket.on("reconnect", (attemptNumber: number) => {
      console.log("🔄 WebSocketHandler: Reconnected after", attemptNumber, "attempts")
      setIsConnected(true)
      setReconnectAttempts(0)
      onConnectionStatusChange(true)
    })

    newSocket.on("reconnect_attempt", (attemptNumber: number) => {
      console.log("🔄 WebSocketHandler: Reconnection attempt", attemptNumber)
      setReconnectAttempts(attemptNumber)
    })

    newSocket.on("reconnect_error", (error: Error) => {
      console.error("❌ WebSocketHandler: Reconnection error:", error)
    })

    newSocket.on("reconnect_failed", () => {
      console.error("❌ WebSocketHandler: Reconnection failed after", maxReconnectAttempts, "attempts")
      setIsConnected(false)
      onConnectionStatusChange(false)
    })

    newSocket.on("arena_event", (eventData: WebSocketEvent) => {
      console.log("🎯 WebSocketHandler: Arena event received:", eventData)
      handleArenaEvent(eventData)
    })

    newSocket.on("drop_event", (dropData: DropEvent) => {
      console.log("🎁 WebSocketHandler: Drop event received:", dropData)
      handleDropEvent(dropData)
    })

    newSocket.on("viewer_action", (actionData: any) => {
      console.log("👥 WebSocketHandler: Viewer action received:", actionData)
      handleViewerAction(actionData)
    })

    newSocket.on("error", (error: Error) => {
      console.error("❌ WebSocketHandler: Socket error:", error)
    })

    setSocket(newSocket)

    return () => {
      console.log("🔌 WebSocketHandler: Cleaning up socket connection")
      newSocket.close()
    }
  }, [userToken, onConnectionStatusChange])

  const handleArenaEvent = useCallback(
    (eventData: WebSocketEvent) => {
      try {
        const action: ViewerAction = {
          id: `arena_${Date.now()}_${Math.random()}`,
          type: "powerup",
          timestamp: Date.now(),
          data: {
            type: "bonus",
            points: 25,
            duration: 15000,
            x: Math.random() * 800,
            y: Math.random() * 400,
          },
        }

        onViewerAction(action)
      } catch (error) {
        console.error("❌ WebSocketHandler: Error handling arena event:", error)
      }
    },
    [onViewerAction],
  )

  const handleDropEvent = useCallback(
    (dropData: DropEvent) => {
      try {
        let actionType: "powerup" | "obstacle" | "boost" = "powerup"
        let actionData: any = {}

        switch (dropData.eventName) {
          case "Drop Power-up":
          case "Drop Shield":
            actionType = "powerup"
            actionData = {
              type: dropData.itemName === "Drop Shield" ? "shield" : "bonus",
              points: 20,
              duration: 10000,
              x: dropData.position?.x || Math.random() * 800,
              y: dropData.position?.y || Math.random() * 400,
            }
            break

          case "Drop Obstacle":
          case "Spawn Asteroid":
            actionType = "obstacle"
            actionData = {
              type: "asteroid",
              width: 40,
              height: 40,
              speed: 4,
              x: dropData.position?.x || Math.random() * 800,
              y: dropData.position?.y || Math.random() * 400,
            }
            break

          case "Drop Boost":
          case "Activate Boost":
            actionType = "boost"
            actionData = {
              duration: 5000,
            }
            break

          default:
            console.log("🤷 WebSocketHandler: Unknown drop event:", dropData.eventName)
            return
        }

        const action: ViewerAction = {
          id: `drop_${Date.now()}_${Math.random()}`,
          type: actionType,
          timestamp: Date.now(),
          data: actionData,
        }

        onViewerAction(action)
      } catch (error) {
        console.error("❌ WebSocketHandler: Error handling drop event:", error)
      }
    },
    [onViewerAction],
  )

  const handleViewerAction = useCallback(
    (actionData: any) => {
      try {
        const action: ViewerAction = {
          id: `viewer_${Date.now()}_${Math.random()}`,
          type: actionData.type || "powerup",
          timestamp: Date.now(),
          data: actionData.data || actionData,
        }

        onViewerAction(action)
      } catch (error) {
        console.error("❌ WebSocketHandler: Error handling viewer action:", error)
      }
    },
    [onViewerAction],
  )

  const reconnect = useCallback(() => {
    if (socket && !isConnected) {
      const now = Date.now()
      if (now - lastReconnectTime > reconnectDelay) {
        console.log("🔄 WebSocketHandler: Manual reconnection attempt")
        setLastReconnectTime(now)
        socket.connect()
      }
    }
  }, [socket, isConnected, lastReconnectTime])

  const sendMessage = useCallback(
    (event: string, data: any) => {
      if (socket && isConnected) {
        socket.emit(event, data)
      } else {
        console.warn("⚠️ WebSocketHandler: Cannot send message, not connected")
      }
    },
    [socket, isConnected],
  )

  const sendGameState = useCallback(
    (gameState: any) => {
      sendMessage("game_state_update", {
        score: gameState.score,
        distance: gameState.score * 10,
        timestamp: Date.now(),
      })
    },
    [sendMessage],
  )

  const sendScoreUpdate = useCallback(
    (score: number, distance: number) => {
      sendMessage("score_update", {
        score,
        distance,
        timestamp: Date.now(),
      })
    },
    [sendMessage],
  )

  return <div style={{ display: "none" }}>{/* This component doesn't render anything visible */}</div>
}

export default WebSocketHandler
