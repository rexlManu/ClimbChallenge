<?php

namespace App\Services\Riot\Match;

class MatchDto
{
    public function __construct(
        public MetadataDto $metadata,
        public InfoDto $info
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            metadata: MetadataDto::fromArray($data['metadata']),
            info: InfoDto::fromArray($data['info'])
        );
    }
}
