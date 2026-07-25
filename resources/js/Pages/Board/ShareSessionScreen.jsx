import * as React from "react"
import { useForm } from "@inertiajs/react"
import QRCode from "qrcode"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function ShareSessionScreen({ pin, onContinue }) {
  const canvasRef = React.useRef(null)
  const { post, processing } = useForm()
  const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  const shareUrl = window.location.origin

  React.useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, shareUrl, { width: 200, margin: 1 })
    }
  }, [shareUrl])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Share this session</h1>
        <p className="mt-1 text-muted-foreground">
          Anyone on this WiFi can scan the code or enter the PIN below to join.
        </p>
      </div>

      {isLocalhost && (
        <Card className="max-w-md border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4 text-sm text-destructive">
            This page loaded at <code>localhost</code> — other devices can't reach that address.
            Reopen this page using your laptop's LAN IP (e.g. <code>http://192.168.x.x:8000</code>)
            before sharing.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <canvas ref={canvasRef} />
          <div className="text-sm text-muted-foreground break-all">{shareUrl}</div>
          <div>
            <div className="text-xs tracking-wide text-muted-foreground uppercase">PIN</div>
            <div className="text-4xl font-bold tracking-widest tabular-nums" data-testid="session-pin">
              {pin}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" disabled={processing} onClick={() => post(route("board.start"))}>
          Regenerate PIN
        </Button>
        <Button onClick={onContinue} data-testid="continue-to-board">Continue to board</Button>
      </div>
    </div>
  )
}
