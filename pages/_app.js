import '@/styles/globals.css'
import Head from 'next/head'
import { SessionProvider } from "next-auth/react"
import { Toaster } from '@/components/ui/toaster'
import { activeTenant, apiPath } from '@/config/tenant'

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session} basePath={apiPath('/api/auth')}>
      <Head>
        <title>{activeTenant.pageTitle}</title>
      </Head>
      <Component {...pageProps} />
      <Toaster />
    </SessionProvider>
  )
}
