import {NextResponse} from "next/server"
import type {NextRequest} from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET(req: NextRequest, {params}:{params: any}){
    try{
        const {id} = await params
        const data = await prisma.pass_Slip.findMany({
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
        const {date, purpose, destination, type} = await req.json()
        await prisma.pass_Slip.create({
            data: {
                userId: parseInt(id),
                date: date,
                purpose: purpose,
                destination: destination,
                status: 'Pending',
                type: type
            }
        })
        return NextResponse.json({message: "Success", status: 200})
    } catch (e) {
        console.log(e)
        return NextResponse.json({error: e, status: 500})
    }
}