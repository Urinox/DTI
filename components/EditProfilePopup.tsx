import {useState, useEffect} from "react"
import axios from "axios"

export default function EditProfilePopup({showPopup, profileData, id, getProfile} : {showPopup: () => void, profileData: {name:string, email: string, division: string, designation: string, office: string}, id: string, getProfile: () => void}) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [division, setDivision] = useState('')
    const [designation, setDesignation] = useState('')
    const [office, setOffice] = useState('')

    function getProfileData(){
        setName(profileData.name)
        setEmail(profileData.email)
        setDivision(profileData.division)
        setDesignation(profileData.designation)
        setOffice(profileData.office)
    }

    async function handleSubmit(e:any){
        e.preventDefault()
        try{
            await axios.post(`/api/profile/${id}`, {name, email, division, office, designation})
            getProfile()
            alert('Profile updated successfully')
            showPopup()
        }catch (err){
            console.log(err)
        }
    }

    useEffect(() => {
        getProfileData()
    }, []);

    return(
        <div className='flex flex-col bg-white gap-2 rounded-lg border-[1] border-black py-5 w-[35%]'>
            <div className='flex pl-5 items-center w-full border-b-[1] border-gray-300 pb-5'>
                <p className='text-xl font-bold'>Edit Profile</p>
            </div>
            <form onSubmit={handleSubmit} className='flex mx-5 gap-4 flex-col'>
                <div className='flex gap-2 flex-col'>
                    <p className='font-bold'>Name</p>
                    <input
                        type='text'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className='border-[1] py-1 border-gray-300 text-gray-700 rounded-lg px-5 outline-0'/>
                </div>
                <div className='flex gap-2 flex-col'>
                    <p className='font-bold'>Email</p>
                    <input
                        required
                        type='email'
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        className='border-[1] py-1 border-gray-300 text-gray-700 rounded-lg px-5 outline-0'/>
                </div>
                <div className='flex gap-2 flex-col'>
                    <p className='font-bold'>Division</p>
                    <input
                        type='text'
                        value={division}
                        onChange={(e) => setDivision(e.target.value)}
                        className='border-[1] py-1 border-gray-300 text-gray-700 rounded-lg px-5 outline-0'/>
                </div>
                <div className='flex gap-2 flex-col'>
                    <p className='font-bold'>Office</p>
                    <input
                        type='text'
                        value={office}
                        onChange={(e) => setOffice(e.target.value)}
                        className='border-[1] py-1 border-gray-300 text-gray-700 rounded-lg px-5 outline-0'/>
                </div>
                <div className='flex gap-2 flex-col'>
                    <p className='font-bold'>Designation</p>
                    <input
                        type='text'
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className='border-[1] py-1 border-gray-300 text-gray-700 rounded-lg px-5 outline-0'/>
                </div>
                <div className='flex items-center w-full'>
                    <input type='button' value='Cancel' onClick={showPopup} className='border-[1] border-gray-300 text-gray-700 rounded-lg px-5 py-1 cursor-pointer font-bold text-sm mr-5'/>
                    <input type='submit' value='Save Changes' className='bg-red-800 text-white rounded-lg px-5 py-1 cursor-pointer font-bold text-sm mr-5'/>
                </div>
            </form>
        </div>
    )
}