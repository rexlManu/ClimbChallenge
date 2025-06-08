<?php

use App\Models\Participant;
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
        Schema::create('summoners', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Participant::class)->constrained()->unique();
            $table->string('account_id');
            $table->integer('level');
            $table->string('profile_icon_id');
            $table->string('current_tier');
            $table->string('current_rank');
            $table->integer('current_league_points');
            $table->integer('current_wins');
            $table->integer('current_losses');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('summoners');
    }
};
