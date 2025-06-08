<?php

namespace App\Services\Riot\Match;

class TeamDto
{
    public function __construct(
        /** @var array<BanDto> */
        public array $bans,
        public ObjectivesDto $objectives,
        public int $teamId,
        public bool $win
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            bans: array_map(fn($b) => BanDto::fromArray($b), $data['bans'] ?? []),
            objectives: ObjectivesDto::fromArray($data['objectives']),
            teamId: $data['teamId'] ?? 0,
            win: $data['win'] ?? false
        );
    }
}
