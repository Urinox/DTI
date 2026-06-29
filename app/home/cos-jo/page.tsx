// app/home/cos-jo/page.tsx
import { Suspense } from 'react'
import CosJoContent from './CosJoContent'

export default function HomePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <CosJoContent />
        </Suspense>
    )
}