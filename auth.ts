// auth.ts
import NextAuth from "next-auth"
import Credentials from "@auth/core/providers/credentials"
import axios from "axios"

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    providers: [
        Credentials({
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
// auth.ts - authorize function
authorize: async (credentials) => {
    const username = credentials?.username as string
    const password = credentials?.password as string
    
    if (!username || !password) {
        throw new Error("Username and password required")
    }
    
    try {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
        const response = await axios.post(`${baseUrl}/api/user`, { 
            username, 
            password 
        })
        
        // Check response status
        if (response.data.status !== 200) {
            throw new Error(response.data.message || "Invalid Credentials")
        }
        
        const user = response.data.data
        
        if (!user) {
            throw new Error("Invalid Credentials")
        }
        
        // Get role type from the role table
        const roleType = user.role?.type || 
                        (user.roleId === 1 ? "admin" : 
                         user.roleId === 2 ? "cos-jo" : 
                         user.roleId === 3 ? "provincial-director" : 
                         user.roleId === 4 ? "division-head" : "user")
        
        return {
            id: user.id.toString(),
            username: user.username,
            role: roleType,
            name: user.profile?.name || user.username,
            email: user.profile?.email || ""
        }
    } catch (error) {
        console.error("Authorization error:", error)
        throw new Error("Invalid Credentials")
    }
}
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.username = user.username
                token.role = user.role
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.username = token.username as string
                session.user.role = token.role as string
            }
            return session
        }
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
    },
    pages: {
        signIn: "/",
    },
    secret: process.env.NEXTAUTH_SECRET,
})