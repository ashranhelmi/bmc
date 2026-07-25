import * as React from "react"
import exampleData from "@/data/exampleCanvas.json"
import BoardCanvas from "./BoardCanvas"

// Rendered through the SAME BoardCanvas/SectionStack/NoteCard components as
// the real board (via readOnly + a static fixture) — deliberately not a
// second rendering path, so this never visually drifts from the real thing.
export default function ExampleCanvas({ sections, freeformKey }) {
  const dummyRef = React.useRef(null)

  return (
    <div className="flex h-[70vh] flex-col">
      <p className="mb-2 text-sm text-muted-foreground">{exampleData.businessName}</p>
      <BoardCanvas
        sections={sections}
        freeformKey={freeformKey}
        notes={exampleData.notes}
        readOnly
        containerRef={dummyRef}
        cursorLayerRef={dummyRef}
      />
    </div>
  )
}
