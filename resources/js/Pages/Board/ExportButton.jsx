import { DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

// Available to any participant, not host-restricted — a harmless, read-only
// action. Fetches the canonical export straight from the server (not
// assembled from possibly-stale local client state) then triggers a browser
// download — no client-side library needed for either step.
export default function ExportButton() {
  async function handleExport() {
    const response = await fetch(route("board.export"))
    const payload = await response.json()

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bmc-${payload.board_uuid}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} data-testid="export-button">
      <DownloadIcon /> Export
    </Button>
  )
}
