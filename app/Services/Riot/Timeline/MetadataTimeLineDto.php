<?php

namespace App\Services\Riot\Timeline;

class MetadataTimeLineDto
{
    public function __construct(
        public string $dataVersion,
        public string $matchId,
        /** @var array<string> */
        public array $participants
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            dataVersion: $data['dataVersion'],
            matchId: $data['matchId'],
            participants: $data['participants']
        );
    }
}
