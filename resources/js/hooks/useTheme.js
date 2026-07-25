import { useEffect, useState } from 'react'

export function useTheme() {
    const [theme, setTheme] = useState(() => {
        if (typeof window === 'undefined') return 'light'
        const stored = localStorage.getItem('theme')
        if (stored) return stored
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    })

    useEffect(() => {
        const root = document.documentElement
        if (theme === 'dark') {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }
        localStorage.setItem('theme', theme)
    }, [theme])

    // Listen to system preference changes
    useEffect(() => {
        const stored = localStorage.getItem('theme')
        if (stored) return // user has manual override, don't follow system

        const media = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = (e) => setTheme(e.matches ? 'dark' : 'light')
        media.addEventListener('change', handler)
        return () => media.removeEventListener('change', handler)
    }, [])

    const toggleTheme = () => setTheme((prev) => prev === 'dark' ? 'light' : 'dark')

    return { theme, toggleTheme }
}
