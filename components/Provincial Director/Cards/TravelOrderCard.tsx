// components/Provincial Director/Cards/TravelOrderCard.tsx
import Image from "next/image"

interface TravelOrderCardProps {
    info: {
        id?: string
        date: string
        day?: string
        startDate?: string
        endDate?: string
        purpose: string
        output: string
        expectedOutput?: string
        destination: string
        status: string
        userId?: string
        username?: string
        office?: string
        division?: string
    }
    onApprove?: () => void
    onDisapprove?: () => void
}

export default function TravelOrderCard({ info, onApprove, onDisapprove }: TravelOrderCardProps) {
    const isReadyForProvincial = info.status === 'Approved by Division Head' || info.status === 'Pending Provincial'
    const isApproved = info.status === 'Approved'
    const isDisapproved = info.status === 'Disapproved'
    const isPending = info.status === 'Pending'

    const formatDate = (dateString: string) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        })
    }

    const getDayOfWeek = (dateString: string) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { weekday: 'long' })
    }

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'Approved':
                return 'bg-green-100 text-green-700 border-2 border-green-600'
            case 'Pending':
                return 'bg-yellow-100 text-yellow-700 border-2 border-yellow-600'
            case 'Disapproved':
                return 'bg-red-100 text-red-700 border-2 border-red-600'
            default:
                return 'bg-gray-100 text-gray-700 border-2 border-gray-600'
        }
    }

    // Capitalize first letter of username
    const capitalizeFirstLetter = (name: string) => {
        if (!name) return ''
        return name.charAt(0).toUpperCase() + name.slice(1)
    }

    // Get the output value from either field
    const outputValue = info.expectedOutput || info.output || ''

    // Debug: Log what's in info
    console.log('📋 TravelOrderCard info:', info)

    return(
        <div className='flex flex-col border-[2px] border-gray-600 rounded-lg items-center mx-10 py-4 gap-3'>
            <div className='flex justify-between items-center w-full px-5 pb-4 border-b-[1px] border-gray-300'>
                <div className='flex items-center gap-6'>
                    {/* Column 1: Dates */}
                    <div className='flex flex-col'>
                        <p className='font-bold'>
                            {formatDate(info.startDate || info.date)} ({getDayOfWeek(info.startDate || info.date)})
                        </p>
                        {info.endDate && info.endDate !== info.startDate && info.endDate !== info.date && (
                            <p className='font-bold'>
                                {formatDate(info.endDate)} ({getDayOfWeek(info.endDate)})
                            </p>
                        )}
                    </div>
                    {/* Column 2: Username and Office/Division */}
                    <div className='flex flex-col border-l-[2px] border-gray-300 pl-4'>
                        {info.username && (
                            <p className='font-bold text-gray-600'>
                                {capitalizeFirstLetter(info.username)}
                            </p>
                        )}
                        {(info.office || info.division) && (
                            <p className='font-bold text-gray-600'>
                                {info.office || info.division}
                            </p>
                        )}
                    </div>
                </div>
                <div className='flex items-center gap-3'>
                    {/* Show Approve/Disapprove buttons only for pending/ready statuses */}
                    {(isReadyForProvincial || isPending) && !isApproved && !isDisapproved && (
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
                    {/* Show status badge for Approved */}
                    {isApproved && (
                        <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getStatusColor(info.status)}`}>
                            Approved
                        </span>
                    )}
                    {/* Show status badge for Disapproved */}
                    {isDisapproved && (
                        <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getStatusColor(info.status)}`}>
                            Disapproved
                        </span>
                    )}
                    {/* Show status badge if pending (no buttons) */}
                    {isPending && !isReadyForProvincial && (
                        <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getStatusColor(info.status)}`}>
                            Pending
                        </span>
                    )}
                    <button className='flex text-white rounded-lg px-4 py-2 gap-2 cursor-pointer font-semibold bg-linear-to-r from-[rgba(0,20,121,1)] to-[rgba(3,7,61,1)]'>
                        <Image src='/print.svg' width={16} height={16} alt='print'/>
                        <p>Print</p>
                    </button>
                </div>
            </div>
            <div className='flex flex-col w-full px-5'>
                <p className='font-bold text-sm'>Purpose</p>
                <p className='text-gray-600 text-sm'>{info.purpose}</p>
            </div>
            {outputValue && (
                <div className='flex flex-col w-full px-5'>
                    <p className='font-bold text-sm'>Expected Output</p>
                    <p className='text-gray-600 text-sm'>{outputValue}</p>
                </div>
            )}
            <div className='flex flex-col w-full px-5'>
                <p className='font-bold text-sm'>Destination</p>
                <p className='text-gray-600 text-sm'>{info.destination}</p>
            </div>
        </div>
    )
}