import { PrinterIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

// Only ever rendered by the caller when board.isLocked — see Show.jsx.
export default function PrintButton() {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()}>
      <PrinterIcon /> Print
    </Button>
  )
}
