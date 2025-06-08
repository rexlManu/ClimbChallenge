<?php

namespace App\Services\Riot\Match;

class PerksDto
{
    public function __construct(
        public PerkStatsDto $statPerks,
        /** @var array<PerkStyleDto> */
        public array $styles
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            statPerks: PerkStatsDto::fromArray($data['statPerks']),
            styles: array_map(fn($s) => PerkStyleDto::fromArray($s), $data['styles'])
        );
    }
}
