// components/Provincial Director/Cards/PassSlipCard.tsx
import Image from "next/image"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import jsPDF from 'jspdf'
import axios from 'axios'

interface PassSlipCardProps {
    info: {
        id?: string
        date: string
        startDate?: string
        endDate?: string
        startTime?: string
        endTime?: string
        purpose: string
        destination: string
        status: string
        userId?: string
        name?: string           // ✅ COS-JO user's name
        username?: string       // ✅ COS-JO user's username
        employeeId?: string     // ✅ COS-JO user's employee ID
        office?: string         // ✅ COS-JO user's office
        division?: string       // ✅ COS-JO user's division
        type?: string
        reviewedBy?: string
        reviewedByName?: string
        reviewedByDesignation?: string
    }
    onApprove?: () => void
    onDisapprove?: () => void
}

export default function PassSlipCard({ info, onApprove, onDisapprove }: PassSlipCardProps) {
    const { data: session } = useSession()
    const [startDate, setStartDate] = useState('')
    const [startDay, setStartDay] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')

    function formatStartDate() {
        const date = new Date(info.startDate || info.date)
        setStartDate(date.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}))
        setStartDay(date.toLocaleDateString('en-US', {weekday: 'long'}))
        setStartTime(date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}))
    }

    function formatEndDate() {
        const date = new Date(info.endDate || info.startDate || info.date)
        setEndTime(date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'}))
    }

    useEffect(() => {
        formatStartDate()
        formatEndDate()
    }, []);

    const isPendingProvincial = info.status === 'Pending Provincial'
    const isApproved = info.status === 'Approved'
    const isDisapproved = info.status === 'Disapproved'
    
    const displayStatus = info.status

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Approved':
                return 'bg-green-100 text-green-700 border-2 border-green-600'
            case 'Pending Provincial':
                return 'bg-yellow-100 text-yellow-700 border-2 border-yellow-600'
            case 'Disapproved':
                return 'bg-red-100 text-red-700 border-2 border-red-600'
            default:
                return 'bg-gray-100 text-gray-700 border-2 border-gray-600'
        }
    }

    const capitalizeFirstLetter = (name: string) => {
        if (!name) return ''
        return name.charAt(0).toUpperCase() + name.slice(1)
    }

    // ✅ Format date for PDF
    const formatDateForPDF = (dateStr: string) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })
    }

    // ✅ Format time for PDF
    const formatTimeForPDF = (dateStr: string) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        })
    }

    // ✅ Fetch user data from API - using /api/users/me endpoint
    const fetchUserData = async () => {
        try {
            const response = await axios.get('/api/users/me')
            const userData = response.data.data
            console.log('📋 Fetched user data:', userData)
            return userData
        } catch (error) {
            console.error('Error fetching user data:', error)
            return {
                id: session?.user?.id,
                employeeId: (session?.user as any)?.employeeId || '',
                profile: session?.user?.profile || {},
                username: session?.user?.username || '',
                email: session?.user?.email || '',
                role: session?.user?.role || ''
            }
        }
    }

    // ✅ Generate Pass Slip PDF
