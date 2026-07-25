import { useEffect, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'

export function AppToaster() {
    const [theme, setTheme] = useState(
        document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    )

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setTheme(
                document.documentElement.classList.contains('dark') ? 'dark' : 'light'
            )
        })
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        })
        return () => observer.disconnect()
    }, [])

    return <Toaster richColors position="top-right" theme={theme} />
}
