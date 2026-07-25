import * as React from "react"
import { useForm } from "@inertiajs/react"
import { UploadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Host-only — overwrites the live shared board for everyone, unlike Export.
// Relies on the BoardImported broadcast (received by the importer too) to
// refresh every connected client, rather than trusting the local response
// alone.
export default function ImportDialog() {
  const [open, setOpen] = React.useState(false)
  const { data, setData, post, processing, errors, reset } = useForm({ file: null })

  function submit(e) {
    e.preventDefault()
    if (!data.file) return
    post(route("board.import"), {
      forceFormData: true,
      onSuccess: () => {
        reset()
        setOpen(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="import-open">
          <UploadIcon /> Import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import a previously exported board</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            This replaces the current board's notes and lock state for everyone connected — exactly
            as they were at export time.
          </p>
          <input
            type="file"
            accept="application/json"
            onChange={(e) => setData("file", e.target.files?.[0] ?? null)}
            data-testid="import-file-input"
          />
          {errors.file && <p className="text-sm text-destructive">{errors.file}</p>}
          <DialogFooter>
            <Button type="submit" disabled={processing || !data.file} data-testid="import-submit">
              Import
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
