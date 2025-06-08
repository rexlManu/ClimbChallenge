<?php

namespace App\Services\Riot\Match;

class PerkStyleSelectionDto
{
    public function __construct(
        public int $perk,
        public int $var1,
        public int $var2,
        public int $var3
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            perk: $data['perk'] ?? 0,
            var1: $data['var1'] ?? 0,
            var2: $data['var2'] ?? 0,
            var3: $data['var3'] ?? 0
        );
    }
}
