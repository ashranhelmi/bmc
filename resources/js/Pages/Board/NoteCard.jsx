import * as React from "react"
import { useDraggable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"

// Free x/y positioning via @dnd-kit/core's useDraggable — deliberately not
// the `sortable` preset (list-reorder only, used elsewhere in other
// projects). pos_x/pos_y are percentages of the note's CURRENT container box
// (a section or the freeform area), not raw pixels — different
// participants' viewports differ in size.
export default function NoteCard({ note, readOnly = false, style }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `note-${note.id}`,
    data: { note },
    disabled: readOnly,
  })

  // Base centering (-50%, -50%) and the live drag delta both have to live in
  // the SAME transform value — a Tailwind translate utility class would
  // just get clobbered by the inline style below.
  const dragDelta = transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : ""

  return (
    <div
      ref={setNodeRef}
      {...(readOnly ? {} : listeners)}
      {...(readOnly ? {} : attributes)}
      data-testid="note-card"
      className={cn(
        "absolute w-36 touch-none rounded-md p-2 text-xs shadow-md",
        !readOnly && "cursor-grab active:cursor-grabbing",
        isDragging && "z-30 shadow-xl",
      )}
      style={{
        left: `${note.pos_x}%`,
        top: `${note.pos_y}%`,
        backgroundColor: note.color,
        color: "#fff",
        transform: `translate(-50%, -50%) ${dragDelta}`,
        ...style,
      }}
    >
      <div className="mb-1 truncate text-[10px] font-semibold opacity-80">{note.author_name}</div>
      <div className="line-clamp-4 break-words">{note.body}</div>
    </div>
  )
}
