<?php

namespace App\Services\Riot\Match;

class BanDto
{
    public function __construct(
        public int $championId,
        public int $pickTurn
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            championId: $data['championId'] ?? 0,
            pickTurn: $data['pickTurn'] ?? 0
        );
    }
}
