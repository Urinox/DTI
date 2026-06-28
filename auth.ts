// auth.ts
import NextAuth from "next-auth"
import Credentials from "@auth/core/providers/credentials"
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth as firebaseAuth, database, ref, get, set } from '@/lib/firebase'

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    providers: [
        Credentials({
            credentials: {
                username: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            authorize: async (credentials) => {
                const email = credentials?.username as string
                const password = credentials?.password as string
                
                if (!email || !password) {
                    throw new Error("Email and password required")
                }
                
                try {
                    console.log(`Attempting login for: ${email}`)
                    
                    // Authenticate with Firebase using email directly
                    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password)
                    const firebaseUser = userCredential.user
                    
                    console.log(`Firebase user authenticated: ${firebaseUser.uid}`)
                    
                    // Check if user exists in Realtime Database
                    const userRef = ref(database, `users/${firebaseUser.uid}`)
                    const userSnapshot = await get(userRef)
                    
                    let userData: any = {}
                    const usernameFromEmail = email.split('@')[0]
                    
                    if (!userSnapshot.exists()) {
                        // User exists in Firebase Auth but not in database
                        console.log(`🆕 First login for ${email}, creating user in database...`)
                        
                        userData = {
                            username: usernameFromEmail,
                            email: email,
                            role: 'cos', // Default role: COS-JO
                            profile: {
                                name: '',
                                email: email,
                                division: '',
                                designation: '',
                                office: ''
                            },
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        }
                        
                        await set(userRef, userData)
                        console.log(`✅ Created user in database with role: cos`)
                    } else {
                        userData = userSnapshot.val()
                        console.log(`📋 Found existing user: ${userData.username}`)
                        console.log(`   Role: ${userData.role || 'cos'}`)
                    }
                    
                    // ✅ Fixed: Single return statement with proper role mapping
                    return {
                        id: firebaseUser.uid,
                        username: userData.username || usernameFromEmail,
                        // Map database roles to frontend roles
                        role: userData.role === 'cos' ? 'cos-jo' : 
                              userData.role === 'division' ? 'division-head' : 
                              userData.role === 'sub' ? 'provincial-director' :
                              userData.role || 'cos-jo',
                        name: userData.profile?.name || usernameFromEmail,
                        email: userData.email || email,
                        profile: userData.profile || {}
                    }
                } catch (error: any) {
                    console.error("Authorization error:", error.code, error.message)
                    throw new Error(error.message || "Invalid credentials")
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
                token.profile = user.profile
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.username = token.username as string
                session.user.role = token.role as string
                session.user.profile = token.profile as any
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
    secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-this",
})