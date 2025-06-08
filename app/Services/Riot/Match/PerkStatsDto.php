<?php

namespace App\Services\Riot\Match;

class PerkStatsDto
{
    public function __construct(
        public int $defense,
        public int $flex,
        public int $offense
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            defense: $data['defense'] ?? 0,
            flex: $data['flex'] ?? 0,
            offense: $data['offense'] ?? 0
        );
    }
}
