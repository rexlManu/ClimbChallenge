<?php

namespace App\Services\Riot;

class MiniSeriesDto
{
    public function __construct(
        public int $losses,
        public string $progress,
        public int $target,
        public int $wins,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            losses: $data['losses'],
            progress: $data['progress'],
            target: $data['target'],
            wins: $data['wins'],
        );
    }
}
