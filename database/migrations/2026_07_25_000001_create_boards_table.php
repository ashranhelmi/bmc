<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('boards', function (Blueprint $table) {
            $table->id();
            // Stable identity for exported JSON files — decoupled from the DB id
            // so a re-imported board stays portable across a fresh database.
            $table->uuid('uuid')->unique();
            $table->boolean('is_started')->default(false);
            $table->timestamp('started_at')->nullable();
            // Session-join PIN, rotated on every Start — independent of is_locked,
            // which is the board CONTENT's state (see Import behavior).
            $table->string('pin', 6)->nullable();
            $table->boolean('is_locked')->default(false);
            $table->timestamp('locked_at')->nullable();
            $table->unsignedInteger('schema_version')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('boards');
    }
};
