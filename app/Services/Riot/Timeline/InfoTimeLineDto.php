<?php

namespace App\Services\Riot\Timeline;

class InfoTimeLineDto
{
    public function __construct(
        public ?string $endOfGameResult,
        public int $frameInterval,
        public int $gameId,
        /** @var array<ParticipantTimeLineDto> */
        public array $participants,
        /** @var array<FramesTimeLineDto> */
        public array $frames
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            endOfGameResult: $data['endOfGameResult'] ?? null,
            frameInterval: $data['frameInterval'],
            gameId: $data['gameId'],
            participants: array_map(fn($p) => ParticipantTimeLineDto::fromArray($p), $data['participants']),
            frames: array_map(fn($f) => FramesTimeLineDto::fromArray($f), $data['frames'])
        );
    }
}
