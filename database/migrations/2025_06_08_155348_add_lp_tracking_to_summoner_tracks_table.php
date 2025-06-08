<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('summoner_tracks', function (Blueprint $table) {
            $table->integer('lp_change')->nullable()->after('league_points');
            $table->enum('lp_change_type', ['gain', 'loss', 'no_change'])->nullable()->after('lp_change');
            $table->enum('lp_change_reason', ['match_win', 'match_loss', 'dodge', 'decay', 'unknown'])->nullable()->after('lp_change_type');
            $table->boolean('is_dodge')->default(false)->after('lp_change_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('summoner_tracks', function (Blueprint $table) {
            $table->dropColumn(['lp_change', 'lp_change_type', 'lp_change_reason', 'is_dodge']);
        });
    }
};
