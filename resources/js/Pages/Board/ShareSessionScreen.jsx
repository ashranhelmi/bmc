import * as React from "react"
import { useForm } from "@inertiajs/react"
import QRCode from "qrcode"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function ShareSessionScreen({ pin, lanUrl, onContinue }) {
  const canvasRef = React.useRef(null)
  const { post, processing } = useForm()
  // Server-detected LAN IP is preferred — correct regardless of how the host
  // themselves opened this page (even plain localhost). Only falls back to
  // window.location when detection genuinely failed (see LanAddress::detect).
  const shareUrl = lanUrl ?? window.location.origin
  const detectionFailed = !lanUrl

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

      {detectionFailed && (
        <Card className="max-w-md border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4 text-sm text-destructive">
            Couldn't detect this laptop's LAN IP automatically. Make sure you opened this page using
            your laptop's LAN IP (e.g. <code>http://192.168.x.x:8000</code>), not{" "}
            <code>localhost</code>, before sharing — other devices can't reach that address.
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
