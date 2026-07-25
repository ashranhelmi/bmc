<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

/**
 * Carries every note that changed section/sort_order in ONE reorder
 * operation — broadcast once per drag, not once per note, so reordering a
 * 10-note section doesn't fire 10 separate broadcasts.
 */
class NotesReordered implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(public Collection $notes, public int $boardId) {}

    public function broadcastOn(): array
    {
        return [new Channel('board.'.$this->boardId)];
    }

    public function broadcastAs(): string
    {
        return 'notes.reordered';
    }

    public function broadcastWith(): array
    {
        return ['notes' => $this->notes->values()];
    }
}
