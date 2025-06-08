<?php

use App\Models\Summoner;
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
        Schema::create('summoner_tracks', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Summoner::class)->constrained();
            $table->string('tier');
            $table->string('rank');
            $table->integer('league_points');
            $table->integer('wins');
            $table->integer('losses');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('summoner_tracks');
    }
};
