import * as React from "react"
import { Head, router } from "@inertiajs/react"
import { useDeviceGate } from "@/hooks/useDeviceGate"
import { useCursorBroadcast } from "@/hooks/useCursorBroadcast"
import NotStartedScreen from "./NotStartedScreen"
import ShareSessionScreen from "./ShareSessionScreen"
import PinGate from "./PinGate"
import JoinPrompt from "./JoinPrompt"
import BoardCanvas from "./BoardCanvas"
import HostControls from "./HostControls"
import ExportButton from "./ExportButton"
import ExampleCanvasToggle from "./ExampleCanvasToggle"
import PrintButton from "./PrintButton"

export default function Show({
  board,
  isHost,
  pinVerified,
  participant,
  sections,
  freeformKey,
  participantColors,
  takenColors: initialTakenColors,
  notes: initialNotes,
}) {
  const isTooSmall = useDeviceGate()
  const [notes, setNotes] = React.useState(initialNotes)
  const [isLocked, setIsLocked] = React.useState(board.isLocked)
  const [showShareScreen, setShowShareScreen] = React.useState(isHost && board.isStarted)
  const [takenColors, setTakenColors] = React.useState(initialTakenColors)
  const [channel, setChannel] = React.useState(null)
  // Distinct from `channel` — window.Echo.join() returns a channel object
  // synchronously, well before the actual WebSocket subscription handshake
  // with Reverb completes. `.here()` firing is the real "you're subscribed"
  // signal, which is what a whisper actually depends on.
  const [presenceReady, setPresenceReady] = React.useState(false)
  const containerRef = React.useRef(null)
  const cursorLayerRef = React.useRef(null)
  const wasStartedRef = React.useRef(board.isStarted)

  // Clicking "Start Session" doesn't remount this component — Inertia just
  // updates its props on the same instance (POST -> back() -> re-visit of
  // the same page). A useState INITIALIZER only ever runs once, at the
  // original mount (when isHost/board.isStarted were both still false), so
  // without this effect the Share screen would never actually show — this
  // watches for the specific not-started -> started transition instead.
  React.useEffect(() => {
    if (!wasStartedRef.current && board.isStarted && isHost) {
      setShowShareScreen(true)
    }
    wasStartedRef.current = board.isStarted
  }, [board.isStarted, isHost])

  React.useEffect(() => setNotes(initialNotes), [initialNotes])
  React.useEffect(() => setIsLocked(board.isLocked), [board.isLocked])
  React.useEffect(() => setTakenColors(initialTakenColors), [initialTakenColors])

  const { removeCursor } = useCursorBroadcast({ channel, containerRef, cursorLayerRef, participant })

  // Public channel — anyone can subscribe regardless of join state, since
  // even a not-yet-joined viewer needs to know when Start/Lock/Import happen.
  React.useEffect(() => {
    if (!board.id || !window.Echo) return

    const publicChannel = window.Echo.channel(`board.${board.id}`)

    const upsertNote = ({ note }) => {
      setNotes((prev) => {
        const idx = prev.findIndex((n) => n.id === note.id)
        if (idx === -1) return [...prev, note]
        const next = [...prev]
        next[idx] = note
        return next
      })
    }

    publicChannel
      .listen(".note.created", upsertNote)
      .listen(".note.moved", upsertNote)
      .listen(".board.lock-toggled", ({ isLocked: locked }) => setIsLocked(locked))
      .listen(".board.started", () => router.reload())
      .listen(".board.imported", () => router.reload())

    return () => {
      window.Echo.leave(`board.${board.id}`)
    }
  }, [board.id])

  // Presence channel — only once joined (auth requires a real participant),
  // for live cursors and roster-driven color availability.
  React.useEffect(() => {
    if (!board.id || !participant || !window.Echo) return

    const presence = window.Echo.join(`presence-board.${board.id}`)
      .here((members) => {
        setTakenColors(members.map((m) => m.color))
        setPresenceReady(true)
      })
      .joining((member) => setTakenColors((prev) => [...prev, member.color]))
      .leaving((member) => {
        setTakenColors((prev) => prev.filter((c) => c !== member.color))
        removeCursor(member.id)
        // See ParticipantController::leave — any other still-connected
        // client reports the departure server-side, since Reverb's own
        // .leaving() is already driven by its server-side connection/ping
        // timeout detection, not the departed client's JS.
        window.axios.post(route("participants.leave", member.id)).catch(() => {})
      })

    setChannel(presence)

    return () => {
      window.Echo.leave(`presence-board.${board.id}`)
      setChannel(null)
      setPresenceReady(false)
    }
  }, [board.id, participant?.id])

  if (isTooSmall) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
        <h1 className="text-xl font-semibold">Use a larger screen</h1>
        <p className="max-w-xs text-muted-foreground">
          This board works on desktop and tablet only — it isn't built for phone-sized screens.
        </p>
      </div>
    )
  }

  if (!board.isStarted) {
    return (
      <>
        <Head title="BMC" />
        <NotStartedScreen />
      </>
    )
  }

  if (isHost && showShareScreen) {
    return (
      <>
        <Head title="Share — BMC" />
        <ShareSessionScreen
          pin={board.pin}
          lanUrl={board.lanUrl}
          onContinue={() => setShowShareScreen(false)}
        />
      </>
    )
  }

  if (!pinVerified) {
    return (
      <>
        <Head title="BMC" />
        <PinGate />
      </>
    )
  }

  return (
    <>
      <Head title="BMC" />
      <div className="flex h-screen flex-col" data-testid="board-page" data-presence-ready={presenceReady ? "true" : "false"}>
        <header className="flex items-center justify-between gap-3 border-b p-3 print:hidden">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold">Business Model Canvas</h1>
            {participant && (
              <span
                className="rounded px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: participant.color }}
              >
                {participant.displayName}
              </span>
            )}
            {isLocked && (
              <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Locked
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ExampleCanvasToggle sections={sections} freeformKey={freeformKey} />
            <ExportButton />
            {isLocked && <PrintButton />}
            {isHost && <HostControls isLocked={isLocked} />}
          </div>
        </header>

        <BoardCanvas
          sections={sections}
          freeformKey={freeformKey}
          notes={notes}
          readOnly={!participant || isLocked}
          containerRef={containerRef}
          cursorLayerRef={cursorLayerRef}
        />
      </div>

      {!participant && !isLocked && (
        <JoinPrompt participantColors={participantColors} takenColors={takenColors} />
      )}
    </>
  )
}
