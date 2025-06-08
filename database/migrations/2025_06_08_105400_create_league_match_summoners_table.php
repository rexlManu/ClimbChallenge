<?php

use App\Models\LeagueMatch;
use App\Models\Summoner;
use App\Models\SummonerTrack;
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
        Schema::create('league_match_summoners', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(LeagueMatch::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(SummonerTrack::class)->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('league_match_summoners');
    }
};
