import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

// A numbered list item within its section's SortableContext — not free
// canvas positioning. Simpler to build reliably and easier to scan a
// workshop's ideas than pixel-precise placement (see requirements
// discussion, Session 2). The actively-dragged card is rendered separately
// by BoardCanvas's DragOverlay, floating above every section — this
// component just goes invisible-in-place (opacity) while that's happening.
export default function NoteCard({ note, number, readOnly = false }) {
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
        "flex touch-none items-start gap-2 rounded-md p-2 text-xs shadow-sm transition-all duration-150",
        !readOnly && "cursor-grab hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-30",
      )}
      style={{ ...style, backgroundColor: note.color, color: "#fff" }}
    >
      <span className="mt-0.5 shrink-0 rounded-full bg-black/20 px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 truncate text-[10px] font-semibold opacity-80">{note.author_name}</div>
        <div className="break-words">{note.body}</div>
      </div>
    </div>
  )
}
