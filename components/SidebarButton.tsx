// components/SidebarButton.tsx
import Image from "next/image";
import { useRouter } from 'next/navigation';

interface SidebarButtonProps {
    btnText: string;
    btnIcon: string;
    selected: boolean;
    onClick?: () => void;
    href?: string;
}

export default function SidebarButton({ 
    btnText, 
    btnIcon, 
    selected, 
    onClick, 
    href 
}: SidebarButtonProps) {
    const router = useRouter();

    const handleClick = () => {
        // If custom onClick is provided, use it
        if (onClick) {
            onClick();
            return;
        }

        // If href is provided, navigate and reload
        if (href) {
            // Use window.location for a full page reload instead of router.push
            window.location.href = href;
        }
    };

    return(
        <button 
            onClick={handleClick} 
            className={`text-white flex items-center gap-2 ${selected ? 'bg-linear-to-r from-[rgba(0,20,121,1)] to-[rgba(3,7,61,1)]' : 'bg-black'} py-2 px-6 cursor-pointer w-full hover:bg-linear-to-r hover:from-[rgba(0,20,121,0.8)] hover:to-[rgba(3,7,61,0.8)] transition-colors`}
        >
            <Image src={`/${btnIcon}`} width={25} height={25} alt={btnText}/>
            <p className='text-lg font-semibold whitespace-nowrap'>{btnText}</p>
        </button>
    );
}