<?php

namespace App\Events;

use App\Models\Note;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class NotePicUpdated implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(public Note $note) {}

    public function broadcastOn(): array
    {
        return [new Channel('board.'.$this->note->board_id)];
    }

    public function broadcastAs(): string
    {
        return 'note.pic-updated';
    }

    public function broadcastWith(): array
    {
        return ['note' => $this->note];
    }
}
