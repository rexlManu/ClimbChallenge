<?php

namespace App\Models;

use App\Services\Riot\LeagueMatchResult;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeagueMatchSummoner extends Model
{
    protected $fillable = [
        'league_match_id',
        'summoner_track_id',
        'kills',
        'deaths',
        'assists',
        'champion',
        'result',
    ];

    protected $casts = [
        'league_match_id' => 'integer',
        'summoner_track_id' => 'integer',
        'kills' => 'integer',
        'deaths' => 'integer',
        'assists' => 'integer',
        'champion' => 'string',
        'result' => LeagueMatchResult::class,
    ];

    /**
     * Get the league match that this association belongs to.
     */
    public function leagueMatch(): BelongsTo
    {
        return $this->belongsTo(LeagueMatch::class);
    }

    /**
     * Get the summoner track that this association belongs to.
     */
    public function summonerTrack(): BelongsTo
    {
        return $this->belongsTo(SummonerTrack::class);
    }

    /**
     * Get the summoner through the summoner track.
     */
    public function summoner(): BelongsTo
    {
        return $this->summonerTrack()->summoner();
    }

    /**
     * Get the KDA ratio.
     */
    public function getKdaRatioAttribute(): float
    {
        if ($this->deaths === 0) {
            return $this->kills + $this->assists;
        }

        return round(($this->kills + $this->assists) / $this->deaths, 2);
    }

    /**
     * Get the formatted KDA string.
     */
    public function getFormattedKdaAttribute(): string
    {
        return "{$this->kills}/{$this->deaths}/{$this->assists}";
    }

    /**
     * Check if this was a win.
     */
    public function getIsWinAttribute(): bool
    {
        return $this->result === 'WIN';
    }
}
