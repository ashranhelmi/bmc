import * as React from "react"

/**
 * Live cursor positions are broadcast as presence-channel WHISPERS
 * (client-to-client, never touching a PHP controller) and, on the receiving
 * side, applied directly to a plain DOM node's `style.transform` — never
 * through React state/setState. React only owns mounting/unmounting a
 * cursor's DOM node (rare — on presence join/leave), never its per-frame
 * position. Driving position through setState here would re-render the
 * whole cursor layer on every pointer move from every participant, which is
 * exactly the thrash this hook exists to avoid.
 *
 * Coordinates are sent as fractions (0–1) of the canvas container's own
 * bounding box, not raw pixels — participants' viewports differ in size, so
 * a shared coordinate space has to be relative to the canvas, not the screen.
 */
export function useCursorBroadcast({ channel, containerRef, cursorLayerRef, participant }) {
  const nodesRef = React.useRef(new Map())
  const rafRef = React.useRef(null)

  React.useEffect(() => {
    if (!channel || !participant) return

    const container = containerRef.current
    if (!container) return

    const handlePointerMove = (e) => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        const rect = container.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        if (x < 0 || x > 1 || y < 0 || y > 1) return
        channel.whisper("cursor", {
          id: participant.id,
          name: participant.displayName,
          color: participant.color,
          x,
          y,
        })
      })
    }

    container.addEventListener("pointermove", handlePointerMove)

    const applyPosition = (data) => {
      if (data.id === participant.id) return

      let node = nodesRef.current.get(data.id)
      if (!node) {
        node = document.createElement("div")
        node.dataset.testid = "remote-cursor"
        node.className = "pointer-events-none absolute top-0 left-0 z-40 flex items-center gap-1.5 will-change-transform"
        node.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style="filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.3))">
            <path d="M2 2L15 8L9 9.5L7 15.5L2 2Z" fill="${data.color}" stroke="white" stroke-width="1"/>
          </svg>
          <span class="rounded px-1.5 py-0.5 text-xs font-medium text-white shadow-sm" style="background-color:${data.color}">${data.name}</span>
        `
        cursorLayerRef.current?.appendChild(node)
        nodesRef.current.set(data.id, node)
      }

      // translate() percentages are relative to the CURSOR NODE's own size,
      // not the container — a persistent bug where the cursor barely moved
      // from the top-left corner regardless of the sender's real position.
      // Converting to pixels against the RECEIVER's own container size (not
      // the sender's) is what makes this correct across differently-sized
      // viewports, which is the whole reason positions are sent as fractions.
      const rect = container.getBoundingClientRect()
      node.style.transform = `translate(${data.x * rect.width}px, ${data.y * rect.height}px)`
    }

    channel.listenForWhisper("cursor", applyPosition)

    return () => {
      container.removeEventListener("pointermove", handlePointerMove)
      channel.stopListeningForWhisper("cursor", applyPosition)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [channel, containerRef, cursorLayerRef, participant])

  // Remove a departed participant's cursor node — called by the presence
  // channel's own .leaving() handler in BoardCanvas, not derived here.
  const removeCursor = React.useCallback((participantId) => {
    const node = nodesRef.current.get(participantId)
    if (node) {
      node.remove()
      nodesRef.current.delete(participantId)
    }
  }, [])

  return { removeCursor }
}
