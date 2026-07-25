<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Optional "who owns this" tag, deliberately separate from
        // author_name/color — those record who TYPED the note during the
        // live session, not who's responsible for executing it. Free text,
        // not a participant reference, so it stays meaningful even after
        // the session ends or names people who were never connected at all.
        Schema::table('notes', function (Blueprint $table) {
            $table->string('pic')->nullable()->after('author_name');
        });
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropColumn('pic');
        });
    }
};
