import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/router"
import { Loader2, Dumbbell } from "lucide-react"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/login")
    } else if (session.user.admin) {
      router.push("/admin")
    } else {
      // Regular users can go to a user dashboard (to be implemented)
      router.push("/login")
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Dumbbell className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          <span className="text-primary">LIME</span>FIT
        </h1>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p>Redirigiendo...</p>
        </div>
      </div>
    </div>
  )
}
