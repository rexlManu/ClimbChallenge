<?php

namespace App\Services\Riot\Timeline;

class PositionDto
{
    public function __construct(
        public int $x,
        public int $y
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            x: $data['x'] ?? 0,
            y: $data['y'] ?? 0
        );
    }
}
