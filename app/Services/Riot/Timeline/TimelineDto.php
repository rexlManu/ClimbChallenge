<?php

namespace App\Services\Riot\Timeline;

class TimelineDto
{
    public function __construct(
        public MetadataTimeLineDto $metadata,
        public InfoTimeLineDto $info
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            metadata: MetadataTimeLineDto::fromArray($data['metadata']),
            info: InfoTimeLineDto::fromArray($data['info'])
        );
    }
}
