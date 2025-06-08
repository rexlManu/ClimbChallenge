<?php

namespace App\Services\Riot\Match;

class MissionsDto
{
    public function __construct(
        public int $playerScore0,
        public int $playerScore1,
        public int $playerScore2,
        public int $playerScore3,
        public int $playerScore4,
        public int $playerScore5,
        public int $playerScore6,
        public int $playerScore7,
        public int $playerScore8,
        public int $playerScore9,
        public int $playerScore10,
        public int $playerScore11
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            playerScore0: $data['playerScore0'] ?? 0,
            playerScore1: $data['playerScore1'] ?? 0,
            playerScore2: $data['playerScore2'] ?? 0,
            playerScore3: $data['playerScore3'] ?? 0,
            playerScore4: $data['playerScore4'] ?? 0,
            playerScore5: $data['playerScore5'] ?? 0,
            playerScore6: $data['playerScore6'] ?? 0,
            playerScore7: $data['playerScore7'] ?? 0,
            playerScore8: $data['playerScore8'] ?? 0,
            playerScore9: $data['playerScore9'] ?? 0,
            playerScore10: $data['playerScore10'] ?? 0,
            playerScore11: $data['playerScore11'] ?? 0
        );
    }
}
