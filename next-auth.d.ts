// next-auth.d.ts
import "next-auth"

declare module "next-auth" {
    interface User {
        id: string
        username: string
        role: string
        profile?: {
            name: string
            division: string
            designation: string
            office: string
        }
    }
    
    interface Session {
        user: User & {
            id: string
            username: string
            role: string
            profile?: {
                name: string
                division: string
                designation: string
                office: string
            }
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        username: string
        role: string
        profile?: {
            name: string
            division: string
            designation: string
            office: string
        }
    }
}