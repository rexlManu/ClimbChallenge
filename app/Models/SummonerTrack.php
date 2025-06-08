<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SummonerTrack extends Model
{
    protected $fillable = [
        'summoner_id',
        'tier',
        'rank',
        'league_points',
        'lp_change',
        'lp_change_type',
        'lp_change_reason',
        'is_dodge',
        'wins',
        'losses',
    ];

    protected $casts = [
        'league_points' => 'integer',
        'lp_change' => 'integer',
        'is_dodge' => 'boolean',
        'wins' => 'integer',
        'losses' => 'integer',
    ];

    /**
     * Get the summoner that owns the track.
     */
    public function summoner(): BelongsTo
    {
        return $this->belongsTo(Summoner::class);
    }

    /**
     * Get the league matches associated with this summoner track.
     * This represents which matches this summoner participated in at this rank/tier.
     */
    public function leagueMatches(): BelongsToMany
    {
        return $this->belongsToMany(LeagueMatch::class, 'league_match_summoners')
            ->withPivot(['kills', 'deaths', 'assists', 'champion', 'result']);
    }

    /**
     * Get the win rate percentage.
     */
    public function getWinRateAttribute(): float
    {
        $totalGames = $this->wins + $this->losses;

        if ($totalGames === 0) {
            return 0.0;
        }

        return round(($this->wins / $totalGames) * 100, 2);
    }

    /**
     * Get the total games played.
     */
    public function getTotalGamesAttribute(): int
    {
        return $this->wins + $this->losses;
    }

    /**
     * Get the formatted rank string.
     */
    public function getFormattedRankAttribute(): string
    {
        return ucfirst(strtolower($this->tier)) . ' ' . $this->rank;
    }
}
