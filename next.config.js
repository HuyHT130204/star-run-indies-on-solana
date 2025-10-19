/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_VORLD_APP_ID: process.env.NEXT_PUBLIC_VORLD_APP_ID,
    NEXT_PUBLIC_AUTH_SERVER_URL: process.env.NEXT_PUBLIC_AUTH_SERVER_URL,
    NEXT_PUBLIC_ARENA_SERVER_URL: process.env.NEXT_PUBLIC_ARENA_SERVER_URL,
    NEXT_PUBLIC_GAME_API_URL: process.env.NEXT_PUBLIC_GAME_API_URL,
  },
}

module.exports = nextConfig
