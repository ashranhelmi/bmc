import { InfoIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Tap-to-reveal, not hover — the template's existing tooltip.jsx wraps
// Radix's Tooltip primitive, which is hover/focus-triggered and won't work
// on tablets. Popover is click/tap-triggered on every device, which is what
// this actually needs.
export default function SectionTooltip({ question }) {
  return (
    <Popover>
      <PopoverTrigger
        className="text-muted-foreground hover:text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <InfoIcon className="size-3.5" />
        <span className="sr-only">What goes here?</span>
      </PopoverTrigger>
      <PopoverContent className="w-64 text-sm" onClick={(e) => e.stopPropagation()}>
        {question}
      </PopoverContent>
    </Popover>
  )
}
