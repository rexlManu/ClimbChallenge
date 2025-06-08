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
        Schema::table('summoners', function (Blueprint $table) {
            $table->string('peak_tier')->nullable()->after('current_losses');
            $table->string('peak_rank')->nullable()->after('peak_tier');
            $table->integer('peak_league_points')->nullable()->after('peak_rank');
            $table->timestamp('peak_achieved_at')->nullable()->after('peak_league_points');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('summoners', function (Blueprint $table) {
            $table->dropColumn(['peak_tier', 'peak_rank', 'peak_league_points', 'peak_achieved_at']);
        });
    }
};
