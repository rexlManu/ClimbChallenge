<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Summoner extends Model
{
    protected $fillable = [
        'participant_id',
        'account_id',
        'level',
        'profile_icon_id',
        'current_tier',
        'current_rank',
        'current_league_points',
        'current_wins',
        'current_losses',
        'last_match_fetched_at',
    ];

    protected $casts = [
        'level' => 'integer',
        'current_league_points' => 'integer',
        'current_wins' => 'integer',
        'current_losses' => 'integer',
        'last_match_fetched_at' => 'datetime',
    ];

    /**
     * Get the participant that owns the summoner.
     */
    public function participant(): BelongsTo
    {
        return $this->belongsTo(Participant::class);
    }

    /**
     * Get the summoner tracks for the summoner.
     */
    public function summonerTracks(): HasMany
    {
        return $this->hasMany(SummonerTrack::class);
    }

    /**
     * Get all league matches this summoner has participated in through their tracks.
     */
    public function leagueMatches()
    {
        return $this->hasManyThrough(
            LeagueMatch::class,
            SummonerTrack::class,
            'summoner_id', // Foreign key on summoner_tracks table
            'id', // Foreign key on league_matches table
            'id', // Local key on summoners table
            'id' // Local key on summoner_tracks table
        )
            ->join('league_match_summoners', 'league_matches.id', '=', 'league_match_summoners.league_match_id')
            ->where('league_match_summoners.summoner_track_id', '=', function ($query) {
                $query->select('summoner_tracks.id')
                    ->from('summoner_tracks')
                    ->whereColumn('summoner_tracks.summoner_id', 'summoners.id');
            });
    }

    /**
     * Get the current win rate percentage.
     */
    public function getCurrentWinRateAttribute(): float
    {
        $totalGames = $this->current_wins + $this->current_losses;

        if ($totalGames === 0) {
            return 0.0;
        }

        return round(($this->current_wins / $totalGames) * 100, 2);
    }

    /**
     * Get the current formatted rank string.
     */
    public function getCurrentFormattedRankAttribute(): string
    {
        return ucfirst(strtolower($this->current_tier)) . ' ' . $this->current_rank;
    }

    /**
     * Get the current total games played.
     */
    public function getCurrentTotalGamesAttribute(): int
    {
        return $this->current_wins + $this->current_losses;
    }
}
