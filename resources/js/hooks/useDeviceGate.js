import * as React from "react"

// Adapted from the template's use-mobile.js pattern (matchMedia + resize
// listener, already re-checks on resize/rotation). Blocks phones only —
// tablets in either orientation are meant to work, so the threshold sits
// below typical tablet-portrait widths rather than at the usual 768px
// "is this a phone OR small tablet" line.
const MIN_WIDTH = 600

export function useDeviceGate() {
  const [isTooSmall, setIsTooSmall] = React.useState(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MIN_WIDTH - 1}px)`)
    const onChange = () => setIsTooSmall(window.innerWidth < MIN_WIDTH)
    mql.addEventListener("change", onChange)
    onChange()
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isTooSmall
}
