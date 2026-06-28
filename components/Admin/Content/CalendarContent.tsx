// components/Admin/Content/CalendarContent.tsx
import ContentHeader from "@/components/ContentHeader"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import axios from "axios"

interface CalendarEvent {
    date: string
    title: string
    description?: string
}

export default function CalendarContent() {
    const { data: session } = useSession()
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [isEditing, setIsEditing] = useState(false)
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [eventTitle, setEventTitle] = useState('')
    const [eventDescription, setEventDescription] = useState('')
    const [loading, setLoading] = useState(true)
    const [showEventModal, setShowEventModal] = useState(false)

    useEffect(() => {
        fetchEvents()
    }, [currentMonth])

    async function fetchEvents() {
        try {
            if (!session?.user?.id) return
            
            const year = currentMonth.getFullYear()
            const month = currentMonth.getMonth() + 1
            const response = await axios.get(`/api/calendar/${session.user.id}?year=${year}&month=${month}`)
            const data = response.data.data || []
            setEvents(data)
        } catch (error) {
            console.error('Error fetching events:', error)
            setEvents([])
        } finally {
            setLoading(false)
        }
    }

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDay = firstDay.getDay() // 0 = Sunday, 1 = Monday
        
        // Adjust to make Monday the first day
        const startOffset = startingDay === 0 ? 6 : startingDay - 1
        
        const days = []
        const prevMonthDays = new Date(year, month, 0).getDate()
        
        // Previous month days
        for (let i = startOffset - 1; i >= 0; i--) {
            const day = prevMonthDays - i
            const dateObj = new Date(year, month - 1, day)
            days.push({
                day: day,
                date: dateObj,
                isCurrentMonth: false,
                isToday: false
            })
        }
        
        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateObj = new Date(year, month, i)
            const today = new Date()
            const isToday = dateObj.toDateString() === today.toDateString()
            days.push({
                day: i,
                date: dateObj,
                isCurrentMonth: true,
                isToday: isToday
            })
        }
        
        // Next month days
        const totalDays = 42 // 6 rows
        const remainingDays = totalDays - days.length
        for (let i = 1; i <= remainingDays; i++) {
            const dateObj = new Date(year, month + 1, i)
            days.push({
                day: i,
                date: dateObj,
                isCurrentMonth: false,
                isToday: false
            })
        }
        
        return days
    }

    const monthDays = getDaysInMonth(currentMonth)

    const getEventForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0]
        return events.find(event => event.date === dateStr)
    }

    const handleDateClick = (date: Date) => {
        if (!isEditing) return
        
        const dateStr = date.toISOString().split('T')[0]
        const existingEvent = getEventForDate(date)
        
        setSelectedDate(dateStr)
        setEventTitle(existingEvent?.title || '')
        setEventDescription(existingEvent?.description || '')
        setShowEventModal(true)
    }

    const handleSaveEvent = async () => {
        if (!selectedDate || !eventTitle.trim()) {
            alert('Please enter an event title')
            return
        }

        try {
            const response = await axios.post(`/api/calendar/${session?.user?.id}`, {
                date: selectedDate,
                title: eventTitle.trim(),
                description: eventDescription.trim()
            })

            if (response.status === 200) {
                await fetchEvents()
                setShowEventModal(false)
                setEventTitle('')
                setEventDescription('')
            }
        } catch (error) {
            console.error('Error saving event:', error)
            alert('Error saving event. Please try again.')
        }
    }

    const handleDeleteEvent = async () => {
        if (!selectedDate) return

        try {
            const response = await axios.delete(`/api/calendar/${session?.user?.id}?date=${selectedDate}`)

            if (response.status === 200) {
                await fetchEvents()
                setShowEventModal(false)
                setEventTitle('')
                setEventDescription('')
            }
        } catch (error) {
            console.error('Error deleting event:', error)
            alert('Error deleting event. Please try again.')
        }
    }

    const changeMonth = (direction: number) => {
        const newMonth = new Date(currentMonth)
        newMonth.setMonth(newMonth.getMonth() + direction)
        setCurrentMonth(newMonth)
    }

    const formatMonthYear = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }

    if (loading) {
        return (
            <div className='flex flex-col w-full bg-gray-200'>
                <ContentHeader/>
                <div className='flex flex-col bg-white flex-1 m-10 rounded-xl border-[1] border-black'>
                    <div className='flex justify-center items-center p-10'>
                        <p className='text-gray-500'>Loading...</p>
                    </div>
                </div>
            </div>
        )
    }

    return(
        <div className='flex flex-col w-full bg-gray-200'>
            <ContentHeader/>
            <div className='flex flex-col bg-white flex-1 m-10 rounded-xl border-[1] border-black'>
                <div className='flex justify-between items-center font-bold p-5 border-b-[1] border-gray-300'>
                    <p className='text-xl'>Calendar</p>
                    <div className='flex items-center gap-4'>
                        <Image 
                            className='cursor-pointer' 
                            src='/arrow-left.svg' 
                            width={20} 
                            height={20} 
                            alt='arrow-left'
                            onClick={() => changeMonth(-1)}
                        />
                        <p className='text-xl text-gray-600'>{formatMonthYear(currentMonth)}</p>
                        <Image 
                            className='cursor-pointer' 
                            src='/arrow-right.svg' 
                            width={20} 
                            height={20} 
                            alt='arrow-right'
                            onClick={() => changeMonth(1)}
                        />
                    </div>
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className={`flex items-center gap-2 text-white rounded-lg px-5 py-1 cursor-pointer transition-colors ${
                            isEditing ? 'bg-green-700 hover:bg-green-800' : 'bg-red-800 hover:bg-red-700'
                        }`}
                    >
                        <Image src='/edit-white.svg' width={20} height={20} alt='edit'/>
                        <p>{isEditing ? 'Done' : 'Edit'}</p>
                    </button>
                </div>
                <div className='flex flex-col flex-1 rounded-lg border-[1] border-black m-5'>
                    <div className='grid grid-cols-7 justify-items-center text-center font-bold py-2 border-b-[1] border-gray-300'>
                        <p className='w-30'>Monday</p>
                        <p className='w-30'>Tuesday</p>
                        <p className='w-30'>Wednesday</p>
                        <p className='w-30'>Thursday</p>
                        <p className='w-30'>Friday</p>
                        <p className='w-30'>Saturday</p>
                        <p className='w-30'>Sunday</p>
                    </div>
                    <div className='grid flex-1 items-center grid-cols-7 grid-rows-6 justify-items-center'>
                        {monthDays.map((dayData, index) => {
                            const column = index % 7
                            const row = Math.floor(index / 7)
                            const event = getEventForDate(dayData.date)
                            const isToday = dayData.isToday
                            const isCurrentMonth = dayData.isCurrentMonth
                            
                            return (
                                <div 
                                    key={index} 
                                    className={`w-full h-full font-bold text-sm flex items-center p-5 hover:bg-gray-50 border-gray-300 justify-center relative
                                    ${column < 6 ? 'border-r-[1]' : ''}
                                    ${row < 6 ? 'border-b-[1]' : ''}
                                    ${!isCurrentMonth ? 'text-gray-300' : ''}
                                    ${isToday ? 'bg-blue-50' : ''}
                                    ${isEditing && isCurrentMonth ? 'cursor-pointer hover:bg-blue-50' : ''}
                                    ${event ? 'bg-yellow-50' : ''}`}
                                    onClick={() => handleDateClick(dayData.date)}
                                >
                                    <p className='absolute top-1 left-2'>{dayData.day}</p>
                                    {event && (
                                        <p className='text-gray-600 text-center text-xs truncate max-w-full px-1'>
                                            {event.title}
                                        </p>
                                    )}
                                    {!event && isCurrentMonth && isEditing && (
                                        <p className='text-gray-400 text-center text-xs'>+</p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Event Modal */}
            {showEventModal && (
                <div className='fixed inset-0 bg-gray-700/50 flex items-center justify-center z-50'>
                    <div className='bg-white rounded-lg border border-black py-6 w-[450px] shadow-2xl'>
                        <div className='flex pl-6 items-center w-full border-b border-gray-300 pb-4'>
                            <p className='text-xl font-bold'>Event Details</p>
                        </div>
                        
                        <div className='px-6 py-4 space-y-4'>
                            <div>
                                <label className='font-bold text-sm text-gray-700'>Date</label>
                                <p className='text-gray-600 text-sm'>{selectedDate}</p>
                            </div>
                            
                            <div>
                                <label className='font-bold text-sm text-gray-700'>Event Title *</label>
                                <input
                                    type='text'
                                    value={eventTitle}
                                    onChange={(e) => setEventTitle(e.target.value)}
                                    className='w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm'
                                    placeholder='Enter event title'
                                />
                            </div>
                            
                            <div>
                                <label className='font-bold text-sm text-gray-700'>Description</label>
                                <textarea
                                    value={eventDescription}
                                    onChange={(e) => setEventDescription(e.target.value)}
                                    className='w-full border border-gray-300 rounded-lg px-4 py-2 mt-1 outline-0 focus:ring-2 focus:ring-blue-500 text-sm resize-none'
                                    rows={3}
                                    placeholder='Enter event description (optional)'
                                />
                            </div>
                            
                            <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
                                <button
                                    type='button'
                                    onClick={() => setShowEventModal(false)}
                                    className='border border-gray-300 text-gray-700 rounded-lg px-5 py-2 cursor-pointer font-bold text-sm hover:bg-gray-100 transition-colors'
                                >
                                    Cancel
                                </button>
                                {eventTitle && (
                                    <button
                                        type='button'
                                        onClick={handleDeleteEvent}
                                        className='bg-red-600 text-white rounded-lg px-5 py-2 cursor-pointer font-bold text-sm hover:bg-red-700 transition-colors'
                                    >
                                        Delete
                                    </button>
                                )}
                                <button
                                    type='button'
                                    onClick={handleSaveEvent}
                                    className='bg-blue-600 text-white rounded-lg px-5 py-2 cursor-pointer font-bold text-sm hover:bg-blue-700 transition-colors'
                                >
                                    Save Event
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}