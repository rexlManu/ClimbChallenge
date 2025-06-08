<?php

namespace App\Services\Riot\Timeline;

class ParticipantFramesDto
{
    public function __construct(
        /** @var array<string, ParticipantFrameDto> */
        public array $participantFrames
    ) {}

    public static function fromArray(array $data): self
    {
        $participantFrames = [];

        // The API returns participant frames with keys like "1", "2", etc.
        foreach ($data as $key => $frameData) {
            if (is_numeric($key)) {
                $participantFrames[$key] = ParticipantFrameDto::fromArray($frameData);
            }
        }

        return new self(
            participantFrames: $participantFrames
        );
    }
}
