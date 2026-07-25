<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_id')->constrained()->cascadeOnDelete();
            $table->string('display_name');
            $table->string('color');
            $table->boolean('is_host')->default(false);
            $table->boolean('is_connected')->default(true);
            $table->timestamps();
        });

        // A color can only be held by one CONNECTED participant per board at a
        // time. SQLite/MySQL don't support a plain partial unique index the
        // same way Postgres does, so this is enforced at the query level (see
        // ParticipantController — a transaction + lockForUpdate over connected
        // participants before accepting a claim) rather than a DB constraint,
        // which would otherwise also block a disconnected participant's old
        // (freed) color row from ever being reused.
        Schema::table('participants', function (Blueprint $table) {
            $table->index(['board_id', 'color', 'is_connected']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('participants');
    }
};
