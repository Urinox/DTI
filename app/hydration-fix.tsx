'use client'

import { useEffect } from 'react'

export default function HydrationFix() {
    useEffect(() => {
        // Remove bis_skin_checked from all elements
        const removeBisSkin = () => {
            const elements = document.querySelectorAll('[bis_skin_checked]')
            elements.forEach(el => {
                el.removeAttribute('bis_skin_checked')
            })
        }
        
        // Run immediately
        removeBisSkin()
        
        // Set up mutation observer to catch dynamically added attributes
        const observer = new MutationObserver((mutations) => {
            let shouldRemove = false
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
                    shouldRemove = true
                }
                if (mutation.type === 'childList') {
                    shouldRemove = true
                }
            })
            if (shouldRemove) {
                removeBisSkin()
            }
        })
        
        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ['bis_skin_checked']
        })
        
        return () => observer.disconnect()
    }, [])
    
    return null
}