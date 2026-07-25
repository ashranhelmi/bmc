import { useForm } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function PinGate() {
  const { data, setData, post, processing, errors } = useForm({ pin: "" })

  function submit(e) {
    e.preventDefault()
    post(route("board.verify-pin"))
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-xl font-semibold">Enter the session PIN</h1>
      <form onSubmit={submit} className="flex w-full max-w-xs flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pin">PIN</Label>
          <Input
            id="pin"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            value={data.pin}
            onChange={(e) => setData("pin", e.target.value.replace(/\D/g, ""))}
            className="text-center text-2xl tracking-widest tabular-nums"
            data-testid="pin-input"
          />
          {errors.pin && <p className="text-sm text-destructive">{errors.pin}</p>}
        </div>
        <Button type="submit" disabled={processing || data.pin.length !== 6} data-testid="pin-submit">
          Continue
        </Button>
      </form>
    </div>
  )
}
