import { BookOpenIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import ExampleCanvas from "./ExampleCanvas"

export default function ExampleCanvasToggle({ sections, freeformKey }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookOpenIcon /> See an example
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Example canvas</DialogTitle>
        </DialogHeader>
        <ExampleCanvas sections={sections} freeformKey={freeformKey} />
      </DialogContent>
    </Dialog>
  )
}
