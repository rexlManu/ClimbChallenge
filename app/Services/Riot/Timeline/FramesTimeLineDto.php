<?php

namespace App\Services\Riot\Timeline;

class FramesTimeLineDto
{
    public function __construct(
        /** @var array<EventsTimeLineDto> */
        public array $events,
        public ParticipantFramesDto $participantFrames,
        public int $timestamp
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            events: array_map(fn($e) => EventsTimeLineDto::fromArray($e), $data['events'] ?? []),
            participantFrames: ParticipantFramesDto::fromArray($data['participantFrames']),
            timestamp: $data['timestamp']
        );
    }
}
