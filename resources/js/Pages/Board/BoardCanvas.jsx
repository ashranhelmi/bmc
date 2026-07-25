import * as React from "react"
import { DndContext, DragOverlay, pointerWithin, rectIntersection, closestCorners } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { router } from "@inertiajs/react"
import SectionStack from "./SectionStack"
import { cn } from "@/lib/utils"
import { ZONE_TINT, ZONE_LABEL_TINT } from "@/lib/bmcZones"

// Groups sections by their role in the framework — supply side, the Value
// Proposition bridge, demand side, and the financial check underneath —
// reinforcing the same "does this actually connect" reading covered in the
// BMC guide, directly on the canvas. No bordered/padded wrapper "card" —
// that only ate into the width available to the actual sections — just a
// label plus a flat background wash directly behind the content.
//
// This IS a real color per zone (not just a neutral tint), reusing Tailwind's
// own stock scale rather than the bespoke validated 9-section palette
// (config/bmc.php) — a deliberately lower bar than that palette's, since
// zone color here is a SECONDARY, redundant signal (position + label text +
// each section's own already-validated color still carry primary identity),
// not the sole way anything is distinguished. Colors shared with
// BmcGuideDialog's diagram via lib/bmcZones so the two stay consistent.

function Zone({ label, zone, className, children }) {
  return (
    <div className={cn("flex flex-col gap-2 rounded-lg p-2", ZONE_TINT[zone], className)}>
      <div className={cn("px-1 text-xs font-semibold tracking-wide uppercase", ZONE_LABEL_TINT[zone])}>
        {label}
      </div>
      {children}
    </div>
  )
}

// closestCorners alone picks the droppable whose CORNERS are numerically
// nearest the dragged item's corners — not "which box is my cursor actually
// over." That's badly misleading when containers vary a lot in size (a
// small note card vs. the large free-form area): dropping visually inside a
// big container can still resolve to a smaller, geometrically "cornered-
// closer" section instead. This falls back through three strategies, same
// pattern as dnd-kit's own multi-container reference example: prefer
// wherever the pointer literally is, then any real rect overlap, only
// falling back to corner-distance as a last resort near container edges.
function collisionDetectionStrategy(args) {
  const pointerCollisions = pointerWithin(args)
  if (pointerCollisions.length > 0) return pointerCollisions

  const intersections = rectIntersection(args)
  if (intersections.length > 0) return intersections

  return closestCorners(args)
}

// The actual Osterwalder BMC grid, not a generic responsive layout: Key
// Partners spans the full left column; Key Activities/Key Resources stack in
// the next column; Value Propositions is centered and full-height; Customer
// Relationships/Channels stack; Customer Segments spans the right column —
// nested inside their Supply-side / Value / Demand-side zones (see Zone
// above). Cost Structure + Revenue Streams are a separate full-width 50/50
// band below as their own Financial-check zone, independent of the top
// grid's column boundaries, matching the real canvas.

