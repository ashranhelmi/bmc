<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Note extends Model
{
    use HasFactory;

    protected $fillable = [
        'board_id',
        'section',
        'body',
        'color',
        'author_name',
        'participant_id',
        'pos_x',
        'pos_y',
    ];

    protected $casts = [
        'pos_x' => 'float',
        'pos_y' => 'float',
    ];

    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    public function participant(): BelongsTo
    {
        return $this->belongsTo(Participant::class);
    }
}
