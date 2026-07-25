<?php

namespace App\Events;

use App\Models\Board;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class BoardStarted implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(public Board $board) {}

    public function broadcastOn(): array
    {
        return [new Channel('board.'.$this->board->id)];
    }

    public function broadcastAs(): string
    {
        return 'board.started';
    }
}
