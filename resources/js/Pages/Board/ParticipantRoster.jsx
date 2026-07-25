// A compact row of name+color pills — shared by the live board header (fed
// the real presence roster) and the example view's banner (fed a static
// roster derived from the fixture data), so the example teaches this UI too.
export default function ParticipantRoster({ participants }) {
  if (!participants || participants.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1" data-testid="participant-roster">
      {participants.map((p) => (
        <span
          key={p.id}
          className="rounded px-2 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: p.color }}
        >
          {p.displayName}
        </span>
      ))}
    </div>
  )
}
