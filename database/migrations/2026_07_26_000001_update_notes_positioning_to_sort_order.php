<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropColumn(['pos_x', 'pos_y']);
            // A note's position is now "which section, which index within
            // it" (see NoteController::reorder()), not a canvas coordinate —
            // simpler to build reliably than free-position dragging, and a
            // numbered list scans better for reviewing workshop ideas.
            $table->unsignedInteger('sort_order')->default(0)->after('section');
        });
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropColumn('sort_order');
            $table->float('pos_x')->default(0);
            $table->float('pos_y')->default(0);
        });
    }
};
