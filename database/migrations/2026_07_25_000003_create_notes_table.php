<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_id')->constrained()->cascadeOnDelete();
            // One of the 9 config('bmc.sections') keys, or 'freeform'.
            $table->string('section');
            $table->text('body')->default('');
            // Snapshots taken at creation time — deliberately NOT re-derived
            // from the live participant, so a note keeps its author's color
            // permanently even after that participant disconnects and their
            // color is later reassigned to someone else.
            $table->string('color');
            $table->string('author_name');
            $table->foreignId('participant_id')->nullable()->constrained()->nullOnDelete();
            $table->float('pos_x')->default(0);
            $table->float('pos_y')->default(0);
            $table->timestamps();

            $table->index(['board_id', 'section']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notes');
    }
};
