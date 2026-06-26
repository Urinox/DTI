import {NextResponse} from "next/server"
import type {NextRequest} from "next/server"
import {prisma} from "@/lib/prisma"

export async function GET(req: NextRequest, {params}:{params: any}){
    try{
        const {id} = await params
        const data = await prisma.travel_Order.findMany({
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
        const {startDate, endDate, purpose, expectedOutput, destination} = await req.json()
        await prisma.travel_Order.create({
            data: {
                userId: parseInt(id),
                startDate: startDate,
                endDate: endDate,
                purpose: purpose,
                expectedOutput: expectedOutput,
                destination: destination,
                status: 'Pending'
            }
        })
        return NextResponse.json({message: "Success", status: 200})
    } catch (e) {
        console.log(e)
        return NextResponse.json({error: e, status: 500})
    }
}