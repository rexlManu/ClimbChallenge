<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Participant extends Model
{
    protected $fillable = [
        'display_name',
        'gameName',
        'tagLine',
        'puuid',
    ];

    public function getRiotIdAttribute(): string
    {
        return $this->gameName . '#' . $this->tagLine;
    }

    /**
     * Get the summoner for the participant.
     */
    public function summoner(): HasOne
    {
        return $this->hasOne(Summoner::class);
    }
}
