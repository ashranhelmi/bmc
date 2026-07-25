import { LayoutGridIcon, ArrowRightIcon, ArrowDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Deeper "why this matters" context per section, beyond the one-line
// guiding question already shown in the tap-to-reveal tooltips — this is
// what makes this guide actually more detailed, not just a duplicate.
const DEEPER = {
  customer_segments: "Not \"everyone\" — a real segment shares a specific need or behavior. A common mistake here is describing your PRODUCT's features instead of the PEOPLE who'd want them.",
  value_propositions: "This is why a customer picks you over doing nothing, or over a competitor. It should map to a real problem named in Customer Segments — a Value Proposition that doesn't connect to a segment isn't validated yet.",
  channels: "Covers awareness, evaluation, purchase, and delivery — not just \"how do they buy,\" but how they find out you exist in the first place.",
  customer_relationships: "How you acquire, keep, and grow each segment over time — self-service, personal support, community. Distinct from Channels, which is about reaching them, not the ongoing relationship.",
  revenue_streams: "Should trace back to a specific Value Proposition. If a Value Proposition exists with no Revenue Stream funding it, ask whether it's actually a paid offering or a supporting feature that enables something else.",
  key_resources: "Whatever your Value Proposition and Channels genuinely can't function without — physical, intellectual, human, or financial.",
  key_activities: "The things you must do well and repeatedly to actually deliver the Value Proposition — production, problem-solving, or platform upkeep, depending on the business.",
  key_partners: "Partnerships usually exist to reduce risk, get access to a resource you can't build yourself, or hand off something that isn't core to your Value Proposition.",
  cost_structure: "Should be traceable back to specific Key Resources, Activities, or Partnerships above it. A cost with nothing above it to explain it is worth questioning.",
}

const FLOW_BOX = "rounded-md border px-3 py-2 text-center text-xs font-medium"

export default function BmcGuideDialog({ sections }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="bmc-guide-open">
          <LayoutGridIcon /> Business Model Canvas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>The Business Model Canvas</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 text-sm">
          <p className="text-muted-foreground">
            The canvas breaks a business into 9 connected blocks, not 9 independent lists. The
            real value of filling it out isn't the individual answers — it's checking whether they
            actually connect: does every Value Proposition have a Customer Segment that wants it, a
            Channel that reaches them, and a Cost that's covered by real Revenue? An idea that
            doesn't connect to anything else on the canvas is usually one worth questioning, not
            filling in for its own sake.
          </p>

          <div>
            <h3 className="mb-3 font-semibold">How the blocks relate</h3>
            <div className="flex flex-col items-center gap-2 rounded-lg border bg-muted/30 p-4">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="flex flex-col gap-1">
                  <div className={FLOW_BOX}>Key Partners</div>
                  <div className={FLOW_BOX}>Key Activities</div>
                  <div className={FLOW_BOX}>Key Resources</div>
                </div>
                <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className={`${FLOW_BOX} bg-background`}>Value Proposition</div>
                <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col gap-1">
                  <div className={FLOW_BOX}>Customer Relationships</div>
                  <div className={FLOW_BOX}>Channels</div>
                </div>
                <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className={FLOW_BOX}>Customer Segments</div>
              </div>

              <ArrowDownIcon className="size-4 text-muted-foreground" />

              <div className="flex items-center gap-3">
                <div className={FLOW_BOX}>Cost Structure</div>
                <span className="text-xs text-muted-foreground">funds the left side, paid for by</span>
                <div className={FLOW_BOX}>Revenue Streams</div>
              </div>
              <p className="max-w-md text-center text-xs text-muted-foreground">
                If Cost Structure is bigger than Revenue Streams can realistically cover, the model
                doesn't work yet — regardless of how good any individual block looks alone.
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-semibold">Each block</h3>
            <dl className="flex flex-col gap-4">
              {Object.entries(sections).map(([key, section]) => (
                <div key={key}>
                  <dt className="font-medium">{section.label}</dt>
                  <dd className="text-muted-foreground">{section.question}</dd>
                  {DEEPER[key] && <dd className="mt-1 text-muted-foreground">{DEEPER[key]}</dd>}
                </div>
              ))}
            </dl>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
