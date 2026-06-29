// app/home/admin/page.tsx
import { Suspense } from 'react'
import AdminContent from './AdminContent'

export default function HomePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <AdminContent />
        </Suspense>
    )
}