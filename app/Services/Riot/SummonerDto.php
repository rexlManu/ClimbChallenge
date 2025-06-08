<?php

namespace App\Services\Riot;

class SummonerDto
{
    public function __construct(
        public string $accountId,
        public int $profileIconId,
        public int $revisionDate,
        public string $id,
        public string $puuid,
        public int $summonerLevel,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            accountId: $data['accountId'],
            profileIconId: $data['profileIconId'],
            revisionDate: $data['revisionDate'],
            id: $data['id'],
            puuid: $data['puuid'],
            summonerLevel: $data['summonerLevel'],
        );
    }
}
