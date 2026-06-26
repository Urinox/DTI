import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json()
        
        // Find user by username
        const user = await prisma.user.findFirst({
            where: {
                username: username
            },
            include: {
                role: true,
                profile: true
            }
        })
        
        // Check if user exists
        if (!user) {
            return NextResponse.json({ 
                message: "Invalid Username or Password", 
                data: null,
                status: 400 
            }, { status: 400 })
        }
        
        // Compare password (supports both plain text and hashed)
        let isValid = false
        
        // Check if password is hashed (bcrypt hash starts with $2)
        if (user.password.startsWith('$2')) {
            isValid = await bcrypt.compare(password, user.password)
        } else {
            // Plain text comparison (for existing data)
            isValid = user.password === password
        }
        
        if (!isValid) {
            return NextResponse.json({ 
                message: "Invalid Username or Password", 
                data: null,
                status: 400 
            }, { status: 400 })
        }
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user
        
        return NextResponse.json({ 
            data: userWithoutPassword, 
            message: "Success", 
            status: 200 
        })
        
    } catch (error) {
        console.error("Login error:", error)
        return NextResponse.json({ 
            error: error, 
            message: "Server error",
            status: 500 
        }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { id, password } = await req.json()
        
        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(password, 10)
        
        await prisma.user.update({
            where: {
                id: parseInt(id)
            },
            data: {
                password: hashedPassword
            }
        })
        
        return NextResponse.json({ 
            message: "Success", 
            status: 200 
        })
        
    } catch (error) {
        console.error("Update password error:", error)
        return NextResponse.json({ 
            error: error, 
            message: "Server error",
            status: 500 
        }, { status: 500 })
    }
}