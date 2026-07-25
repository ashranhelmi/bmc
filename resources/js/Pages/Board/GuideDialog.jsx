import { HelpCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const ACTIONS = [
  { title: "Join with a PIN", body: "Anyone on the same WiFi can view with the PIN shown on the host's Share screen. Viewing never requires a name — only editing does." },
  { title: "Join to edit", body: "Enter a name and pick a cursor color from the corner card. This is what lets you add and move notes; viewing alone doesn't need it." },
  { title: "Add a note", body: "Click \"Add note\" in any section. It's added to the end of that section's list, in your own cursor color." },
  { title: "Reorder or move a note", body: "Drag a note up/down to reorder it within a section, or drag it into a different section — including the free-form area — to move it there. It floats above everything while you drag it." },
  { title: "Expand / collapse a section", body: "Sections start collapsed into a numbered stack once they hold a note. Click the note count to expand and see the full list, click again to collapse." },
  { title: "Lock (host only)", body: "Freezes all editing for everyone — do this before printing or wrapping up. It's reversible: unlock again if something needs fixing." },
  { title: "Export", body: "Anyone can save the current board as a JSON file — the app itself doesn't keep a permanent record once the session ends, so this is how you keep one." },
  { title: "Import (host only)", body: "Restores a previously exported board exactly as it was — including whether it was locked — for everyone connected." },
  { title: "Print", body: "Only available once the board is locked. Prints the 9 BMC sections on A4 landscape; the free-form area is left out of the printed page." },
  { title: "See an example", body: "Shows a fully-filled example board in place of the real one, so you can see what good responses look like before you start." },
]

export default function GuideDialog({ sections }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="guide-open">
          <HelpCircleIcon /> Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Guide</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 text-sm">
          <section>
            <h3 className="mb-2 font-semibold">How this works</h3>
            <dl className="flex flex-col gap-3">
              {ACTIONS.map((action) => (
                <div key={action.title}>
                  <dt className="font-medium">{action.title}</dt>
                  <dd className="text-muted-foreground">{action.body}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h3 className="mb-2 font-semibold">The Business Model Canvas</h3>
            <p className="mb-3 text-muted-foreground">
              The canvas breaks a business into 9 building blocks. Value Proposition sits at the
              center — every other block exists to support it: who you serve, how you reach and
              relate to them, what it takes to deliver, and what that costs versus what it earns.
            </p>
            <dl className="flex flex-col gap-3">
              {Object.values(sections).map((section) => (
                <div key={section.label}>
                  <dt className="font-medium">{section.label}</dt>
                  <dd className="text-muted-foreground">{section.question}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
