import {NextResponse} from "next/server"
import type {NextRequest} from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET(req: NextRequest, {params}:{params: any}){
    try{
        const {id} = await params
        const data = await prisma.overtime_Request.findMany({
            where: {
                userId: parseInt(id)
            }
        })
        return NextResponse.json({data: data, message: "Success", status: 200})
    } catch (e) {
        console.log(e)
        return NextResponse.json({error: e, status: 500})
    }
}

export async function POST(req: NextRequest, {params}:{params:any}){
    try{
        const {id} = await params
        const {date, startTime, endTime, purpose} = await req.json()
        await prisma.overtime_Request.create({
            data: {
                userId: parseInt(id),
                date: date,
                startTime: startTime,
                endTime: endTime,
                purpose: purpose,
                status: "Pending"
            }
        })
        return NextResponse.json({message: "Success", status: 200})
    } catch (e) {
        console.log(e)
        return NextResponse.json({error: e, status: 500})
    }
}