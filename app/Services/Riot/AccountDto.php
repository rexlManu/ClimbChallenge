<?php

namespace App\Services\Riot;

class AccountDto
{
    public function __construct(
        public string $puuid,
        public ?string $gameName = null,
        public ?string $tagLine = null
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            puuid: $data['puuid'],
            gameName: $data['gameName'] ?? null,
            tagLine: $data['tagLine'] ?? null
        );
    }
}
