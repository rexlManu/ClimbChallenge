<?php

namespace App\Services\Riot;

class LeagueEntryDto
{
    public function __construct(
        public string $leagueId,
        public string $summonerId,
        public string $puuid,
        public QueueType $queueType,
        public string $tier,
        public string $rank,
        public int $leaguePoints,
        public int $wins,
        public int $losses,
        public bool $hotStreak,
        public bool $veteran,
        public bool $freshBlood,
        public bool $inactive,
        public ?MiniSeriesDto $miniSeries,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            leagueId: $data['leagueId'],
            summonerId: $data['summonerId'],
            puuid: $data['puuid'],
            queueType: QueueType::from($data['queueType']),
            tier: $data['tier'],
            rank: $data['rank'],
            leaguePoints: $data['leaguePoints'],
            wins: $data['wins'],
            losses: $data['losses'],
            hotStreak: $data['hotStreak'],
            veteran: $data['veteran'],
            freshBlood: $data['freshBlood'],
            inactive: $data['inactive'],
            miniSeries: isset($data['miniSeries']) ? MiniSeriesDto::fromArray($data['miniSeries']) : null,
        );
    }
}
