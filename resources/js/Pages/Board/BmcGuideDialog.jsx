import { LayoutGridIcon, ArrowRightIcon, ArrowDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { ZONE_TINT, ABBR } from "@/lib/bmcZones"

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

// Each box in the diagram IS the explanation — click it to see what that
// block means, instead of a separate written list underneath the diagram
// that just meant scrolling down past it and back up again.
function FlowBox({ sectionKey, section, className }) {
  const zone = sectionKey === "value_propositions" ? "value"
    : ["key_partners", "key_activities", "key_resources"].includes(sectionKey) ? "supply"
    : ["cost_structure", "revenue_streams"].includes(sectionKey) ? "financial"
    : "demand"

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "rounded-md px-2.5 py-1.5 text-center text-xs font-bold transition hover:brightness-95",
          ZONE_TINT[zone],
          className,
        )}
      >
        {ABBR[sectionKey]}
      </PopoverTrigger>
      <PopoverContent className="w-72 text-sm">
        <div className="mb-1 font-semibold">{section.label}</div>
        <p className="text-muted-foreground">{section.question}</p>
        {DEEPER[sectionKey] && <p className="mt-2 text-muted-foreground">{DEEPER[sectionKey]}</p>}
      </PopoverContent>
    </Popover>
  )
}

export default function BmcGuideDialog({ sections }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="bmc-guide-open">
          <LayoutGridIcon /> Business Model Canvas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>The Business Model Canvas</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm">
          <p className="text-muted-foreground">
            The canvas breaks a business into 9 connected blocks, not 9 independent lists. The
            real value of filling it out isn't the individual answers — it's checking whether they
            actually connect: does every Value Proposition have a Customer Segment that wants it, a
            Channel that reaches them, and a Cost that's covered by real Revenue? Click any block
            below to see what it's for.
          </p>

          <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/30 p-4">
            <div className="flex flex-nowrap items-center justify-center gap-2 overflow-x-auto">
              <div className="flex flex-col gap-1">
                <FlowBox sectionKey="key_partners" section={sections.key_partners} />
                <FlowBox sectionKey="key_activities" section={sections.key_activities} />
                <FlowBox sectionKey="key_resources" section={sections.key_resources} />
              </div>
              <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
              <FlowBox
                sectionKey="value_propositions"
                section={sections.value_propositions}
                className="px-4 py-6"
              />
              <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <FlowBox sectionKey="customer_relationships" section={sections.customer_relationships} />
                <FlowBox sectionKey="channels" section={sections.channels} />
              </div>
              <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
              <FlowBox sectionKey="customer_segments" section={sections.customer_segments} className="px-4 py-6" />
            </div>

            <ArrowDownIcon className="size-4 text-muted-foreground" />

            <div className="flex items-center gap-3">
              <FlowBox sectionKey="cost_structure" section={sections.cost_structure} />
              <span className="text-xs text-muted-foreground">funds the left side, paid for by</span>
              <FlowBox sectionKey="revenue_streams" section={sections.revenue_streams} />
            </div>
            <p className="max-w-md text-center text-xs text-muted-foreground">
              If Cost Structure is bigger than Revenue Streams can realistically cover, the model
              doesn't work yet — regardless of how good any individual block looks alone.
            </p>

            <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
              {Object.entries(sections).map(([key, section]) => (
                <span key={key}>
                  <span className="font-semibold">{ABBR[key]}</span> = {section.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
