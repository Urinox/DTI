// components/COS-JOS/Cards/PassSlipCard.tsx
import Image from "next/image"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import jsPDF from 'jspdf'
import axios from 'axios'

interface PassSlipInfo {
    id?: string
    startDate?: string,
    endDate?: string,
    date?: string,
    purpose: string,
    destination: string,
    status: string,
    type?: string,
    username?: string,
    approvedBy?: string      // ✅ Division Head who approved
    approvedByName?: string  // ✅ Division Head name
    approvedByDesignation?: string // ✅ Division Head designation
    reviewedBy?: string      // ✅ Provincial Director who reviewed
    reviewedByName?: string  // ✅ Provincial Director name
    reviewedByDesignation?: string // ✅ Provincial Director designation
}

export default function PassSlipCard({info} : {info: PassSlipInfo}) {
    const { data: session } = useSession()
    const [startDate, setStartDate] = useState('')
    const [startDay, setStartDay] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')

    function formatStartDate() {
        const dateString = info.startDate || info.date
        if (!dateString) {
            console.warn('No date found for pass slip:', info)
            return
        }
        
        try {
            const date = new Date(dateString)
            if (isNaN(date.getTime())) {
                console.warn('Invalid date:', dateString)
                return
            }
            setStartDate(date.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}))
            setStartDay(date.toLocaleDateString('en-US', {weekday: 'long'}))
            setStartTime(date.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: true}))
        } catch (error) {
            console.error('Error formatting start date:', error)
        }
    }

    function formatEndDate() {
        const dateString = info.endDate || info.date
        if (!dateString) {
            console.warn('No end date found for pass slip:', info)
            return
        }
        
        try {
            const date = new Date(dateString)
            if (isNaN(date.getTime())) {
                console.warn('Invalid end date:', dateString)
                return
            }
            setEndTime(date.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: true}))
        } catch (error) {
            console.error('Error formatting end date:', error)
        }
    }

    useEffect(() => {
        console.log('📋 PassSlipCard received info:', info)
        formatStartDate()
        formatEndDate()
    }, []);

    const getDisplayStatus = (status: string) => {
        if (!status) return 'Pending'
        if (status === 'Approved by Division Head') {
            return 'Pending'
        }
        if (status === 'Pending Provincial') {
            return 'Pending'
        }
        return status
    }

    const displayStatus = getDisplayStatus(info.status)

    const getStatusColor = (status: string) => {
        if (displayStatus === 'Approved') {
            return 'border-green-800 text-green-800 bg-[#EBFFD1]'
        }
        if (displayStatus === 'Pending') {
            return 'border-orange-700 text-orange-700 bg-[#FFDECA]'
        }
        if (displayStatus === 'Disapproved') {
            return 'border-[#990202] text-[#990202] bg-[#FFD6D6]'
        }
        return 'border-gray-800 text-gray-800 bg-gray-100'
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

    // ✅ Fetch division users (for Approver)
    const fetchDivisionUsers = async () => {
        try {
            const response = await axios.get('/api/users')
            const users = response.data.data || []
            const divisionUsers = users.filter((user: any) => 
                user.role === 'division' || 
                user.role === 'Division' || 
                user.role === 'division-head' ||
                user.role === 'Division Head'
            )
            console.log('📋 Division users found:', divisionUsers.length)
            return divisionUsers
        } catch (error) {
            console.error('Error fetching division users:', error)
            return []
        }
    }

const generatePSPDF = async () => {
    try {
        // ✅ Load logo image from public folder using a different approach
        let logoBase64 = null
        try {
            // Try multiple ways to load the image
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

        const userData = await fetchUserData()
        const divisionUsers = await fetchDivisionUsers()
        const divisionUser = divisionUsers.length > 0 ? divisionUsers[0] : null
        
        const employeeName = session?.user?.profile?.name || session?.user?.name || 'N/A'
        const employeeId = userData?.employeeId || (session?.user as any)?.employeeId || session?.user?.id?.slice(0, 8) || 'N/A'
        const division = userData?.profile?.division || session?.user?.profile?.division || 'N/A'

        // ✅ Division Head who approved
        const divisionName = info.approvedByName || divisionUser?.profile?.name || divisionUser?.name || 'Division Head'
        const divisionDesignation = info.approvedByDesignation || divisionUser?.profile?.designation || divisionUser?.designation || 'Division Head'

        console.log('📋 Employee ID from database:', employeeId)
        console.log('📋 Approved by (Division Head):', divisionName, divisionDesignation)

        const doc = new jsPDF('l', 'mm', 'a4')
        const pageWidth = 297
        const pageHeight = 210
        const margin = 20
        let yPos = 8

        // ✅ Header with Logo - Same width as title
        if (logoBase64) {
            try {
                // Calculate width based on title width (PASS SLIP is about 80-100mm wide at 26pt)
                const imgWidth = 70 // Same width as the title
                const imgHeight = 40 // Adjust height to maintain aspect ratio
                const imgX = (pageWidth - imgWidth) / 2
                const imgY = yPos - 5 // Slightly above the title
                
                doc.addImage(logoBase64 as string, 'PNG', imgX, imgY, imgWidth, imgHeight)
                yPos += imgHeight + 5 // Add spacing after logo
            } catch (error) {
                console.error('Error adding logo to PDF:', error)
                // Fallback to text
                doc.setFontSize(11)
                doc.setFont('helvetica', 'normal')
                doc.text('Republic of the Philippines', pageWidth / 2, yPos, { align: 'center' })
                yPos += 5
                doc.text('Department of Trade and Industry', pageWidth / 2, yPos, { align: 'center' })
                yPos += 9
            }
        } else {
            // Fallback to text if logo not available
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

        // Date
        const dateValue = formatDateForPDF(info.startDate || info.date || new Date().toISOString())
        doc.setFont('helvetica', 'bold')
        doc.text('Date:', margin, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(dateValue, margin + 45, yPos)
        yPos += 8

        // Employee No.
        doc.setFont('helvetica', 'bold')
        doc.text('Employee No.:', margin, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(employeeId, margin + 45, yPos)
        yPos += 8

        // Name of Employee
        doc.setFont('helvetica', 'bold')
        doc.text('Name of Employee:', margin, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(employeeName, margin + 45, yPos)
        yPos += 8

        // Division/Section
        doc.setFont('helvetica', 'bold')
        doc.text('Division/Section:', margin, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(division, margin + 45, yPos)
        yPos +=8

        // Destination
        doc.setFont('helvetica', 'bold')
        doc.text('Destination:', margin, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(info.destination || 'N/A', margin + 45, yPos)
        yPos += 8

        // Departure Time
        const departureTime = formatTimeForPDF(info.startDate || info.date || '')
        doc.setFont('helvetica', 'bold')
        doc.text('Departure Time:', margin, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(departureTime || 'N/A', margin + 45, yPos)
        yPos += 8

        // Purpose
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

        // Official checkbox
        if (passSlipType === 'Official') {
            drawCheckedBox(checkboxStartX, yPos)
        } else {
            doc.rect(checkboxStartX, yPos - 4, 5, 5)
        }
        doc.setFont('helvetica', 'normal')
        doc.text('Official', checkboxStartX + 10, yPos)

        // Personal checkbox
        const personalX = checkboxStartX + checkboxSpacing
        if (passSlipType === 'Personal') {
            drawCheckedBox(personalX, yPos)
        } else {
            doc.rect(personalX, yPos - 4, 5, 5)
        }
        doc.text('Personal', personalX + 10, yPos)

        // Emergency checkbox
        const emergencyX = personalX + checkboxSpacing
        if (passSlipType === 'Emergency') {
            drawCheckedBox(emergencyX, yPos)
        } else {
            doc.rect(emergencyX, yPos - 4, 5, 5)
        }
        doc.text('Emergency', emergencyX + 10, yPos)

        yPos += 13

        // ✅ Approved by (Division Head)
        if (displayStatus === 'Disapproved') {
            doc.setTextColor(200, 0, 0)
            doc.setFont('helvetica', 'bold')
            doc.text('Disapproved by:', margin, yPos)
            yPos += 12
            
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(11)
            doc.text(divisionName, margin + 10, yPos)
            doc.setFontSize(11)
            doc.setFont('helvetica', 'normal')
            doc.text(divisionDesignation, margin + 10, yPos + 7)
            
            const nameWidth = doc.getTextWidth(divisionName)
            doc.line(margin + 10, yPos + 1, margin + 10 + nameWidth, yPos + 1)
            doc.setTextColor(0, 0, 0)
            yPos += 24
        } else {
            doc.setFont('helvetica', 'bold')
            doc.text('Approved by:', margin, yPos)
            yPos += 12

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(11)
            doc.text(divisionName, margin + 10, yPos)
            doc.setFontSize(11)
            doc.setFont('helvetica', 'normal')
            doc.text(divisionDesignation, margin + 10, yPos + 7)
            
            const nameWidth = doc.getTextWidth(divisionName)
            doc.line(margin + 10, yPos + 1, margin + 10 + nameWidth, yPos + 1)
            yPos += 16
        }

        // Arrival Time
        const arrivalTime = formatTimeForPDF(info.endDate || info.date || '')
        doc.setFont('helvetica', 'bold')
        doc.text('Arrival Time:', margin, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(arrivalTime || 'N/A', margin + 45, yPos)
        yPos += 8

        // Guard on Duty
        doc.setFont('helvetica', 'bold')
        doc.text('Guard on Duty:', margin, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text('_________________________________', margin + 45, yPos)
        
        // Footer
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

        // Save PDF
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
                <div className='flex flex-col'>
                    <p className='font-bold'>{startDate || 'No date'} ({startDay || 'No day'})</p>
                    <p className='text-sm text-gray-600'>
                        {startTime || 'No start time'} to {endTime || 'No end time'}
                    </p>
                    {info.username && (
                        <p className='text-xs text-purple-500 mt-1'>From: {capitalizeFirstLetter(info.username)}</p>
                    )}
                    {info.type && (
                        <p className='text-sm text-gray-600'>Type: {info.type}</p>
                    )}
                </div>
                <div className='flex items-center gap-3'>
                    <p className={`border-2 rounded-lg font-bold px-5 py-1 text-sm ${getStatusColor(info.status)}`}>
                        {displayStatus || 'Pending'}
                    </p>
                    <button 
                        onClick={generatePSPDF}
                        className='flex text-white rounded-lg px-5 py-1 gap-2 cursor-pointer font-semibold bg-linear-to-r from-[rgba(0,20,121,1)] to-[rgba(3,7,61,1)]'
                    >
                        <Image src='/print.svg' width={16} height={16} alt='print'/>
                        <p>Print</p>
                    </button>
                </div>
            </div>
            <div className='flex flex-col w-full px-5'>
                <p className='font-bold text-sm'>Purpose</p>
                <p className='text-gray-600 text-sm'>{info.purpose || 'No purpose'}</p>
            </div>
            <div className='flex flex-col w-full px-5'>
                <p className='font-bold text-sm'>Destination</p>
                <p className='text-gray-600 text-sm'>{info.destination || 'No destination'}</p>
            </div>
        </div>
    )
}