export default function BoardCanvas({
  sections,
  freeformKey,
  notes,
  readOnly,
  highlightedSections,
  cursorLayerRef,
  containerRef,
}) {
  const [notesBySection, setNotesBySection] = React.useState(() => groupBySection(notes, sections, freeformKey))
  const [activeNote, setActiveNote] = React.useState(null)
  const draggingRef = React.useRef(false)

  // Props are the source of truth on every server round-trip (initial load,
  // broadcasts) — but not WHILE a drag is in progress, which would fight the
  // live local reordering preview mid-drag.
  React.useEffect(() => {
    if (!draggingRef.current) {
      setNotesBySection(groupBySection(notes, sections, freeformKey))
    }
  }, [notes, sections, freeformKey])

  function containerOf(id) {
    if (id in notesBySection) return id
    return Object.keys(notesBySection).find((key) => notesBySection[key].some((n) => n.id === id))
  }

  function handleDragStart(event) {
    draggingRef.current = true
    const container = containerOf(event.active.id)
    setActiveNote(notesBySection[container]?.find((n) => n.id === event.active.id) ?? null)
  }

  function handleDragOver(event) {
    const { active, over } = event
    if (!over) return

    const activeContainer = containerOf(active.id)
    const overContainer = containerOf(over.id)
    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    setNotesBySection((prev) => {
      const activeItems = prev[activeContainer]
      const overItems = prev[overContainer]
      const activeIndex = activeItems.findIndex((n) => n.id === active.id)
      const overIndex = overItems.findIndex((n) => n.id === over.id)

      const newIndex = overIndex >= 0 ? overIndex : overItems.length

      return {
        ...prev,
        [activeContainer]: activeItems.filter((n) => n.id !== active.id),
        [overContainer]: [
          ...overItems.slice(0, newIndex),
          activeItems[activeIndex],
          ...overItems.slice(newIndex),
        ],
      }
    })
  }

  function handleDragEnd(event) {
    draggingRef.current = false
    setActiveNote(null)

    const { active, over } = event
    if (!over) return

    const activeContainer = containerOf(active.id)
    const overContainer = containerOf(over.id)
    if (!activeContainer || !overContainer) return

    let finalState = notesBySection

    if (activeContainer === overContainer && active.id !== over.id) {
      const items = notesBySection[activeContainer]
      const oldIndex = items.findIndex((n) => n.id === active.id)
      const newIndex = items.findIndex((n) => n.id === over.id)
      finalState = { ...notesBySection, [activeContainer]: arrayMove(items, oldIndex, newIndex) }
      setNotesBySection(finalState)
    }

    // Only the section(s) that actually changed need to be sent — usually
    // one, or two for a cross-section move (source empties out, destination
    // gains the note).
    const changedSections =
      activeContainer === overContainer ? [activeContainer] : [activeContainer, overContainer]

    const payload = {}
    for (const key of changedSections) {
      payload[key] = finalState[key].map((n) => n.id)
    }

    router.post(
      route("notes.reorder"),
      { sections: payload },
      { preserveScroll: true, preserveState: true },
    )
  }

  function stack(key, extraClassName) {
    return (
      <SectionStack
        sectionKey={key}
        section={sections[key]}
        notes={notesBySection[key] ?? []}
        readOnly={readOnly}
        highlighted={highlightedSections?.has(key)}
        className={extraClassName}
      />
    )
  }

  return (
    <DndContext
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div ref={containerRef} className="relative flex flex-1 flex-col gap-3 overflow-auto p-4">
        {/* 2:1:2 — matches the original 5-column canvas (2 cols supply, 1
            col value, 2 cols demand), not an arbitrary ratio. */}
        <div className="grid flex-1 grid-cols-1 items-stretch gap-3 lg:grid-cols-[2fr_1fr_2fr]">
          <Zone label="Supply-side" zone="supply">
            <div className="grid h-full grid-cols-2 gap-3">
              {stack("key_partners", "h-full")}
              <div className="flex flex-col gap-3">
                {stack("key_activities")}
                {stack("key_resources")}
              </div>
            </div>
          </Zone>

          <Zone label="Value" zone="value">{stack("value_propositions", "h-full")}</Zone>

          <Zone label="Demand-side" zone="demand">
            <div className="grid h-full grid-cols-2 gap-3">
              <div className="flex flex-col gap-3">
                {stack("customer_relationships")}
                {stack("channels")}
              </div>
              {stack("customer_segments", "h-full")}
            </div>
          </Zone>
        </div>

        {/* Cost Structure / Revenue Streams — a separate full-width 50/50
            band, matching the real canvas rather than continuing the top
            grid's column boundaries. */}
        <Zone label="Financial check" zone="financial">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {stack("cost_structure")}
            {stack("revenue_streams")}
          </div>
        </Zone>

        {/* Excluded from the printed artifact — Print only ever includes the
            9 BMC sections, per the requirement. */}
        <div className="print:hidden">
          <SectionStack
            sectionKey={freeformKey}
            section={null}
            notes={notesBySection[freeformKey] ?? []}
            readOnly={readOnly}
            highlighted={highlightedSections?.has(freeformKey)}
            isFreeform
          />
        </div>

        {/* Cursor DOM nodes are appended here directly by useCursorBroadcast,
            bypassing React state — see that hook's comment for why. */}
        <div ref={cursorLayerRef} className="pointer-events-none absolute inset-0 z-40 print:hidden" />
      </div>

      {/* Floats above every section while dragging, decoupled from any
          section's own stacking context — this is what makes a note visibly
          liftable and movable into the free-form area or any other section. */}
      <DragOverlay>
        {activeNote && (
          <div
            className="flex w-64 items-start gap-2 rounded-md p-2 text-xs shadow-xl"
            style={{ backgroundColor: activeNote.color, color: "#fff" }}
          >
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 truncate text-[10px] font-semibold opacity-80">
                {activeNote.author_name}
              </div>
              <div className="break-words">{activeNote.body}</div>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

function groupBySection(notes, sections, freeformKey) {
  const grouped = Object.fromEntries([...Object.keys(sections), freeformKey].map((key) => [key, []]))
  for (const note of notes) {
    if (!grouped[note.section]) grouped[note.section] = []
    grouped[note.section].push(note)
  }
  return grouped
}
