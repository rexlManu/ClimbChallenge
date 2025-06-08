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
        'peak_tier',
        'peak_rank',
        'peak_league_points',
        'peak_achieved_at',
    ];

    protected $casts = [
        'level' => 'integer',
        'current_league_points' => 'integer',
        'current_wins' => 'integer',
        'current_losses' => 'integer',
        'last_match_fetched_at' => 'datetime',
        'peak_league_points' => 'integer',
        'peak_achieved_at' => 'datetime',
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
        if ($this->current_tier === 'UNRANKED') {
            return 'Unranked';
        }

        $tier = ucfirst(strtolower($this->current_tier));
        $rank = $this->current_rank;

        // For Master, Grandmaster, and Challenger, don't show rank
        if (in_array($this->current_tier, ['MASTER', 'GRANDMASTER', 'CHALLENGER'])) {
            return $tier;
        }

        return trim($tier . ' ' . $rank);
    }

    /**
     * Get the current total games played.
     */
    public function getCurrentTotalGamesAttribute(): int
    {
        return $this->current_wins + $this->current_losses;
    }

    /**
     * Get the peak formatted rank string.
     */
    public function getPeakFormattedRankAttribute(): ?string
    {
        if (!$this->peak_tier) {
            return null;
        }

        if ($this->peak_tier === 'UNRANKED') {
            return 'Unranked';
        }

        $tier = ucfirst(strtolower($this->peak_tier));
        $rank = $this->peak_rank;

        // For Master, Grandmaster, and Challenger, don't show rank
        if (in_array($this->peak_tier, ['MASTER', 'GRANDMASTER', 'CHALLENGER'])) {
            return $tier;
        }

        return trim($tier . ' ' . $rank);
    }

    /**
     * Check if current rank is higher than peak and update if so.
     */
    public function updatePeakRankIfHigher(): bool
    {
        if ($this->isCurrentRankHigherThanPeak()) {
            $this->peak_tier = $this->current_tier;
            $this->peak_rank = $this->current_rank;
            $this->peak_league_points = $this->current_league_points;
            $this->peak_achieved_at = now();
            $this->save();
            return true;
        }
        return false;
    }

    /**
     * Check if current rank is higher than the recorded peak.
     */
    public function isCurrentRankHigherThanPeak(): bool
    {
        // If no peak is recorded, current rank is always higher
        if (is_null($this->peak_tier) || is_null($this->peak_league_points)) {
            return true;
        }

        // Compare tier rankings
        $tierRankings = [
            'IRON' => 1,
            'BRONZE' => 2,
            'SILVER' => 3,
            'GOLD' => 4,
            'PLATINUM' => 5,
            'EMERALD' => 6,
            'DIAMOND' => 7,
            'MASTER' => 8,
            'GRANDMASTER' => 9,
            'CHALLENGER' => 10,
        ];

        $currentTierRank = $tierRankings[$this->current_tier] ?? 0;
        $peakTierRank = $tierRankings[$this->peak_tier] ?? 0;

        // If current tier is higher
        if ($currentTierRank > $peakTierRank) {
            return true;
        }

        // If current tier is lower
        if ($currentTierRank < $peakTierRank) {
            return false;
        }

        // Same tier - compare by league points for Master+
        if (in_array($this->current_tier, ['MASTER', 'GRANDMASTER', 'CHALLENGER'])) {
            return $this->current_league_points > $this->peak_league_points;
        }

        // Same tier - compare by rank (IV < III < II < I) then by LP
        $rankValues = ['IV' => 1, 'III' => 2, 'II' => 3, 'I' => 4];
        $currentRankValue = $rankValues[$this->current_rank] ?? 0;
        $peakRankValue = $rankValues[$this->peak_rank] ?? 0;

        if ($currentRankValue > $peakRankValue) {
            return true;
        }

        if ($currentRankValue < $peakRankValue) {
            return false;
        }

        // Same tier and rank - compare by LP
        return $this->current_league_points > $this->peak_league_points;
    }
}
