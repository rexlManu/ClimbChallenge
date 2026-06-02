<?php

use App\Services\Riot\LeagueEntryDto;
use App\Services\Riot\QueueType;

test('league entry dto accepts entries without a league id', function () {
    $entry = LeagueEntryDto::fromArray([
        'puuid' => 'test-puuid',
        'queueType' => 'RANKED_SOLO_5x5',
        'tier' => 'GOLD',
        'rank' => 'IV',
        'leaguePoints' => 42,
        'wins' => 10,
        'losses' => 5,
        'hotStreak' => false,
        'veteran' => false,
        'freshBlood' => false,
        'inactive' => false,
    ]);

    expect($entry->leagueId)->toBeNull()
        ->and($entry->queueType)->toBe(QueueType::RANKED_SOLO_5x5)
        ->and($entry->leaguePoints)->toBe(42);
});

test('league entry dto keeps league id when Riot includes it', function () {
    $entry = LeagueEntryDto::fromArray([
        'leagueId' => 'test-league',
        'puuid' => 'test-puuid',
        'queueType' => 'RANKED_FLEX_SR',
        'tier' => 'SILVER',
        'rank' => 'I',
        'leaguePoints' => 12,
        'wins' => 8,
        'losses' => 7,
        'hotStreak' => true,
        'veteran' => false,
        'freshBlood' => true,
        'inactive' => false,
    ]);

    expect($entry->leagueId)->toBe('test-league')
        ->and($entry->queueType)->toBe(QueueType::RANKED_FLEX_SR)
        ->and($entry->hotStreak)->toBeTrue();
});
