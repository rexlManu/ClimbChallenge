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
                    'current_losses',
                    'peak_tier',
                    'peak_rank',
                    'peak_league_points',
                    'peak_achieved_at'
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
                'display_name' => $participant->displayed_name,
                'riot_id' => $participant->displayed_riot_id,
                'hide_name' => $participant->hide_name,
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
                    'peak_tier' => $participant->summoner->peak_tier,
                    'peak_rank' => $participant->summoner->peak_rank,
                    'peak_league_points' => $participant->summoner->peak_league_points,
                    'peak_achieved_at' => $participant->summoner->peak_achieved_at,
                    'peak_formatted_rank' => $participant->summoner->peak_formatted_rank,
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
        $results = DB::table('league_match_summoners as lms')
            ->join('summoner_tracks as st', 'lms.summoner_track_id', '=', 'st.id')
            ->join('summoners as s', 'st.summoner_id', '=', 's.id')
            ->join('participants as p', 's.participant_id', '=', 'p.id')
            ->select([
                'p.display_name',
                'p.hide_name',
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
            ->groupBy('p.display_name', 'p.hide_name', 'lms.champion')
            ->orderBy('games_played', 'desc')
            ->get();

        // Transform to use displayed names
        return $results->map(function ($stat) {
            $displayName = $stat->hide_name ? 'Hidden Player' : $stat->display_name;
            return (object) [
                'display_name' => $displayName,
                'champion' => $stat->champion,
                'games_played' => $stat->games_played,
                'wins' => $stat->wins,
                'losses' => $stat->losses,
                'avg_kills' => $stat->avg_kills,
                'avg_deaths' => $stat->avg_deaths,
                'avg_assists' => $stat->avg_assists,
                'avg_kda' => $stat->avg_kda,
                'win_rate' => $stat->win_rate,
            ];
        })->groupBy('display_name');
    }

    private function getRankProgression()
    {
        $rawData = DB::table('summoner_tracks as st')
            ->join('summoners as s', 'st.summoner_id', '=', 's.id')
            ->join('participants as p', 's.participant_id', '=', 'p.id')
            ->select([
                'p.display_name',
                'p.hide_name',
                'st.tier',
                'st.rank',
                'st.league_points',
                'st.wins',
                'st.losses',
                'st.created_at'
            ])
            ->orderBy('st.created_at')
            ->get();

        // Transform to use displayed names
        $rawData = $rawData->map(function ($item) {
            $item->display_name = $item->hide_name ? 'Hidden Player' : $item->display_name;
            return $item;
        });

        // Get all unique dates for daily view
        $allDates = $rawData->map(function ($item) {
            return \Carbon\Carbon::parse($item->created_at)->format('Y-m-d');
        })->unique()->sort()->values();

        // Get all unique players
        $allPlayers = $rawData->pluck('display_name')->unique()->sort()->values();

        // Get available dates for date picker
        $availableDates = $allDates->map(function ($date) {
            return [
                'value' => $date,
                'label' => \Carbon\Carbon::parse($date)->format('M j, Y')
            ];
        });

        // Daily chart data
        $dailyChartData = $this->getDailyChartData($rawData, $allDates, $allPlayers);

        return [
            'dailyChartData' => $dailyChartData->values(),
            'players' => $allPlayers,
            'availableDates' => $availableDates->values(),
        ];
    }

    private function getDailyChartData($rawData, $allDates, $allPlayers)
    {
        $getRankValue = function ($tier, $rank, $lp) {
            return $this->getRankValue($tier, $rank, $lp);
        };

        return $allDates->map(function ($date) use ($rawData, $allPlayers, $getRankValue) {
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
    }

    public function getHourlyProgression(Request $request)
    {
        $date = $request->get('date', now()->format('Y-m-d'));
        $currentDateTime = $request->get('currentTime', now()->format('Y-m-d H:i:s'));
        
        // Create center time from date and current time
        $centerTime = \Carbon\Carbon::parse($currentDateTime);
        if ($request->has('date') && !$request->has('currentTime')) {
            // If only date is provided, use current time of day but on the specified date
            $centerTime = \Carbon\Carbon::parse($date . ' ' . now()->format('H:i:s'));
        }
        
        // Generate 24 hours centered around current time (12 hours before, 12 hours after)
        $startTime = $centerTime->copy()->subHours(12);
        $endTime = $centerTime->copy()->addHours(12);
        
        $rawData = DB::table('summoner_tracks as st')
            ->join('summoners as s', 'st.summoner_id', '=', 's.id')
            ->join('participants as p', 's.participant_id', '=', 'p.id')
            ->select([
                'p.display_name',
                'p.hide_name',
                'st.tier',
                'st.rank',
                'st.league_points',
                'st.wins',
                'st.losses',
                'st.created_at'
            ])
            ->whereBetween('st.created_at', [$startTime, $endTime])
            ->orderBy('st.created_at')
            ->get();

        // Transform to use displayed names
        $rawData = $rawData->map(function ($item) {
            $item->display_name = $item->hide_name ? 'Hidden Player' : $item->display_name;
            return $item;
        });

        // Generate hours from start to end time
        $allHours = collect();
        $currentHour = $startTime->copy();
        while ($currentHour <= $endTime) {
            $allHours->push([
                'time' => $currentHour->format('H:i'),
                'fullDateTime' => $currentHour->format('Y-m-d H:i'),
                'display' => $currentHour->format('M j, H:i')
            ]);
            $currentHour->addHour();
        }

        // Get all unique players
        $allPlayers = $rawData->pluck('display_name')->unique()->sort()->values();

        $getRankValue = function ($tier, $rank, $lp) {
            return $this->getRankValue($tier, $rank, $lp);
        };

        // Format data for hourly chart
        $chartData = $allHours->map(function ($hourInfo) use ($rawData, $allPlayers, $getRankValue) {
            $hourData = [
                'time' => $hourInfo['time'],
                'fullDateTime' => $hourInfo['fullDateTime'],
                'display' => $hourInfo['display']
            ];
            $targetDateTime = $hourInfo['fullDateTime'];

            foreach ($allPlayers as $player) {
                // Find the latest entry for this player up to this hour
                $playerData = $rawData->where('display_name', $player)
                    ->where(function ($item) use ($targetDateTime) {
                        return \Carbon\Carbon::parse($item->created_at) <= \Carbon\Carbon::parse($targetDateTime);
                    })
                    ->sortByDesc('created_at')
                    ->first();

                if ($playerData) {
                    $hourData[$player] = $getRankValue($playerData->tier, $playerData->rank, $playerData->league_points);
                } else {
                    // Find the last known value before this time (broader search)
                    $lastKnown = DB::table('summoner_tracks as st')
                        ->join('summoners as s', 'st.summoner_id', '=', 's.id')
                        ->join('participants as p', 's.participant_id', '=', 'p.id')
                        ->select([
                            'p.display_name',
                            'p.hide_name',
                            'st.tier',
                            'st.rank',
                            'st.league_points',
                            'st.created_at'
                        ])
                        ->where(function ($query) use ($player) {
                            $query->where('p.display_name', $player)
                                  ->orWhere(function ($subQuery) use ($player) {
                                      $subQuery->where('p.hide_name', true)
                                               ->where(DB::raw("CASE WHEN p.hide_name = 1 THEN 'Hidden Player' ELSE p.display_name END"), $player);
                                  });
                        })
                        ->where('st.created_at', '<', $targetDateTime)
                        ->orderBy('st.created_at', 'desc')
                        ->first();

                    $hourData[$player] = $lastKnown ? $getRankValue($lastKnown->tier, $lastKnown->rank, $lastKnown->league_points) : null;
                }
            }

            return $hourData;
        });

        return response()->json([
            'chartData' => $chartData->values(),
            'players' => $allPlayers,
            'centerTime' => $centerTime->format('H:i'),
            'centerIndex' => 12, // Always 12 since we go 12 hours back and forward
        ]);
    }

    private function getRecentMatches(int $limit = 20)
    {
        $matches = DB::table('league_match_summoners as lms')
            ->join('league_matches as lm', 'lms.league_match_id', '=', 'lm.id')
            ->join('summoner_tracks as st', 'lms.summoner_track_id', '=', 'st.id')
            ->join('summoners as s', 'st.summoner_id', '=', 's.id')
            ->join('participants as p', 's.participant_id', '=', 'p.id')
            ->select([
                'p.display_name',
                'p.hide_name',
                'lms.champion',
                'lms.kills',
                'lms.deaths',
                'lms.assists',
                'lms.result',
                'st.lp_change',
                'st.lp_change_type',
                'st.lp_change_reason',
                'lm.created_at as match_date'
            ])
            ->orderBy('lm.created_at', 'desc')
            ->limit($limit)
            ->get();

        // Transform to use displayed names
        $matches = $matches->map(function ($match) {
            $match->display_name = $match->hide_name ? 'Hidden Player' : $match->display_name;
            return $match;
        });

        return $matches->groupBy('match_date');
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
