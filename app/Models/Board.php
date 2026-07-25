<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Board extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'uuid',
        'is_started',
        'started_at',
        'pin',
        'is_locked',
        'locked_at',
        'schema_version',
    ];

    protected $casts = [
        'is_started' => 'boolean',
        'started_at' => 'datetime',
        'is_locked' => 'boolean',
        'locked_at' => 'datetime',
        'schema_version' => 'integer',
    ];

    public function uniqueIds(): array
    {
        return ['uuid'];
    }

    /**
     * v1 runs a single board per process (one facilitator laptop, one live
     * session at a time) — this is the one seam a later hosted multi-board
     * version would replace (e.g. resolving by route slug instead), without
     * touching the rest of the schema, which is already board_id-scoped.
     */
    public static function current(): self
    {
        return static::query()->firstOrCreate([]);
    }

    public function participants(): HasMany
    {
        return $this->hasMany(Participant::class);
    }

    public function connectedParticipants(): HasMany
    {
        return $this->participants()->where('is_connected', true);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(Note::class);
    }
}
