<?php

namespace App\Http\Controllers;

use App\Models\LeagueMatchSummoner;
use App\Models\Participant;
use App\Models\Summoner;
use App\Models\SummonerTrack;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Spatie\QueryBuilder\QueryBuilder;

class ClimbChallengeController extends Controller
{
    public function index()
    {
        // Get all participants with their current summoner data
        $participants = QueryBuilder::for(Participant::class)
            ->allowedSorts(['display_name'])
            ->with(['summoner' => function ($query) {
                $query->select([
                    'id',
                    'participant_id',
                    'level',
                    'profile_icon_id',
                    'current_tier',
                    'current_rank',
                    'current_league_points',
                    'current_wins',
                    'current_losses'
                ]);
            }])
            ->get();

        // Bulk calculate LP statistics for all summoners in a single query for optimal performance
        $lpStatistics = $this->getBulkLpStatistics($participants);

        $participants = $participants->map(function ($participant) use ($lpStatistics) {
            $summonerId = $participant->summoner?->id;
            $stats = $lpStatistics[$summonerId] ?? null;

            return [
                'id' => $participant->id,
                'display_name' => $participant->display_name,
                'riot_id' => $participant->riot_id,
                'summoner' => $participant->summoner ? [
                    'id' => $participant->summoner->id,
                    'level' => $participant->summoner->level,
                    'profile_icon_id' => $participant->summoner->profile_icon_id,
                    'current_tier' => $participant->summoner->current_tier,
                    'current_rank' => $participant->summoner->current_rank,
                    'current_league_points' => $participant->summoner->current_league_points,
                    'current_wins' => $participant->summoner->current_wins,
                    'current_losses' => $participant->summoner->current_losses,
                    'current_win_rate' => $participant->summoner->current_win_rate,
                    'current_formatted_rank' => $participant->summoner->current_formatted_rank,
                    'current_total_games' => $participant->summoner->current_total_games,
                    'total_lp_gained' => $stats['total_lp_gained'] ?? 0,
                    'total_lp_lost' => $stats['total_lp_lost'] ?? 0,
                    'net_lp_change' => $stats['net_lp_change'] ?? 0,
                    'total_dodges' => $stats['total_dodges'] ?? 0,
                ] : null,
            ];
        });

        // Get champion statistics
        $championStats = $this->getChampionStatistics();

        // Get rank progression data
        $rankProgression = $this->getRankProgression();

        // Get recent matches
        $recentMatches = $this->getRecentMatches();

        return Inertia::render('ClimbChallenge/Dashboard', [
            'participants' => $participants,
            'championStats' => $championStats,
            'rankProgression' => $rankProgression,
            'recentMatches' => $recentMatches,
        ]);
    }

