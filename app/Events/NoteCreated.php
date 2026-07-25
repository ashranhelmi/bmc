<?php

namespace App\Events;

use App\Models\Note;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast synchronously (ShouldBroadcastNow, not ShouldBroadcast) — there's
 * no guaranteed queue worker running at a live venue on the facilitator's
 * laptop, so queuing broadcast jobs would silently break realtime sync.
 */
class NoteCreated implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(public Note $note) {}

    public function broadcastOn(): array
    {
        return [new Channel('board.'.$this->note->board_id)];
    }

    public function broadcastAs(): string
    {
        return 'note.created';
    }

    public function broadcastWith(): array
    {
        return ['note' => $this->note];
    }
}
