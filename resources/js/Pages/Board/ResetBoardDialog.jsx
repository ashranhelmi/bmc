import * as React from "react"
import { useForm } from "@inertiajs/react"
import { RotateCcwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Distinct from Lock: Lock freezes content for review/print within the SAME
// session, this wipes everything for a genuinely NEW one. Deliberately
// behind its own confirmation step (unlike Lock/Unlock, which are
// reversible) since notes are gone for good once this is confirmed.
export default function ResetBoardDialog() {
  const [open, setOpen] = React.useState(false)
  const { post, processing } = useForm()

  function confirm() {
    post(route("board.reset"))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="reset-board-open">
          <RotateCcwIcon /> Reset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset this board?</DialogTitle>
          <DialogDescription>
            This permanently deletes every note and every participant, for everyone connected — not
            just a lock/unlock, there's no undo. Use this to start a brand-new workshop on a clean
            board, not to fix a mistake mid-session.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={processing}
            onClick={confirm}
            data-testid="reset-board-confirm"
          >
            <RotateCcwIcon /> Reset everything
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
