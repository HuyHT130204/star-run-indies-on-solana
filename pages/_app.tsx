import type { AppProps } from 'next/app'
import Head from 'next/head'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000011" />
        <meta name="description" content="Star Run - A Streamer-Friendly Interactive Runner Game on Solana" />
        <meta name="keywords" content="game, endless runner, space, solana, streamer, interactive" />
        <meta name="author" content="Star Run Team" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Star Run - Interactive Space Runner" />
        <meta property="og:description" content="A Streamer-Friendly Interactive Runner Game on Solana" />
        <meta property="og:image" content="/og-image.jpg" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Star Run - Interactive Space Runner" />
        <meta property="twitter:description" content="A Streamer-Friendly Interactive Runner Game on Solana" />
        <meta property="twitter:image" content="/og-image.jpg" />
        
      </Head>
      
      <Component {...pageProps} />
    </>
  )
}
