import '@/styles/globals.css'
import { SessionProvider } from "next-auth/react"
import { Toaster } from '@/components/ui/toaster'

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
      <Toaster />
    </SessionProvider>
  )
}
