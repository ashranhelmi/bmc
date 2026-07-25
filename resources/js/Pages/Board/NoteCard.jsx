import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { router } from "@inertiajs/react"
import { UserRoundIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// A numbered list item within its section's SortableContext — not free
// canvas positioning. Simpler to build reliably and easier to scan a
// workshop's ideas than pixel-precise placement (see requirements
// discussion, Session 2). The actively-dragged card is rendered separately
// by BoardCanvas's DragOverlay, floating above every section — this
// component just goes invisible-in-place (opacity) while that's happening.
export default function NoteCard({ note, number, readOnly = false, onPicChange }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
    disabled: readOnly,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      {...(readOnly ? {} : listeners)}
      {...(readOnly ? {} : attributes)}
      data-testid="note-card"
      className={cn(
        "flex touch-none items-start gap-2 rounded-md p-2 text-xs shadow-sm transition-all duration-150 print:break-inside-avoid",
        !readOnly && "cursor-grab hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-30",
      )}
      style={{ ...style, backgroundColor: note.color, color: "#fff" }}
    >
      <span className="mt-0.5 shrink-0 rounded-full bg-black/20 px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
        {number}
      </span>
      <div className="min-w-0 flex-1">
        {/* Author is who TYPED this during the live session — the color
            already communicates that on screen (see the header roster),
            so the text label is redundant there and hidden. It's kept for
            print, though: the roster itself is print:hidden, so a printed
            page would otherwise have no way at all to say who wrote what. */}
        <div className="mb-0.5 hidden truncate text-[10px] font-semibold opacity-80 print:block">
          {note.author_name}
        </div>
        <div className="break-words">{note.body}</div>
        <PicTag note={note} readOnly={readOnly} onPicChange={onPicChange} />
      </div>
    </div>
  )
}

// Who's RESPONSIBLE for this item — distinct from author_name above, which
// only ever records who typed it. Free text, not tied to a participant, so
// it can name anyone (a team, someone not even in the session) and stays
// meaningful after the workshop ends. stopPropagation on pointerdown keeps
// dnd-kit's drag sensor (bound to the whole card) from ever seeing clicks
// here — otherwise editing this tag would risk starting a drag instead.
function PicTag({ note, readOnly, onPicChange }) {
  const [editing, setEditing] = React.useState(false)
  const [value, setValue] = React.useState(note.pic ?? "")

  React.useEffect(() => {
    if (!editing) setValue(note.pic ?? "")
  }, [note.pic, editing])

  function save() {
    setEditing(false)
    const trimmed = value.trim()
    if (trimmed === (note.pic ?? "")) return
    const nextPic = trimmed || null
    // Optimistic — the request itself uses preserveState (see Show.jsx's
    // updateNotePic comment) and only broadcasts .toOthers(), so without
    // this the person making the change would never see their own edit.
    onPicChange?.(note.id, nextPic)
    router.patch(
      route("notes.updatePic", note.id),
      { pic: nextPic },
      { preserveScroll: true, preserveState: true },
    )
  }

  // Unlike author_name (screen-hidden, print-only), PIC is exactly the kind
  // of thing worth having on a printed action-item sheet — so it stays
  // visible on screen AND print whenever it's actually set. Only the
  // interactive "unassigned" invite/edit-input states are print:hidden,
  // since there's nothing to convey and their chrome means nothing on paper.
  if (readOnly) {
    if (!note.pic) return null
    return (
      <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-black/20 px-1.5 py-0.5 text-[10px] font-medium">
        <UserRoundIcon className="size-2.5" /> {note.pic}
      </div>
    )
  }

  if (editing) {
    return (
      <input
        autoFocus
        maxLength={100}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          // Enter/Space is dnd-kit's OWN default keyboard-sensor activation
          // key — without stopping propagation here, this keydown bubbles
          // from the input up to the note card's own listeners (bound for
          // dragging) and gets read as "start a keyboard drag" instead of
          // "save this field," leaving a drag session stuck open forever
          // (draggingRef never resets) and silently freezing every future
          // note update on screen.
          e.stopPropagation()
          if (e.key === "Enter") e.currentTarget.blur()
          if (e.key === "Escape") {
            setValue(note.pic ?? "")
            setEditing(false)
          }
        }}
        onPointerDown={(e) => e.stopPropagation()}
        placeholder="Assign to…"
        data-testid="note-pic-input"
        className="mt-1 w-full rounded border-0 bg-white/20 px-1.5 py-0.5 text-[10px] text-white outline-none placeholder:text-white/70 print:hidden"
      />
    )
  }

  return (
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onClick={() => setEditing(true)}
      data-testid="note-pic-tag"
      className={cn(
        "mt-1 inline-flex items-center gap-1 rounded-full bg-black/20 px-1.5 py-0.5 text-[10px] font-medium hover:bg-black/30",
        !note.pic && "print:hidden",
      )}
    >
      <UserRoundIcon className="size-2.5" /> {note.pic || "Assign to…"}
    </button>
  )
}
