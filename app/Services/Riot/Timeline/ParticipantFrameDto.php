<?php

namespace App\Services\Riot\Timeline;

class ParticipantFrameDto
{
    public function __construct(
        public ChampionStatsDto $championStats,
        public int $currentGold,
        public DamageStatsDto $damageStats,
        public int $goldPerSecond,
        public int $jungleMinionsKilled,
        public int $level,
        public int $minionsKilled,
        public int $participantId,
        public PositionDto $position,
        public int $timeEnemySpentControlled,
        public int $totalGold,
        public int $xp
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            championStats: ChampionStatsDto::fromArray($data['championStats']),
            currentGold: $data['currentGold'],
            damageStats: DamageStatsDto::fromArray($data['damageStats']),
            goldPerSecond: $data['goldPerSecond'],
            jungleMinionsKilled: $data['jungleMinionsKilled'],
            level: $data['level'],
            minionsKilled: $data['minionsKilled'],
            participantId: $data['participantId'],
            position: PositionDto::fromArray($data['position']),
            timeEnemySpentControlled: $data['timeEnemySpentControlled'],
            totalGold: $data['totalGold'],
            xp: $data['xp']
        );
    }
}
