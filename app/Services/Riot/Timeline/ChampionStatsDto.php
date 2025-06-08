<?php

namespace App\Services\Riot\Timeline;

class ChampionStatsDto
{
    public function __construct(
        public int $abilityHaste,
        public int $abilityPower,
        public int $armor,
        public int $armorPen,
        public int $armorPenPercent,
        public int $attackDamage,
        public int $attackSpeed,
        public int $bonusArmorPenPercent,
        public int $bonusMagicPenPercent,
        public int $ccReduction,
        public int $cooldownReduction,
        public int $health,
        public int $healthMax,
        public int $healthRegen,
        public int $lifesteal,
        public int $magicPen,
        public int $magicPenPercent,
        public int $magicResist,
        public int $movementSpeed,
        public int $omnivamp,
        public int $physicalVamp,
        public int $power,
        public int $powerMax,
        public int $powerRegen,
        public int $spellVamp
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            abilityHaste: $data['abilityHaste'] ?? 0,
            abilityPower: $data['abilityPower'] ?? 0,
            armor: $data['armor'] ?? 0,
            armorPen: $data['armorPen'] ?? 0,
            armorPenPercent: $data['armorPenPercent'] ?? 0,
            attackDamage: $data['attackDamage'] ?? 0,
            attackSpeed: $data['attackSpeed'] ?? 0,
            bonusArmorPenPercent: $data['bonusArmorPenPercent'] ?? 0,
            bonusMagicPenPercent: $data['bonusMagicPenPercent'] ?? 0,
            ccReduction: $data['ccReduction'] ?? 0,
            cooldownReduction: $data['cooldownReduction'] ?? 0,
            health: $data['health'] ?? 0,
            healthMax: $data['healthMax'] ?? 0,
            healthRegen: $data['healthRegen'] ?? 0,
            lifesteal: $data['lifesteal'] ?? 0,
            magicPen: $data['magicPen'] ?? 0,
            magicPenPercent: $data['magicPenPercent'] ?? 0,
            magicResist: $data['magicResist'] ?? 0,
            movementSpeed: $data['movementSpeed'] ?? 0,
            omnivamp: $data['omnivamp'] ?? 0,
            physicalVamp: $data['physicalVamp'] ?? 0,
            power: $data['power'] ?? 0,
            powerMax: $data['powerMax'] ?? 0,
            powerRegen: $data['powerRegen'] ?? 0,
            spellVamp: $data['spellVamp'] ?? 0
        );
    }
}
