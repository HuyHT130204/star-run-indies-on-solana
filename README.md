# Star Run: A Streamer-Friendly Interactive Runner Game

A fast-paced endless-runner game set in space, designed specifically for streamers and their audiences. Players pilot a spaceship through an ever-changing galactic course while viewers can actively influence the game in real-time by spending tokens to drop power-ups or spawn hazards.

## Features

### 🚀 Core Gameplay
- **Endless Runner**: Infinite journey with increasing difficulty
- **Spaceship Controls**: WASD or Arrow keys for movement, Space for boost
- **Dynamic Obstacles**: Procedurally generated asteroids, debris, and enemies
- **Power-ups**: Shield, boost, and bonus items to collect
- **Progressive Difficulty**: Speed increases over time

### 👥 Viewer Interaction
- **Real-time WebSocket Integration**: Viewers can drop items instantly
- **Power-up Drops**: Viewers can spawn shields, boosts, and bonus items
- **Obstacle Spawning**: Viewers can create challenges for the player
- **Live Action Feed**: Real-time display of viewer interactions

### 🏆 Scoring & Rewards
- **Distance-based Scoring**: Points for distance traveled and items collected
- **High Score Tracking**: Persistent leaderboard with local storage
- **Bonk Token Rewards**: Automatic token distribution based on performance
- **API Integration**: Score submission to game API

### 🎨 Visual Design
- **Space Theme**: Animated starfield background with parallax effects
- **Responsive UI**: Works on desktop and mobile devices
- **Visual Effects**: Boost trails, shield effects, and explosion animations
- **Modern Design**: Glassmorphism UI with neon accents

## Technical Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: SCSS with CSS Modules
- **Authentication**: TheVorld Auth Service
- **Real-time**: Socket.IO WebSocket integration
- **APIs**: Airdrop Arcade integration for rewards
- **Performance**: Optimized game loop with frame rate limiting

## Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_VORLD_APP_ID=your_vorld_app_id
NEXT_PUBLIC_AUTH_SERVER_URL=https://vorld-auth.onrender.com/api
NEXT_PUBLIC_ARENA_SERVER_URL=wss://airdrop-arcade.onrender.com
NEXT_PUBLIC_GAME_API_URL=https://airdrop-arcade.onrender.com/api
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Game Controls

- **Movement**: WASD or Arrow Keys
- **Boost**: Spacebar (when available)
- **Restart**: Spacebar (on game over)

## Viewer Interaction

Viewers can interact with the game through the Airdrop Arcade platform:

- **Drop Power-ups**: Spawn shields, boosts, or bonus items
- **Spawn Obstacles**: Create asteroids or debris for added challenge
- **Activate Effects**: Trigger special game effects

## Performance Optimizations

- **Frame Rate Limiting**: Prevents excessive re-renders
- **Object Pooling**: Efficient memory management for game objects
- **Canvas Optimization**: Hardware-accelerated rendering
- **WebSocket Throttling**: Prevents connection overload

## Architecture

### Components
- `StarRunGame`: Main game component with canvas rendering
- `EmailLogin`: Authentication interface
- `WebSocketHandler`: Real-time communication management
- `ViewerActions`: Live viewer interaction display
- `GameOver`: End game screen with statistics

### Services
- `VorldAuthService`: Authentication and user management
- WebSocket integration for real-time features
- API integration for scoring and rewards

### Styling
- SCSS modules for component-specific styles
- Responsive design with mobile-first approach
- CSS animations and transitions
- Dark theme with space aesthetics

## Development

### Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

### Code Structure
```
├── components/          # React components
├── lib/                # Utility services
├── pages/              # Next.js pages
├── styles/             # SCSS stylesheets
├── types/              # TypeScript type definitions
└── public/             # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built for the Solana hackathon
- Integrates with TheVorld authentication system
- Uses Airdrop Arcade for viewer interactions
- Inspired by classic endless runner games

---

**Star Run** - Where space meets streaming! 🚀✨