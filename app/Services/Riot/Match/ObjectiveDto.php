<?php

namespace App\Services\Riot\Match;

class ObjectiveDto
{
    public function __construct(
        public bool $first,
        public int $kills
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            first: $data['first'] ?? false,
            kills: $data['kills'] ?? 0
        );
    }
}
