<?php

namespace App\Services\Riot;

enum QueueType: string
{
    case RANKED_SOLO_5x5 = 'RANKED_SOLO_5x5';
    case RANKED_FLEX_SR = 'RANKED_FLEX_SR';
}
