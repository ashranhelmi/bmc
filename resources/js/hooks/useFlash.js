import { useEffect } from 'react'
import { usePage } from '@inertiajs/react'
import { toast } from 'sonner'

export function useFlash() {
    const { flash } = usePage().props

    useEffect(() => {
        console.log('flash props:', flash)
        if (flash?.success) toast.success(flash.success)
        if (flash?.error) toast.error(flash.error)
        if (flash?.warning) toast.warning(flash.warning)
        if (flash?.info) toast.info(flash.info)
    }, [flash])
}
