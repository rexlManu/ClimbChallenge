<?php

namespace App\Services\Riot\Match;

class ObjectivesDto
{
    public function __construct(
        public ObjectiveDto $baron,
        public ObjectiveDto $champion,
        public ObjectiveDto $dragon,
        public ObjectiveDto $horde,
        public ObjectiveDto $inhibitor,
        public ObjectiveDto $riftHerald,
        public ObjectiveDto $tower
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            baron: ObjectiveDto::fromArray($data['baron'] ?? []),
            champion: ObjectiveDto::fromArray($data['champion'] ?? []),
            dragon: ObjectiveDto::fromArray($data['dragon'] ?? []),
            horde: ObjectiveDto::fromArray($data['horde'] ?? []),
            inhibitor: ObjectiveDto::fromArray($data['inhibitor'] ?? []),
            riftHerald: ObjectiveDto::fromArray($data['riftHerald'] ?? []),
            tower: ObjectiveDto::fromArray($data['tower'] ?? [])
        );
    }
}
