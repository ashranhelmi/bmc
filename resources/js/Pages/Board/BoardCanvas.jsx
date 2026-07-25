import * as React from "react"
import { DndContext } from "@dnd-kit/core"
import { router } from "@inertiajs/react"
import SectionStack from "./SectionStack"

// Classic Osterwalder layout, simplified to a responsive grid rather than
// pixel-exact placement: 7 operational blocks on top, the 2-block financial
// row (Cost Structure + Revenue Streams) below them — see config/bmc.php's
// comment on why Cost Structure gets a neutral color instead of a 9th hue.
export default function BoardCanvas({ sections, freeformKey, notes, readOnly, cursorLayerRef, containerRef }) {
  function handleDragEnd(event) {
    const { active, over } = event
    if (!over) return

    const note = active.data.current?.note
    const activeRect = active.rect.current.translated
    if (!note || !activeRect) return

    const overRect = over.rect
    const centerX = activeRect.left + activeRect.width / 2
    const centerY = activeRect.top + activeRect.height / 2

    const pos_x = clamp(((centerX - overRect.left) / overRect.width) * 100)
    const pos_y = clamp(((centerY - overRect.top) / overRect.height) * 100)

    const payload = { pos_x, pos_y }
    if (over.id !== note.section) payload.section = over.id

    router.patch(route("notes.update-position", note.id), payload, {
      preserveScroll: true,
      preserveState: true,
    })
  }

  const bySection = (key) => notes.filter((n) => n.section === key)
  // Two-row layout matching the classic BMC shape: partners/activities/
  // resources down the left, value prop center, relationships/channels
  // right, customer segments far right, cost/revenue along the bottom.
  const topRow = ["key_partners", "key_activities", "key_resources", "value_propositions"]
  const rightCol = ["customer_relationships", "channels", "customer_segments"]
  const bottomRow = ["cost_structure", "revenue_streams"]

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div ref={containerRef} className="relative flex flex-1 flex-col gap-3 overflow-auto p-4">
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-4">
          <div className="grid grid-cols-1 gap-3 md:col-span-1">
            {["key_partners", "key_activities", "key_resources"].map((key) => (
              <SectionStack
                key={key}
                sectionKey={key}
                section={sections[key]}
                notes={bySection(key)}
                readOnly={readOnly}
              />
            ))}
          </div>
          <div className="md:col-span-1">
            <SectionStack
              sectionKey="value_propositions"
              section={sections.value_propositions}
              notes={bySection("value_propositions")}
              readOnly={readOnly}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:col-span-2">
            {rightCol.map((key) => (
              <SectionStack
                key={key}
                sectionKey={key}
                section={sections[key]}
                notes={bySection(key)}
                readOnly={readOnly}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {bottomRow.map((key) => (
            <SectionStack
              key={key}
              sectionKey={key}
              section={sections[key]}
              notes={bySection(key)}
              readOnly={readOnly}
            />
          ))}
        </div>

        {/* Excluded from the printed artifact — Print only ever includes the
            9 BMC sections, per the requirement. */}
        <div className="print:hidden">
          <SectionStack
            sectionKey={freeformKey}
            section={null}
            notes={bySection(freeformKey)}
            readOnly={readOnly}
            isFreeform
          />
        </div>

        {/* Cursor DOM nodes are appended here directly by useCursorBroadcast,
            bypassing React state — see that hook's comment for why. */}
        <div ref={cursorLayerRef} className="pointer-events-none absolute inset-0 z-40 print:hidden" />
      </div>
    </DndContext>
  )
}

function clamp(n) {
  return Math.min(100, Math.max(0, n))
}
