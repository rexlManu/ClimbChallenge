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
        'hide_name',
    ];

    protected $casts = [
        'hide_name' => 'boolean',
    ];

    public function getRiotIdAttribute(): string
    {
        return $this->gameName . '#' . $this->tagLine;
    }

    public function getDisplayedNameAttribute(): string
    {
        return $this->hide_name ? 'Hidden Player' : $this->display_name;
    }

    public function getDisplayedRiotIdAttribute(): string
    {
        return $this->hide_name ? 'Hidden#0000' : $this->riot_id;
    }

    /**
     * Get the summoner for the participant.
     */
    public function summoner(): HasOne
    {
        return $this->hasOne(Summoner::class);
    }
}