const generatePSPDF = async () => {
    try {
        // Load logo
        let logoBase64 = null
        try {
            const response = await fetch('/upper-logo.png')
            if (response.ok) {
                const blob = await response.blob()
                logoBase64 = await new Promise((resolve) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result)
                    reader.readAsDataURL(blob)
                })
            }
        } catch (error) {
            console.error('Error loading logo:', error)
        }

        // ✅ Get COS-JO user data from the pass slip info (the person who submitted the request)
        const employeeName = info.name || info.username || 'N/A'
        const employeeId = info.employeeId || info.userId || (session?.user as any)?.employeeId || session?.user?.id?.slice(0, 8) || 'N/A'
        const division = info.office || info.division || 'N/A'

        const reviewedByName = info.reviewedByName || 'Provincial Director'
        const reviewedByDesignation = info.reviewedByDesignation || 'Provincial Trade and Industry Officer'

        console.log('📋 Employee Name (COS-JO):', employeeName)
        console.log('📋 Employee ID (COS-JO):', employeeId)

        const doc = new jsPDF('l', 'mm', 'a4')
        const pageWidth = 297
        const pageHeight = 210
        const margin = 20
        let yPos = 8
            // Header with Logo
            if (logoBase64) {
                try {
                    const imgWidth = 70
                    const imgHeight = 40
                    const imgX = (pageWidth - imgWidth) / 2
                    const imgY = yPos - 5
                    doc.addImage(logoBase64 as string, 'PNG', imgX, imgY, imgWidth, imgHeight)
                    yPos += imgHeight + 5
                } catch (error) {
                    console.error('Error adding logo to PDF:', error)
                    doc.setFontSize(11)
                    doc.setFont('helvetica', 'normal')
                    doc.text('Republic of the Philippines', pageWidth / 2, yPos, { align: 'center' })
                    yPos += 5
                    doc.text('Department of Trade and Industry', pageWidth / 2, yPos, { align: 'center' })
                    yPos += 9
                }
            } else {
                doc.setFontSize(11)
                doc.setFont('helvetica', 'normal')
                doc.text('Republic of the Philippines', pageWidth / 2, yPos, { align: 'center' })
                yPos += 5
                doc.text('Department of Trade and Industry', pageWidth / 2, yPos, { align: 'center' })
                yPos += 9
            }

            // Title
            doc.setFontSize(30)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(0, 0, 0)
            doc.text('PASS SLIP', pageWidth / 2, yPos, { align: 'center' })
            yPos += 8

            // Disapproved status
            if (displayStatus === 'Disapproved') {
                doc.setTextColor(200, 0, 0)
                doc.setFontSize(16)
                doc.setFont('helvetica', 'bold')
                doc.text('DISAPPROVED', pageWidth / 2, yPos, { align: 'center' })
                yPos += 12
                doc.setTextColor(0, 0, 0)
            }

            // Form fields
            doc.setFontSize(11)
            doc.setFont('helvetica', 'normal')

            const dateValue = formatDateForPDF(info.startDate || info.date || new Date().toISOString())
            doc.setFont('helvetica', 'bold')
            doc.text('Date:', margin, yPos)
            doc.setFont('helvetica', 'normal')
            doc.text(dateValue, margin + 45, yPos)
            yPos += 8

            doc.setFont('helvetica', 'bold')
            doc.text('Employee No.:', margin, yPos)
            doc.setFont('helvetica', 'normal')
            doc.text(employeeId, margin + 45, yPos)
            yPos += 8

            doc.setFont('helvetica', 'bold')
            doc.text('Name of Employee:', margin, yPos)
            doc.setFont('helvetica', 'normal')
            doc.text(employeeName, margin + 45, yPos)
            yPos += 8

            doc.setFont('helvetica', 'bold')
            doc.text('Division/Section:', margin, yPos)
            doc.setFont('helvetica', 'normal')
            doc.text(division, margin + 45, yPos)
            yPos += 8

            doc.setFont('helvetica', 'bold')
            doc.text('Destination:', margin, yPos)
            doc.setFont('helvetica', 'normal')
            doc.text(info.destination || 'N/A', margin + 45, yPos)
            yPos += 8

            const departureTime = formatTimeForPDF(info.startDate || info.date || '')
            doc.setFont('helvetica', 'bold')
            doc.text('Departure Time:', margin, yPos)
            doc.setFont('helvetica', 'normal')
            doc.text(departureTime || 'N/A', margin + 45, yPos)
            yPos += 8

            doc.setFont('helvetica', 'bold')
            doc.text('Purpose:', margin, yPos)
            doc.setFont('helvetica', 'normal')
            doc.text(info.purpose || 'N/A', margin + 45, yPos)
            yPos += 12

            doc.setFont('helvetica', 'normal')
            doc.text('Permission is granted to leave office during office hours:', margin, yPos)
            yPos += 10

            // Checkboxes
            const passSlipType = info.type || 'Official'
            const checkboxStartX = margin + 5
            const checkboxSpacing = 55

            const drawCheckedBox = (x: number, y: number) => {
                doc.setFillColor(0, 0, 0)
                doc.rect(x, y - 4, 5, 5, 'F')
                doc.setFillColor(255, 255, 255)
            }

            if (passSlipType === 'Official') {
                drawCheckedBox(checkboxStartX, yPos)
            } else {
                doc.rect(checkboxStartX, yPos - 4, 5, 5)
            }
            doc.setFont('helvetica', 'normal')
            doc.text('Official', checkboxStartX + 10, yPos)

            const personalX = checkboxStartX + checkboxSpacing
            if (passSlipType === 'Personal') {
                drawCheckedBox(personalX, yPos)
            } else {
                doc.rect(personalX, yPos - 4, 5, 5)
            }
            doc.text('Personal', personalX + 10, yPos)

            const emergencyX = personalX + checkboxSpacing
            if (passSlipType === 'Emergency') {
                drawCheckedBox(emergencyX, yPos)
            } else {
                doc.rect(emergencyX, yPos - 4, 5, 5)
            }
            doc.text('Emergency', emergencyX + 10, yPos)

            yPos += 13

            // ✅ Reviewed by
            if (displayStatus === 'Disapproved') {
                doc.setTextColor(200, 0, 0)
                doc.setFont('helvetica', 'bold')
                doc.text('Disapproved by:', margin, yPos)
                yPos += 12
                
                doc.setFont('helvetica', 'bold')
                doc.setFontSize(11)
                doc.text(reviewedByName, margin + 10, yPos)
                doc.setFontSize(11)
                doc.setFont('helvetica', 'normal')
                doc.text(reviewedByDesignation, margin + 10, yPos + 7)
                
                const nameWidth = doc.getTextWidth(reviewedByName)
                doc.line(margin + 10, yPos + 1, margin + 10 + nameWidth, yPos + 1)
                doc.setTextColor(0, 0, 0)
                yPos += 24
            } else {
                doc.setFont('helvetica', 'bold')
                doc.text('Reviewed by:', margin, yPos)
                yPos += 12

                doc.setFont('helvetica', 'bold')
                doc.setFontSize(11)
                doc.text(reviewedByName, margin + 10, yPos)
                doc.setFontSize(11)
                doc.setFont('helvetica', 'normal')
                doc.text(reviewedByDesignation, margin + 10, yPos + 7)
                
                const nameWidth = doc.getTextWidth(reviewedByName)
                doc.line(margin + 10, yPos + 1, margin + 10 + nameWidth, yPos + 1)
                yPos += 16
            }

            const arrivalTime = formatTimeForPDF(info.endDate || info.date || '')
            doc.setFont('helvetica', 'bold')
            doc.text('Arrival Time:', margin, yPos)
            doc.setFont('helvetica', 'normal')
            doc.text(arrivalTime || 'N/A', margin + 45, yPos)
            yPos += 8

            doc.setFont('helvetica', 'bold')
            doc.text('Guard on Duty:', margin, yPos)
            doc.setFont('helvetica', 'normal')
            doc.text('_________________________________', margin + 45, yPos)
            
            const now = new Date()
            const printedDate = now.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })
            const printedTime = now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            })

            const statusSuffix = displayStatus === 'Disapproved' ? '_DISAPPROVED' : ''
            const fileName = `PassSlip${statusSuffix}_${employeeName.replace(/\s/g, '_')}_${dateValue.replace(/\s/g, '_')}.pdf`
            doc.save(fileName)
            
        } catch (error) {
            console.error('Error generating Pass Slip PDF:', error)
            alert('Error generating Pass Slip PDF. Please try again.')
        }
    }

    return(
        <div className='flex flex-col border-[2px] border-gray-600 rounded-lg items-center mx-10 py-4 gap-3'>
            <div className='flex justify-between items-center w-full px-5 pb-4 border-b-[1px] border-gray-300'>
                <div className='flex items-center gap-6'>
                    <div className='flex flex-col'>
                        <p className='font-bold'>{startDate} ({startDay})</p>
                        <p className='text-sm text-gray-600'>
                            {startTime} - {endTime}
                        </p>
                        {info.type && (
                            <p className='text-sm text-gray-600'>Type: {info.type}</p>
                        )}
                    </div>
                    <div className='flex flex-col border-l-[2px] border-gray-300 pl-4'>
                        {info.username && (
                            <p className='font-bold text-gray-600'>
                                {capitalizeFirstLetter(info.username)}
                            </p>
                        )}
                        {info.office && (
                            <p className='font-bold text-gray-600'>
                                {info.office}
                            </p>
                        )}
                    </div>
                </div>
                <div className='flex items-center gap-3'>
                    {isPendingProvincial && (
                        <>
                            <input 
                                className='border-[1px] rounded-lg px-3 py-1 cursor-pointer border-green-800 text-green-800 bg-[#EBFFD1] hover:bg-[#d4f5b0] transition-colors font-bold text-sm' 
                                type='button' 
                                value='Approve'
                                onClick={onApprove}
                            />
                            <input 
                                className='border-[1px] rounded-lg px-3 py-1 cursor-pointer border-[#990202] text-[#990202] bg-[#FFD6D6] hover:bg-[#ffb8b8] transition-colors font-bold text-sm' 
                                type='button' 
                                value='Disapprove'
                                onClick={onDisapprove}
                            />
                        </>
                    )}
                    {(isApproved || isDisapproved) && (
                        <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getStatusColor(info.status)}`}>
                            {info.status}
                        </span>
                    )}
                    <button 
                        onClick={generatePSPDF}
                        className='flex text-white rounded-lg px-4 py-2 gap-2 cursor-pointer font-semibold bg-linear-to-r from-[rgba(0,20,121,1)] to-[rgba(3,7,61,1)]'
                    >
                        <Image src='/print.svg' width={16} height={16} alt='print'/>
                        <p>Print</p>
                    </button>
                </div>
            </div>
            <div className='flex flex-col w-full px-5'>
                <p className='font-bold text-sm'>Purpose</p>
                <p className='text-gray-600 text-sm'>{info.purpose}</p>
            </div>
            <div className='flex flex-col w-full px-5'>
                <p className='font-bold text-sm'>Destination</p>
                <p className='text-gray-600 text-sm'>{info.destination}</p>
            </div>
        </div>
    )
}