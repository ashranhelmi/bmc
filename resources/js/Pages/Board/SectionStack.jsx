import * as React from "react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useForm } from "@inertiajs/react"
import { PlusIcon } from "lucide-react"
import NoteCard from "./NoteCard"
import SectionTooltip from "./SectionTooltip"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Expand/collapse is local `useState`, deliberately NOT synced across
 * participants — one person expanding a section mid-workshop shouldn't yank
 * the view out from under everyone else looking at a different section.
 *
 * Notes are a numbered, ordered list (not free canvas positioning) — see
 * requirements discussion, Session 2. Each section is its own SortableContext
 * PLUS a droppable container (`useDroppable`), so dropping into an empty
 * section or past the last item still resolves to the right container —
 * the standard dnd-kit multi-container pattern.
 */
export default function SectionStack({ sectionKey, section, notes, readOnly, isFreeform = false }) {
  const [expanded, setExpanded] = React.useState(isFreeform)
  const { setNodeRef, isOver } = useDroppable({ id: sectionKey })

  // An empty section has nothing to stack/collapse — without this, a section
  // starting at 0 notes would never render its Add Note button at all (no
  // notes means no expand toggle either, so it could never be opened), which
  // would make it impossible to ever add a section's very first note.
  const isExpanded = expanded || isFreeform || notes.length === 0

  return (
    <div
      className={cn(
        "relative flex min-h-[10rem] flex-col overflow-hidden rounded-lg border",
        isFreeform && "min-h-[16rem]",
      )}
      style={{ backgroundColor: isFreeform ? undefined : `${section.color}1a` }}
    >
      <div
        className="flex items-center justify-between gap-2 border-b px-3 py-2"
        style={{ borderColor: isFreeform ? undefined : `${section.color}40` }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: isFreeform ? "#6b6a65" : section.color }}
          />
          <span className="text-sm font-medium">{isFreeform ? "Free-form" : section.label}</span>
          {!isFreeform && (
            <span className="print:hidden">
              <SectionTooltip question={section.question} />
            </span>
          )}
        </div>
        {!isFreeform && notes.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline print:hidden"
          >
            {expanded ? "Collapse" : `${notes.length} note${notes.length === 1 ? "" : "s"}`}
          </button>
        )}
      </div>

      <div
        ref={setNodeRef}
        data-testid={`section-drop-${sectionKey}`}
        className={cn(
          "relative flex-1",
          isOver && "bg-accent/40",
          !isExpanded && "flex items-center justify-center print:block",
        )}
      >
        {/* Print always shows the real numbered list regardless of each
            section's own collapsed state — a printed artifact showing a
            stack preview instead of actual notes would defeat the point. */}
        {!isExpanded && (
          <div className="print:hidden">
            <StackPreview notes={notes} onClick={() => setExpanded(true)} />
          </div>
        )}
        <div className={cn("flex flex-col gap-1.5 p-2", !isExpanded ? "hidden print:flex" : "flex")}>
          <SortableContext
            items={notes.map((n) => n.id)}
            strategy={verticalListSortingStrategy}
          >
            {notes.map((note, i) => (
              <NoteCard key={note.id} note={note} number={i + 1} readOnly={readOnly} />
            ))}
          </SortableContext>
          {!readOnly && (
            <div className="print:hidden">
              <AddNoteButton sectionKey={sectionKey} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AddNoteButton({ sectionKey }) {
  const [open, setOpen] = React.useState(false)
  const { data, setData, post, processing, reset, transform } = useForm({ body: "" })

  function submit(e) {
    e.preventDefault()
    if (!data.body.trim()) return
    transform((formData) => ({ ...formData, section: sectionKey }))
    post(route("notes.store"), {
      onSuccess: () => {
        reset()
        setOpen(false)
      },
      preserveScroll: true,
    })
  }

  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => setOpen(true)}
        data-testid={`add-note-${sectionKey}`}
      >
        <PlusIcon /> Add note
      </Button>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-1.5 rounded-md border bg-card p-2 shadow-sm">
      <textarea
        autoFocus
        maxLength={500}
        value={data.body}
        onChange={(e) => setData("body", e.target.value)}
        placeholder="Type a note…"
        className="h-16 resize-none rounded border bg-background p-1.5 text-xs outline-none"
        data-testid="add-note-textarea"
      />
      <div className="flex justify-end gap-1.5">
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={processing || !data.body.trim()}
          data-testid="add-note-submit"
        >
          Add
        </Button>
      </div>
    </form>
  )
}

function StackPreview({ notes, onClick }) {
  if (notes.length === 0) return null

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative h-16 w-24 cursor-pointer"
      aria-label={`Expand ${notes.length} notes`}
    >
      {notes.slice(0, 4).map((note, i) => (
        <div
          key={note.id}
          className="absolute inset-x-2 top-0 h-14 rounded-md shadow"
          style={{
            backgroundColor: note.color,
            transform: `translateY(${i * 4}px) rotate(${(i - 1.5) * 3}deg)`,
            zIndex: i,
          }}
        />
      ))}
      <span className="absolute -top-1.5 -right-1.5 z-10 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
        {notes.length}
      </span>
    </button>
  )
}
