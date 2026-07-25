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
import PrintButton from "./PrintButton"
import ParticipantRoster from "./ParticipantRoster"
import HowItWorksDialog from "./HowItWorksDialog"
import BmcGuideDialog from "./BmcGuideDialog"
import { Button } from "@/components/ui/button"
import exampleData from "@/data/exampleCanvas.json"
import { BookOpenIcon, XIcon } from "lucide-react"

// Derived once, not per-render — the example view's roster is static fixture
// data, so this teaches the SAME roster UI the live board uses (per DHelm's
// ask) without needing a live presence channel behind it.
const EXAMPLE_ROSTER = Array.from(
  new Map(exampleData.notes.map((n) => [n.author_name, { id: n.author_name, displayName: n.author_name, color: n.color }])).values(),
)

// How long a section's header stays pulsed after a broadcast touches it —
// long enough to notice, short enough not to nag.
const HIGHLIGHT_DURATION_MS = 2000

export default function Show({
  board,
  isHost,
  pinVerified,
  participant,
  sections,
  freeformKey,
  participantColors,
  participants: initialParticipants,
  notes: initialNotes,
}) {
  const isTooSmall = useDeviceGate()
  const [notes, setNotes] = React.useState(initialNotes)
  const [isLocked, setIsLocked] = React.useState(board.isLocked)
  const [showShareScreen, setShowShareScreen] = React.useState(isHost && board.isStarted)
  // The single source of truth for "who's here" — JoinPrompt's disabled
  // swatches are derived from this, not tracked separately.
  const [roster, setRoster] = React.useState(initialParticipants)
  const [highlightedSections, setHighlightedSections] = React.useState(() => new Set())
  const highlightTimersRef = React.useRef(new Map())
  const [channel, setChannel] = React.useState(null)
  // Distinct from `channel` — window.Echo.join() returns a channel object
  // synchronously, well before the actual WebSocket subscription handshake
  // with Reverb completes. `.here()` firing is the real "you're subscribed"
  // signal, which is what a whisper actually depends on.
  const [presenceReady, setPresenceReady] = React.useState(false)
  // Per-viewer local toggle, same pattern as section expand/collapse — not
  // synced across participants, since it's non-destructive and only affects
  // what's shown on this one screen.
  const [viewingExample, setViewingExample] = React.useState(false)
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
  React.useEffect(() => setRoster(initialParticipants), [initialParticipants])

  // Briefly pulses a section's header when a broadcast touches it — a
  // non-disruptive "something changed here" signal. Deliberately NOT an
  // auto-expand: that would violate the already-established rule that
  // expand/collapse stays per-viewer, never forced by someone else's action.
  // Each section gets its OWN timer so a second update to the same section
  // resets its highlight window instead of an earlier timer cutting it short.
  const flashSection = React.useCallback((sectionKey) => {
    setHighlightedSections((prev) => new Set(prev).add(sectionKey))
    clearTimeout(highlightTimersRef.current.get(sectionKey))
    const timer = setTimeout(() => {
      setHighlightedSections((prev) => {
        const next = new Set(prev)
        next.delete(sectionKey)
        return next
      })
      highlightTimersRef.current.delete(sectionKey)
    }, HIGHLIGHT_DURATION_MS)
    highlightTimersRef.current.set(sectionKey, timer)
  }, [])

  const { removeCursor } = useCursorBroadcast({ channel, containerRef, cursorLayerRef, participant })

  // Public channel — anyone can subscribe regardless of join state, since
  // even a not-yet-joined viewer needs to know when Start/Lock/Import happen.
  React.useEffect(() => {
    if (!board.id || !window.Echo) return

    const publicChannel = window.Echo.channel(`board.${board.id}`)

    const upsertNote = (note) => {
      setNotes((prev) => {
        const idx = prev.findIndex((n) => n.id === note.id)
        if (idx === -1) return [...prev, note]
        const next = [...prev]
        next[idx] = note
        return next
      })
      flashSection(note.section)
    }

    publicChannel
      .listen(".note.created", ({ note }) => upsertNote(note))
      .listen(".notes.reordered", ({ notes: changed }) => changed.forEach(upsertNote))
      .listen(".board.lock-toggled", ({ isLocked: locked }) => setIsLocked(locked))
      .listen(".board.started", () => router.reload())
      .listen(".board.imported", () => router.reload())

    return () => {
      window.Echo.leave(`board.${board.id}`)
    }
  }, [board.id, flashSection])

  // Presence channel — only once joined (auth requires a real participant),
  // for live cursors and the roster.
  React.useEffect(() => {
    if (!board.id || !participant || !window.Echo) return

    const presence = window.Echo.join(`presence-board.${board.id}`)
      .here((members) => {
        setRoster(members.map((m) => ({ id: m.id, displayName: m.name, color: m.color })))
        setPresenceReady(true)
      })
      .joining((member) =>
        setRoster((prev) => [...prev, { id: member.id, displayName: member.name, color: member.color }]),
      )
      .leaving((member) => {
        setRoster((prev) => prev.filter((p) => p.id !== member.id))
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
        <header className="flex flex-wrap items-center justify-between gap-3 border-b p-3 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-semibold">Business Model Canvas</h1>
            <ParticipantRoster participants={viewingExample ? EXAMPLE_ROSTER : roster} />
            {isLocked && (
              <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Locked
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <HowItWorksDialog />
            <BmcGuideDialog sections={sections} />
            {!viewingExample && (
              <Button variant="outline" size="sm" onClick={() => setViewingExample(true)}>
                <BookOpenIcon /> See an example
              </Button>
            )}
            <ExportButton />
            {isLocked && <PrintButton />}
            {isHost && <HostControls isLocked={isLocked} />}
          </div>
        </header>

        {viewingExample && (
          <div className="flex items-center justify-between gap-2 border-b bg-accent/40 px-3 py-2 text-sm print:hidden">
            <span>
              Viewing example — <span className="text-muted-foreground">{exampleData.businessName}</span>
            </span>
            <Button size="sm" onClick={() => setViewingExample(false)}>
              <XIcon /> Exit example
            </Button>
          </div>
        )}

        <BoardCanvas
          sections={sections}
          freeformKey={freeformKey}
          notes={viewingExample ? exampleData.notes : notes}
          readOnly={viewingExample || !participant || isLocked}
          highlightedSections={highlightedSections}
          containerRef={containerRef}
          cursorLayerRef={cursorLayerRef}
        />
      </div>

      {!participant && !isLocked && (
        <JoinPrompt participantColors={participantColors} takenColors={roster.map((p) => p.color)} />
      )}
    </>
  )
}
