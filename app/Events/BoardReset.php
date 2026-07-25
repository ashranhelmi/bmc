<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast BEFORE the board row is actually deleted — by the time
 * connected clients react to this, the record it targeted may already be
 * gone, so this only ever carries the id needed to address the channel,
 * never the model itself.
 */
class BoardReset implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(public string $boardId) {}

    public function broadcastOn(): array
    {
        return [new Channel('board.'.$this->boardId)];
    }

    public function broadcastAs(): string
    {
        return 'board.reset';
    }
}
