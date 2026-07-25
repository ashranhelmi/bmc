import { useForm } from "@inertiajs/react"
import { LockIcon, LockOpenIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import ImportDialog from "./ImportDialog"

export default function HostControls({ isLocked }) {
  const { post, processing } = useForm()

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isLocked ? "secondary" : "outline"}
        size="sm"
        disabled={processing}
        onClick={() => post(route(isLocked ? "board.unlock" : "board.lock"))}
        data-testid="lock-toggle"
      >
        {isLocked ? <LockOpenIcon /> : <LockIcon />}
        {isLocked ? "Unlock" : "Lock"}
      </Button>
      <ImportDialog />
    </div>
  )
}
