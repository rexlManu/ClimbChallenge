<?php

namespace App\Services\Riot\Timeline;

class DamageStatsDto
{
    public function __construct(
        public int $magicDamageDone,
        public int $magicDamageDoneToChampions,
        public int $magicDamageTaken,
        public int $physicalDamageDone,
        public int $physicalDamageDoneToChampions,
        public int $physicalDamageTaken,
        public int $totalDamageDone,
        public int $totalDamageDoneToChampions,
        public int $totalDamageTaken,
        public int $trueDamageDone,
        public int $trueDamageDoneToChampions,
        public int $trueDamageTaken
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            magicDamageDone: $data['magicDamageDone'] ?? 0,
            magicDamageDoneToChampions: $data['magicDamageDoneToChampions'] ?? 0,
            magicDamageTaken: $data['magicDamageTaken'] ?? 0,
            physicalDamageDone: $data['physicalDamageDone'] ?? 0,
            physicalDamageDoneToChampions: $data['physicalDamageDoneToChampions'] ?? 0,
            physicalDamageTaken: $data['physicalDamageTaken'] ?? 0,
            totalDamageDone: $data['totalDamageDone'] ?? 0,
            totalDamageDoneToChampions: $data['totalDamageDoneToChampions'] ?? 0,
            totalDamageTaken: $data['totalDamageTaken'] ?? 0,
            trueDamageDone: $data['trueDamageDone'] ?? 0,
            trueDamageDoneToChampions: $data['trueDamageDoneToChampions'] ?? 0,
            trueDamageTaken: $data['trueDamageTaken'] ?? 0
        );
    }
}
