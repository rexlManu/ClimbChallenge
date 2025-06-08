<?php

namespace App\Services\Riot;

enum LeagueMatchResult: string
{
    case WIN = 'WIN';
    case LOSS = 'LOSS';
    case DRAW = 'DRAW';
}
