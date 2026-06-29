// app/home/division-head/page.tsx
import { Suspense } from 'react'
import DivisionHeadContent from './DivisionHeadContent'

export default function HomePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <DivisionHeadContent />
        </Suspense>
    )
}