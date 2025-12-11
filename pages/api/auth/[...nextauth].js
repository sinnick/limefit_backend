import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import dbConnect from "@/utils/mongoose"
import Usuario from "@/models/Usuario"
import bcrypt from "bcryptjs"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Usuario o DNI", type: "text" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        try {
          await dbConnect()

          // Find user by username or DNI
          const user = await Usuario.findOne({
            $or: [
              { USUARIO: credentials.username },
              { DNI: parseInt(credentials.username) || 0 }
            ]
          })

          if (!user) {
            throw new Error("Usuario no encontrado")
          }

          if (!user.HABILITADO) {
            throw new Error("Usuario deshabilitado")
          }

          // Check password
          const isValid = await bcrypt.compare(credentials.password, user.PASSWORD)

          if (!isValid) {
            throw new Error("Contraseña incorrecta")
          }

          return {
            id: user._id.toString(),
            dni: user.DNI,
            username: user.USUARIO,
            name: `${user.NOMBRE} ${user.APELLIDO}`,
            email: user.EMAIL,
            admin: user.ADMIN,
            image: user.FOTO
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.dni = user.dni
        token.username = user.username
        token.admin = user.admin
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.dni = token.dni
        session.user.username = token.username
        session.user.admin = token.admin
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
