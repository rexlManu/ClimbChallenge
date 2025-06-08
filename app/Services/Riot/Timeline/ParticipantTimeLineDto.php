<?php

namespace App\Services\Riot\Timeline;

class ParticipantTimeLineDto
{
    public function __construct(
        public int $participantId,
        public string $puuid
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            participantId: $data['participantId'],
            puuid: $data['puuid']
        );
    }
}
