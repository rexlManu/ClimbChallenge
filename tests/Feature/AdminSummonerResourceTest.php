<?php

use App\Models\Participant;
use App\Models\Summoner;
use App\Models\User;

test('authenticated users can visit the summoner edit page', function () {
    $this->actingAs(User::factory()->create());

    $participant = Participant::create([
        'display_name' => 'Test Player',
        'gameName' => 'Test',
        'tagLine' => 'EUW',
        'puuid' => 'test-puuid',
    ]);

    $summoner = Summoner::create([
        'participant_id' => $participant->id,
        'account_id' => 'test-account',
        'level' => 100,
        'profile_icon_id' => 1,
        'current_tier' => 'GOLD',
        'current_rank' => 'IV',
        'current_league_points' => 42,
        'current_wins' => 10,
        'current_losses' => 5,
        'peak_tier' => 'GOLD',
        'peak_rank' => 'IV',
        'peak_league_points' => 42,
        'exclude_from_dashboard' => false,
    ]);

    $this->get(route('filament.admin.resources.summoners.edit', $summoner))
        ->assertOk();
});
