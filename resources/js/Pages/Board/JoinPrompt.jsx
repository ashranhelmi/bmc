import * as React from "react"
import { useForm } from "@inertiajs/react"
import { PencilIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// A corner card, never a full-screen blocking modal — a viewer who hasn't
// joined must still be able to freely interact with the board (expand
// sections, scroll, read notes). Only EDITING is gated behind joining, so
// the invitation to join can't itself block viewing.
export default function JoinPrompt({ participantColors, takenColors = [] }) {
  const [open, setOpen] = React.useState(false)
  const { data, setData, post, processing, errors } = useForm({
    display_name: "",
    color: "",
  })

  function submit(e) {
    e.preventDefault()
    post(route("participants.store"))
  }

  if (!open) {
    return (
      <Button
        className="fixed right-4 bottom-4 z-40 shadow-lg"
        onClick={() => setOpen(true)}
        data-testid="join-open"
      >
        <PencilIcon /> Join to edit
      </Button>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="fixed right-4 bottom-4 z-40 flex w-full max-w-sm flex-col gap-4 rounded-lg border bg-card p-6 shadow-lg"
    >
      <div>
        <h2 className="text-lg font-semibold">Join to edit</h2>
        <p className="text-sm text-muted-foreground">You can keep viewing without joining.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="display_name">Your name</Label>
        <Input
          id="display_name"
          autoFocus
          maxLength={40}
          value={data.display_name}
          onChange={(e) => setData("display_name", e.target.value)}
          data-testid="join-name"
        />
        {errors.display_name && <p className="text-sm text-destructive">{errors.display_name}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Cursor color</Label>
        <div className="flex flex-wrap gap-2">
          {participantColors.map((color) => {
            const isTaken = takenColors.includes(color)
            return (
              <button
                type="button"
                key={color}
                disabled={isTaken}
                onClick={() => setData("color", color)}
                title={isTaken ? "Already taken" : color}
                data-testid={`color-swatch-${color}`}
                className={cn(
                  "size-8 rounded-full ring-offset-2 transition disabled:cursor-not-allowed disabled:opacity-25",
                  data.color === color && "ring-2 ring-ring",
                )}
                style={{ backgroundColor: color }}
              />
            )
          })}
        </div>
        {errors.color && <p className="text-sm text-destructive">{errors.color}</p>}
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={processing || !data.display_name || !data.color}
          data-testid="join-submit"
        >
          Join board
        </Button>
      </div>
    </form>
  )
}
