import { getServerSession } from "next-auth"
import { authOptions } from "./api/auth/[...nextauth]"

export default function Home() {
  return null
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    }
  }

  if (session.user?.admin) {
    return {
      redirect: {
        destination: "/admin",
        permanent: false,
      },
    }
  }

  return {
    redirect: {
      destination: "/login",
      permanent: false,
    },
  }
}
