// app/home/provincial-director/page.tsx
import { Suspense } from 'react'
import ProvincialDirectorContent from './ProvincialDirectorContent'

export default function HomePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <ProvincialDirectorContent />
        </Suspense>
    )
}