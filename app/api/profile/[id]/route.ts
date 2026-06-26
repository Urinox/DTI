import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    console.log("Received data:", body) // Debug log
    
    const { name, email, division, office, designation } = body
    
    // Use upsert to either update or create
    const profile = await prisma.profile.upsert({
      where: {
        userId: parseInt(params.id)
      },
      update: {
        name,
        email,
        division,
        designation,
        office
      },
      create: {
        userId: parseInt(params.id),
        name,
        email,
        division,
        designation,
        office
      }
    })
    
    return NextResponse.json({ 
      data: profile, 
      message: "Success", 
      status: 200 
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ 
      error: error, 
      message: "Server error",
      status: 500 
    }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { name, email, division, office, designation } = body
    
    const profile = await prisma.profile.upsert({
      where: {
        userId: parseInt(params.id)
      },
      update: {
        name,
        email,
        division,
        designation,
        office
      },
      create: {
        userId: parseInt(params.id),
        name,
        email,
        division,
        designation,
        office
      }
    })
    
    return NextResponse.json({ 
      data: profile, 
      message: "Success", 
      status: 200 
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ 
      error: error, 
      message: "Server error",
      status: 500 
    }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await prisma.profile.findUnique({
      where: {
        userId: parseInt(params.id)
      }
    })
    
    return NextResponse.json({ 
      data: profile, 
      message: "Success", 
      status: 200 
    })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ 
      error: error, 
      message: "Server error",
      status: 500 
    }, { status: 500 })
  }
}