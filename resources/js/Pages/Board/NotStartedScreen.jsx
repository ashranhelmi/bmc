import { useForm } from "@inertiajs/react"
import { Button } from "@/components/ui/button"

// Shown to EVERYONE before Start has been clicked — nobody is host yet, so
// whoever clicks this button claims host (see EnsureIsHost's accepted
// obscurity trade-off, requirements.md).
export default function NotStartedScreen() {
  const { post, processing } = useForm()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">BMC</h1>
      <p className="max-w-sm text-muted-foreground">
        This session hasn't started yet. If you're facilitating this workshop, start it below —
        otherwise, wait for the facilitator.
      </p>
      <Button
        size="lg"
        disabled={processing}
        onClick={() => post(route("board.start"))}
        data-testid="start-session"
      >
        Start Session
      </Button>
    </div>
  )
}
