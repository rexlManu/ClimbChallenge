<?php

namespace App\Services\Riot\Timeline;

class EventsTimeLineDto
{
    public function __construct(
        public int $timestamp,
        public ?int $realTimestamp,
        public string $type
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            timestamp: $data['timestamp'],
            realTimestamp: $data['realTimestamp'] ?? null,
            type: $data['type']
        );
    }
}