    private function getBulkLpStatistics($participants)
    {
        $summonerIds = $participants->filter(function ($participant) {
            return $participant->summoner !== null;
        })->pluck('summoner.id')->toArray();

        if (empty($summonerIds)) {
            return [];
        }

        $placeholders = str_repeat('?,', count($summonerIds) - 1) . '?';
        
        $lpData = DB::select("
            SELECT 
                st.summoner_id,
                SUM(CASE WHEN st.lp_change_type = 'gain' THEN st.lp_change ELSE 0 END) as total_gained,
                SUM(CASE WHEN st.lp_change_type = 'loss' THEN ABS(st.lp_change) ELSE 0 END) as total_lost,
                SUM(CASE WHEN st.is_dodge = 1 THEN 1 ELSE 0 END) as total_dodges
            FROM summoner_tracks st
            WHERE st.summoner_id IN ($placeholders) AND st.lp_change IS NOT NULL
            GROUP BY st.summoner_id
        ", $summonerIds);

        $statistics = [];
        foreach ($lpData as $data) {
            $totalGained = $data->total_gained ?? 0;
            $totalLost = $data->total_lost ?? 0;
            
            $statistics[$data->summoner_id] = [
                'total_lp_gained' => $totalGained,
                'total_lp_lost' => $totalLost,
                'net_lp_change' => $totalGained - $totalLost,
                'total_dodges' => $data->total_dodges ?? 0,
            ];
        }

        return $statistics;
    }

    private function getChampionStatistics()
    {
        return DB::table('league_match_summoners as lms')
            ->join('summoner_tracks as st', 'lms.summoner_track_id', '=', 'st.id')
            ->join('summoners as s', 'st.summoner_id', '=', 's.id')
            ->join('participants as p', 's.participant_id', '=', 'p.id')
            ->select([
                'p.display_name',
                'lms.champion',
                DB::raw('COUNT(*) as games_played'),
                DB::raw('SUM(CASE WHEN lms.result = "WIN" THEN 1 ELSE 0 END) as wins'),
                DB::raw('SUM(CASE WHEN lms.result = "LOSS" THEN 1 ELSE 0 END) as losses'),
                DB::raw('AVG(lms.kills) as avg_kills'),
                DB::raw('AVG(lms.deaths) as avg_deaths'),
                DB::raw('AVG(lms.assists) as avg_assists'),
                DB::raw('ROUND(AVG((lms.kills + lms.assists) / CASE WHEN lms.deaths = 0 THEN 1 ELSE lms.deaths END), 2) as avg_kda'),
                DB::raw('ROUND((SUM(CASE WHEN lms.result = "WIN" THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as win_rate')
            ])
            ->groupBy('p.display_name', 'lms.champion')
            ->orderBy('games_played', 'desc')
            ->get()
            ->groupBy('display_name');
    }

    private function getRankProgression()
    {
        $rawData = DB::table('summoner_tracks as st')
            ->join('summoners as s', 'st.summoner_id', '=', 's.id')
            ->join('participants as p', 's.participant_id', '=', 'p.id')
            ->select([
                'p.display_name',
                'st.tier',
                'st.rank',
                'st.league_points',
                'st.wins',
                'st.losses',
                'st.created_at'
            ])
            ->orderBy('st.created_at')
            ->get();

        // Get all unique dates
        $allDates = $rawData->map(function ($item) {
            return \Carbon\Carbon::parse($item->created_at)->format('Y-m-d');
        })->unique()->sort()->values();

        // Get all unique players
        $allPlayers = $rawData->pluck('display_name')->unique()->sort()->values();

        // Convert rank to numeric value for charting
        $getRankValue = function ($tier, $rank, $lp) {
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

            return $tierValue + $rankValue + $lp;
        };

        // Format data for Recharts
        $chartData = $allDates->map(function ($date) use ($rawData, $allPlayers, $getRankValue) {
            $dateData = ['date' => $date];

            foreach ($allPlayers as $player) {
                $playerData = $rawData->where('display_name', $player)
                    ->where(function ($item) use ($date) {
                        return \Carbon\Carbon::parse($item->created_at)->format('Y-m-d') === $date;
                    })
                    ->first();

                if ($playerData) {
                    $dateData[$player] = $getRankValue($playerData->tier, $playerData->rank, $playerData->league_points);
                } else {
                    // Find the last known value before this date
                    $lastKnown = $rawData->where('display_name', $player)
                        ->where(function ($item) use ($date) {
                            return \Carbon\Carbon::parse($item->created_at)->format('Y-m-d') < $date;
                        })
                        ->sortByDesc('created_at')
                        ->first();

                    $dateData[$player] = $lastKnown ? $getRankValue($lastKnown->tier, $lastKnown->rank, $lastKnown->league_points) : null;
                }
            }

            return $dateData;
        });

        return [
            'chartData' => $chartData->values(),
            'players' => $allPlayers,
        ];
    }

    private function getRecentMatches(int $limit = 20)
    {
        return DB::table('league_match_summoners as lms')
            ->join('league_matches as lm', 'lms.league_match_id', '=', 'lm.id')
            ->join('summoner_tracks as st', 'lms.summoner_track_id', '=', 'st.id')
            ->join('summoners as s', 'st.summoner_id', '=', 's.id')
            ->join('participants as p', 's.participant_id', '=', 'p.id')
            ->select([
                'p.display_name',
                'lms.champion',
                'lms.kills',
                'lms.deaths',
                'lms.assists',
                'lms.result',
                'lm.created_at as match_date'
            ])
            ->orderBy('lm.created_at', 'desc')
            ->limit($limit)
            ->get()
            ->groupBy('match_date');
    }

    private function getRankValue($tier, $rank, $lp)
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

        return $tierValue + $rankValue + $lp;
    }
}
