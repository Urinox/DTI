import {useState} from "react"
import axios from "axios"

export default function OvertimePopup({showPopup, id, getOvertimeRequest} : {showPopup: () => void, id: string, getOvertimeRequest: () => void}) {
    const [date, setDate] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [purpose, setPurpose] = useState('')

    async function handleSubmit(e:any){
        e.preventDefault()
        try{
            const formattedDate = new Date(date)
            const formattedStartTime = new Date(`${date}T${startTime}:00.000Z`)
            const formattedEndTime = new Date(`${date}T${endTime}:00.000Z`)
            await axios.post(`/api/overtime_request/${id}`, {date: formattedDate, startTime: formattedStartTime, endTime: formattedEndTime, purpose})
            alert('Overtime added successfully')
            getOvertimeRequest()
            showPopup()
        }catch (err){
            console.log(err)
        }
    }

    return(
        <div className='flex flex-col bg-white gap-2 rounded-lg border-[1] border-black py-5 w-[40%]'>
            <div className='flex pl-5 items-center w-full border-b-[1] border-gray-300 pb-5'>
                <p className='text-xl font-bold'>New Overtime</p>
            </div>
            <form onSubmit={handleSubmit} className='flex mx-5 gap-4 flex-col'>
                <div className='flex flex-col gap-2 mr-80'>
                    <p className='font-bold'>Date</p>
                    <input
                        required
                        onChange={(e) => setDate(e.target.value)}
                        type='date'
                        className='border-[1] border-gray-300 text-gray-700 rounded-lg px-5 outline-0'/>
                </div>
                <div className='flex mr-60'>
                    <p className='font-bold flex-1'>Start Time</p>
                    <input
                        required
                        onChange={(e) => setStartTime(e.target.value)}
                        type='time'
                        className='border-[1] flex-1 border-gray-300 text-gray-700 rounded-lg px-5 outline-0'/>
                </div>
                <div className='flex mr-60'>
                    <p className='font-bold flex-1'>End Time</p>
                    <input
                        required
                        onChange={(e) => setEndTime(e.target.value)}
                        type='time'
                        className='border-[1] flex-1 border-gray-300 text-gray-700 rounded-lg px-5 outline-0'/>
                </div>
                <div className='flex flex-col gap-2'>
                    <p className='font-bold'>Purpose</p>
                    <textarea
                        required
                        onChange={(e) => setPurpose(e.target.value)}
                        rows={5}
                        className='outline-0 border-[1] border-gray-300 text-gray-700'/>
                </div>
                <div className='flex items-center'>
                    <input type='button' value='Cancel' onClick={showPopup} className='border-[1] border-gray-300 text-gray-700 rounded-lg px-5 py-1 cursor-pointer font-bold text-sm mr-5'/>
                    <input type='submit' value='Add' className='bg-red-800 text-white rounded-lg px-5 py-1 cursor-pointer font-bold text-sm mr-5'/>
                </div>
            </form>
        </div>
    )
}