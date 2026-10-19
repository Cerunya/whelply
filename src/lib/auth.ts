import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { CredentialsSignin } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// Wird geworfen, wenn die E-Mail noch nicht bestätigt ist —
// der Code landet als error-Parameter beim Client (Login-Seite zeigt passenden Hinweis)
class EmailNotVerifiedError extends CredentialsSignin {
  code = 'email_not_verified'
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = z.object({
          email: z.string().email(),
          password: z.string().min(8),
        }).safeParse(credentials)

        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          // Groß-/Kleinschreibung der E-Mail soll beim Login egal sein
          where: { email: parsed.data.email.toLowerCase().trim() },
          include: { breederProfile: true },
        })

        if (!user || !user.passwordHash) return null

        const passwordMatch = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        )

        if (!passwordMatch) return null

        // E-Mail muss bestätigt sein (Bestandsaccounts wurden per SQL nachgezogen)
        if (!user.emailVerifiedAt) {
          throw new EmailNotVerifiedError()
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          kennelName: user.breederProfile?.kennelName ?? null,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.kennelName = (user as any).kennelName
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.kennelName = token.kennelName as string | null
      }
      return session
    },
  },
})
