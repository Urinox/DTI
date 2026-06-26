import ContentHeader from "@/components/ContentHeader"
import EditProfilePopup from "@/components/EditProfilePopup"
import Image from "next/image"
import {useState} from "react"

export default function ProfileContent({username, profileData, id, getProfile} : {username: string, profileData: {name:string, email: string, division: string, designation: string, office: string}, id: string, getProfile: () => void}) {
    const [show, setShow] = useState(false)

    return(
        <div className='flex flex-col w-full bg-gray-200'>
            <ContentHeader username={username}/>
            <div className='flex flex-col bg-white border-[1] mx-70 border-black rounded-xl my-10 p-5'>
                <div className='flex items-center gap-5'>
                    <Image src='/profile.svg' width={90} height={90} alt='Profile'/>
                    <div>
                        <p className='text-xl font-bold'>{profileData.name}</p>
                        <p className='text-gray-600'>ID: #{id}</p>
                        <button onClick={() => setShow(!show)} className='flex items-center gap-2 bg-red-800 text-white rounded-lg px-5 py-1 cursor-pointer font-bold text-sm mt-1'>
                            <Image src='/user_edit.svg' width={16} height={16} alt='edit'/>
                            <p>Edit</p>
                        </button>
                    </div>
                </div>
                <div className='grid grid-cols-2 gap-5 mt-7 mb-2 ml-5'>
                    <div>
                        <p className='font-bold'>Email</p>
                        <p className='text-gray-600'>{profileData.email}</p>
                    </div>
                    <div>
                        <p className='font-bold'>Division</p>
                        <p className='text-gray-600'>{profileData.division}</p>
                    </div>
                    <div>
                        <p className='font-bold'>Designation</p>
                        <p className='text-gray-600'>{profileData.designation}</p>
                    </div>
                    <div>
                        <p className='font-bold'>Office</p>
                        <p className='text-gray-600'>{profileData.office}</p>
                    </div>
                </div>
            </div>
            <div className={`justify-center items-center absolute w-full right-0 top-0 h-screen bg-gray-700/20 ${show ? 'flex' : 'hidden'}`}>
                <EditProfilePopup showPopup={() => setShow(!show)} profileData={profileData} id={id} getProfile={getProfile}/>
            </div>
        </div>
    )
}