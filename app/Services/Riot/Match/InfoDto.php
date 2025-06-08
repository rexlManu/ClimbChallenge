<?php

namespace App\Services\Riot\Match;

class InfoDto
{
    public function __construct(
        public ?string $endOfGameResult,
        public int $gameCreation,
        public int $gameDuration,
        public ?int $gameEndTimestamp,
        public int $gameId,
        public string $gameMode,
        public string $gameName,
        public int $gameStartTimestamp,
        public string $gameType,
        public string $gameVersion,
        public int $mapId,
        /** @var array<ParticipantDto> */
        public array $participants,
        public string $platformId,
        public int $queueId,
        /** @var array<TeamDto> */
        public array $teams,
        public ?string $tournamentCode = null
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            endOfGameResult: $data['endOfGameResult'] ?? null,
            gameCreation: $data['gameCreation'],
            gameDuration: $data['gameDuration'],
            gameEndTimestamp: $data['gameEndTimestamp'] ?? null,
            gameId: $data['gameId'],
            gameMode: $data['gameMode'],
            gameName: $data['gameName'],
            gameStartTimestamp: $data['gameStartTimestamp'],
            gameType: $data['gameType'],
            gameVersion: $data['gameVersion'],
            mapId: $data['mapId'],
            participants: array_map(fn($p) => ParticipantDto::fromArray($p), $data['participants']),
            platformId: $data['platformId'],
            queueId: $data['queueId'],
            teams: array_map(fn($t) => TeamDto::fromArray($t), $data['teams']),
            tournamentCode: $data['tournamentCode'] ?? null
        );
    }
}
