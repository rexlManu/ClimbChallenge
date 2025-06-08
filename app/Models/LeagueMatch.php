<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Services\Riot\Match\MatchDto;
use App\Services\Riot\Timeline\TimelineDto;

class LeagueMatch extends Model
{
    protected $fillable = [
        'match_id',
        'match_data',
        'timeline_data',
    ];

    protected $casts = [
        'match_data' => 'array',
        'timeline_data' => 'array',
    ];

    /**
     * Get the summoner tracks associated with this match.
     * This represents which summoners participated in this match.
     */
    public function summonerTracks(): BelongsToMany
    {
        return $this->belongsToMany(SummonerTrack::class, 'league_match_summoners')
            ->withPivot(['kills', 'deaths', 'assists', 'champion', 'result']);
    }

    /**
     * Get the summoners that participated in this match through their tracks.
     */
    public function summoners(): BelongsToMany
    {
        return $this->belongsToMany(Summoner::class, 'league_match_summoners', 'league_match_id', 'summoner_track_id')
            ->withPivot(['summoner_track_id', 'kills', 'deaths', 'assists', 'champion', 'result']);
    }

    /**
     * Get the parsed match data as MatchDto.
     */
    public function getMatchDataDtoAttribute(): ?MatchDto
    {
        if (empty($this->match_data)) {
            return null;
        }

        return MatchDto::fromArray($this->match_data);
    }

    /**
     * Get the parsed timeline data as TimelineDto.
     */
    public function getTimelineDataDtoAttribute(): ?TimelineDto
    {
        if (empty($this->timeline_data)) {
            return null;
        }

        return TimelineDto::fromArray($this->timeline_data);
    }

    /**
     * Get the game duration in minutes.
     */
    public function getGameDurationInMinutesAttribute(): float
    {
        $matchDto = $this->match_data_dto;

        if (!$matchDto) {
            return 0;
        }

        return round($matchDto->info->gameDuration / 60, 2);
    }

    /**
     * Get the game creation timestamp as a carbon instance.
     */
    public function getGameCreationAttribute(): ?\Carbon\Carbon
    {
        $matchDto = $this->match_data_dto;

        if (!$matchDto) {
            return null;
        }

        return \Carbon\Carbon::createFromTimestamp($matchDto->info->gameCreation / 1000);
    }
}
