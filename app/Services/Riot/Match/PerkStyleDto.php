<?php

namespace App\Services\Riot\Match;

class PerkStyleDto
{
    public function __construct(
        public string $description,
        /** @var array<PerkStyleSelectionDto> */
        public array $selections,
        public int $style
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            description: $data['description'] ?? '',
            selections: array_map(fn($s) => PerkStyleSelectionDto::fromArray($s), $data['selections'] ?? []),
            style: $data['style'] ?? 0
        );
    }
}
