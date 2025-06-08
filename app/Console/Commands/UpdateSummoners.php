<?php

namespace App\Console\Commands;

use App\Models\LeagueMatch;
use App\Models\LeagueMatchSummoner;
use App\Models\Participant;
use App\Models\Summoner;
use App\Services\Riot\LeagueMatchResult;
use App\Services\Riot\Match\ParticipantDto;
use App\Services\Riot\QueueType;
use App\Services\RiotService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class UpdateSummoners extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'climb:update-summoners';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update summoners from the riot api';

    public function __construct(private RiotService $riotService)
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        Participant::query()
            ->whereNotNull('puuid')
            ->each(function (Participant $participant) {
                $summonerDto = $this->riotService->getSummoner($participant->puuid);

                if ($summonerDto === null) {
                    $this->error('Summoner not found for ' . $participant->display_name);
                    return;
                }

                $leagueEntries = $this->riotService->getLeagueEntries($participant->puuid);

                if ($leagueEntries === null) {
                    $this->error('League entries not found for ' . $participant->display_name);
                    return;
                }

                $solo5v5LeagueEntry = collect($leagueEntries)->firstWhere('queueType', QueueType::RANKED_SOLO_5x5);

                // Handle unranked players by setting default values
                $tier = $solo5v5LeagueEntry?->tier ?? 'UNRANKED';
                $rank = $solo5v5LeagueEntry?->rank ?? '';
                $leaguePoints = $solo5v5LeagueEntry?->leaguePoints ?? 0;
                $wins = $solo5v5LeagueEntry?->wins ?? 0;
                $losses = $solo5v5LeagueEntry?->losses ?? 0;

                $summoner = Summoner::updateOrCreate(
                    ['participant_id' => $participant->id],
                    [
                        'account_id' => $summonerDto->accountId,
                        'level' => $summonerDto->summonerLevel,
                        'profile_icon_id' => $summonerDto->profileIconId,
                        'current_tier' => $tier,
                        'current_rank' => $rank,
                        'current_league_points' => $leaguePoints,
                        'current_wins' => $wins,
                        'current_losses' => $losses,
                    ]
                );

                // Check and update peak rank if current rank is higher
                if ($summoner->updatePeakRankIfHigher()) {
                    $this->info("New peak rank achieved for {$participant->display_name}: {$summoner->peak_formatted_rank} ({$summoner->peak_league_points} LP)");
                }

                $lastTrack = $summoner->summonerTracks()->latest()->first();

                // Calculate LP change if there's a previous track
                $lpChange = null;
                $lpChangeType = null;
                $lpChangeReason = null;
                $isDodge = false;

                if ($lastTrack) {
                    // Calculate LP change accounting for division/tier changes
                    $currentRankValue = $this->getRankValue($tier, $rank, $leaguePoints);
                    $previousRankValue = $this->getRankValue($lastTrack->tier, $lastTrack->rank, $lastTrack->league_points);
                    $lpChange = $currentRankValue - $previousRankValue;
                    
                    if ($lpChange > 0) {
                        $lpChangeType = 'gain';
                        $lpChangeReason = 'match_win';
                    } elseif ($lpChange < 0) {
                        $lpChangeType = 'loss';
                        
                        // Detect potential dodges
                        // Dodges are typically -5LP (first dodge) or -15LP (subsequent dodges)
                        // and happen without a match being played (same wins/losses)
                        if (($lpChange === -5 || $lpChange === -15) && 
                            $lastTrack->wins === $wins && $lastTrack->losses === $losses &&
                            $lastTrack->tier === $tier && $lastTrack->rank === $rank) {
                            $lpChangeReason = 'dodge';
                            $isDodge = true;
                        } else {
                            $lpChangeReason = 'match_loss';
                        }
                    } else {
                        $lpChangeType = 'no_change';
                        $lpChangeReason = 'unknown';
                    }
                }

                if (
                    !$lastTrack ||
                    $lastTrack->tier !== $tier ||
                    $lastTrack->rank !== $rank ||
                    $lastTrack->league_points !== $leaguePoints ||
                    $lastTrack->wins !== $wins ||
                    $lastTrack->losses !== $losses
                ) {
                    $lastTrack = $summoner->summonerTracks()->create([
                        'tier' => $tier,
                        'rank' => $rank,
                        'league_points' => $leaguePoints,
                        'lp_change' => $lpChange,
                        'lp_change_type' => $lpChangeType,
                        'lp_change_reason' => $lpChangeReason,
                        'is_dodge' => $isDodge,
                        'wins' => $wins,
                        'losses' => $losses,
                    ]);
                }

                $matchIds = $this->riotService->getMatchIds($participant->puuid, $summoner->last_match_fetched_at?->getTimestamp() ?? 0);
                $lastMatchFetchedAt = now();

                if ($matchIds === null) {
                    $this->error('Match ids not found for ' . $participant->display_name);
                    return;
                }

                if (count($matchIds) > 1) {
                    $this->warn('Found more than 1 new match for ' . $participant->display_name);
                }

                foreach ($matchIds as $matchId) {
                    $matchDto = $this->riotService->getMatch($matchId);
                    $timelineDto = $this->riotService->getMatchTimeline($matchId);

                    if ($matchDto === null || $timelineDto === null) {
                        $this->error('Match not found for ' . $matchId);
                        continue;
                    }

                    if ($matchDto->info->endOfGameResult !== 'GameComplete') {
                        $this->warn('Match ' . $matchId . ' is not a complete game');
                        Log::warning('Match ' . $matchId . ' is not a complete game', [
                            'match_id' => $matchId,
                            'end_of_game_result' => $matchDto->info->endOfGameResult,
                        ]);
                        continue;
                    }

                    $match = LeagueMatch::updateOrCreate(
                        ['match_id' => $matchId],
                        [
                            'match_data' => json_encode($matchDto),
                            'timeline_data' => json_encode($timelineDto),
                        ]
                    );

                    // Find the participant in the match data by PUUID
                    /** @var ParticipantDto $participantData */
                    $participantData = collect($matchDto->info->participants)
                        ->firstWhere('puuid', $participant->puuid);

                    if (!$participantData) {
                        $this->error("Participant {$participant->display_name} not found in match {$matchId}");
                        continue;
                    }

                    // Check if gameName or tagLine has changed and update if necessary
                    $needsUpdate = false;
                    $updates = [];

                    if (!empty($participantData->riotIdGameName) && $participant->gameName !== $participantData->riotIdGameName) {
                        $updates['gameName'] = $participantData->riotIdGameName;
                        $needsUpdate = true;
                        $this->info("Updating gameName for {$participant->display_name}: {$participant->gameName} -> {$participantData->riotIdGameName}");
                    }

                    if (!empty($participantData->riotIdTagline) && $participant->tagLine !== $participantData->riotIdTagline) {
                        $updates['tagLine'] = $participantData->riotIdTagline;
                        $needsUpdate = true;
                        $this->info("Updating tagLine for {$participant->display_name}: {$participant->tagLine} -> {$participantData->riotIdTagline}");
                    }

                    if ($needsUpdate) {
                        $participant->update($updates);
                        $this->info("Updated Riot ID for {$participant->display_name} to {$participant->fresh()->riot_id}");
                    }

                    if ($participantData->gameEndedInEarlySurrender) {
                        $result = LeagueMatchResult::DRAW;
                    } else if ($participantData->win) {
                        $result = LeagueMatchResult::WIN;
                    } else {
                        $result = LeagueMatchResult::LOSS;
                    }

                    // Create or update the relationship between the match and summoner track with participant data
                    $leagueMatchSummoner = LeagueMatchSummoner::updateOrCreate(
                        [
                            'league_match_id' => $match->id,
                            'summoner_track_id' => $lastTrack->id,
                        ],
                        [
                            'kills' => $participantData->kills,
                            'deaths' => $participantData->deaths,
                            'assists' => $participantData->assists,
                            'champion' => $participantData->championName,
                            'result' => $result,
                        ]
                    );

                    $this->info("Linked match {$matchId} to summoner track {$lastTrack->id} for {$participant->display_name} with K/D/A: {$participantData->kills}/{$participantData->deaths}/{$participantData->assists}");
                }

                // Update the last match fetched timestamp
                $summoner->update(['last_match_fetched_at' => $lastMatchFetchedAt]);

                $this->info('Updated summoner for ' . $participant->display_name);
            });
    }

    private function getRankValue($tier, $rank, $leaguePoints)
    {
        $tierValues = [
            'UNRANKED' => -400,
            'IRON' => 0,
            'BRONZE' => 400,
            'SILVER' => 800,
            'GOLD' => 1200,
            'PLATINUM' => 1600,
            'EMERALD' => 2000,
            'DIAMOND' => 2400,
            'MASTER' => 2800,
            'GRANDMASTER' => 3200,
            'CHALLENGER' => 3600,
        ];

        $rankValues = [
            'IV' => 0,
            'III' => 100,
            'II' => 200,
            'I' => 300
        ];

        $tierValue = $tierValues[strtoupper($tier)] ?? -400;
        $rankValue = $rankValues[$rank] ?? 0;

        return $tierValue + $rankValue + $leaguePoints;
    }
}
