import RankProgressionChart from '@/components/ClimbChallenge/RankProgressionChart';
import RecentMatchesList from '@/components/ClimbChallenge/RecentMatchesList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Head } from '@inertiajs/react';
import { Crown, Medal, Trophy } from 'lucide-react';

interface SummonerData {
    id: number;
    level: number;
    profile_icon_id: string;
    current_tier: string;
    current_rank: string;
    current_league_points: number;
    current_wins: number;
    current_losses: number;
    current_win_rate: number;
    current_formatted_rank: string;
    current_total_games: number;
    total_lp_gained: number;
    total_lp_lost: number;
    total_dodges: number;
}

interface Participant {
    id: number;
    display_name: string;
    riot_id: string;
    hide_name: boolean;
    summoner: SummonerData | null;
}

interface ChampionStat {
    champion: string;
    games_played: number;
    wins: number;
    losses: number;
    avg_kills: number;
    avg_deaths: number;
    avg_assists: number;
    avg_kda: number;
    win_rate: number;
}

interface RankProgressionData {
    dailyChartData: Array<Record<string, string | number | null>>;
    players: string[];
    availableDates: Array<{ value: string; label: string }>;
}

interface RecentMatch {
    display_name: string;
    champion: string;
    kills: number;
    deaths: number;
    assists: number;
    result: string;
    lp_change: number | null;
    lp_change_type: string | null;
    lp_change_reason: string | null;
}

interface DashboardProps {
    participants: Participant[];
    championStats: Record<string, ChampionStat[]>;
    rankProgression: RankProgressionData;
    recentMatches: Record<string, RecentMatch[]>;
}

const getTierColor = (tier: string): string => {
    const tierColors: Record<string, string> = {
        UNRANKED: 'bg-[#8B7355] text-white',
        IRON: 'bg-[#8B4513] text-white',
        BRONZE: 'bg-[#CD7F32] text-white',
        SILVER: 'bg-[#C0C0C0] text-black',
        GOLD: 'bg-[#FFD700] text-black',
        PLATINUM: 'bg-[#00CED1] text-white',
        EMERALD: 'bg-[#50C878] text-white',
        DIAMOND: 'bg-[#87CEEB] text-black',
        MASTER: 'bg-[#9B59B6] text-white',
        GRANDMASTER: 'bg-[#E74C3C] text-white',
        CHALLENGER: 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black',
    };
    return tierColors[tier?.toUpperCase()] || 'bg-[#8B7355] text-white';
};

const getTierGradient = (tier: string): string => {
    const tierGradients: Record<string, string> = {
        UNRANKED: 'from-[#8B7355] to-[#6D5B47]',
        IRON: 'from-[#8B4513] to-[#5D2F0A]',
        BRONZE: 'from-[#CD7F32] to-[#A0661F]',
        SILVER: 'from-[#C0C0C0] to-[#A8A8A8]',
        GOLD: 'from-[#FFD700] to-[#DAB92E]',
        PLATINUM: 'from-[#00CED1] to-[#20B2AA]',
        EMERALD: 'from-[#50C878] to-[#3A9B5C]',
        DIAMOND: 'from-[#87CEEB] to-[#4682B4]',
        MASTER: 'from-[#9B59B6] to-[#7D3C98]',
        GRANDMASTER: 'from-[#E74C3C] to-[#C0392B]',
        CHALLENGER: 'from-[#FFD700] via-[#FFA500] to-[#FF8C00]',
    };
    return tierGradients[tier?.toUpperCase()] || 'from-[#8B7355] to-[#6D5B47]';
};

const getRankValue = (tier: string, rank: string, lp: number): number => {
    const tierValues: Record<string, number> = {
        UNRANKED: -400,
        IRON: 0,
        BRONZE: 400,
        SILVER: 800,
        GOLD: 1200,
        PLATINUM: 1600,
        EMERALD: 2000,
        DIAMOND: 2400,
        MASTER: 2800,
        GRANDMASTER: 3200,
        CHALLENGER: 3600,
    };

    const rankValues: Record<string, number> = {
        IV: 0,
        III: 100,
        II: 200,
        I: 300,
    };

    const tierValue = tierValues[tier?.toUpperCase()] || -400;
    const rankValue = rankValues[rank] || 0;

    return tierValue + rankValue + lp;
};

const getPodiumIcon = (position: number) => {
    if (position === 0) return <Crown className="h-5 w-5 text-[#FFD700]" />;
    if (position === 1) return <Trophy className="h-5 w-5 text-[#C0C0C0]" />;
    if (position === 2) return <Medal className="h-5 w-5 text-[#CD7F32]" />;
    return null;
};

export default function Dashboard({ participants, championStats, rankProgression, recentMatches }: DashboardProps) {
    // Sort participants by rank
    const sortedParticipants = [...participants].sort((a, b) => {
        if (!a.summoner || !b.summoner) return 0;
        const aValue = getRankValue(a.summoner.current_tier, a.summoner.current_rank, a.summoner.current_league_points);
        const bValue = getRankValue(b.summoner.current_tier, b.summoner.current_rank, b.summoner.current_league_points);
        return bValue - aValue; // Higher rank first
    });

    return (
        <>
            <Head title="Friends Leaderboard" />
            {/* Background with gradient and pattern */}
            <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
                {/* Animated background pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/20 via-purple-600/10 to-transparent"></div>
                <div className="absolute inset-0 animate-pulse bg-[linear-gradient(45deg,_transparent_25%,_rgba(255,255,255,.02)_50%,_transparent_75%)] bg-[length:60px_60px]"></div>

                <div className="relative container mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
                    {/* Header */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                            <h1 className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl lg:text-5xl">
                                Friends Leaderboard
                            </h1>
                            <p className="text-sm text-slate-300 sm:text-base">League of Legends ranking among friends</p>
                        </div>
                    </div>

                    {/* Leaderboard Section */}
                    <div className="space-y-6">
                        {/* Top 3 Podium */}
                        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {sortedParticipants.slice(0, 3).map((participant, index) => (
                                <Card
                                    key={participant.id}
                                    className={`border-slate-700 bg-gradient-to-br from-slate-800/80 to-slate-900/80 shadow-2xl backdrop-blur-sm ${index === 0 ? 'ring-2 shadow-yellow-400/20 ring-yellow-400/50' : ''} transition-shadow duration-200 hover:shadow-2xl`}
                                >
                                    <CardHeader className="flex flex-row items-center gap-4 pb-3">
                                        <div className="relative">
                                            <Avatar className="h-12 w-12 ring-2 ring-slate-600 sm:h-14 sm:w-14">
                                                <AvatarImage
                                                    src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/profileicon/${participant.summoner?.profile_icon_id || '1'}.png`}
                                                    alt="Profile icon"
                                                />
                                                <AvatarFallback className="bg-slate-700 text-slate-200">{participant.display_name[0]}</AvatarFallback>
                                            </Avatar>
                                            {index < 3 && (
                                                <div className="absolute -top-2 -right-2 flex items-center justify-center">
                                                    {getPodiumIcon(index)}
                                                    <Badge
                                                        className={`ml-1 ${
                                                            index === 0
                                                                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black'
                                                                : index === 1
                                                                  ? 'bg-[#C0C0C0] text-black'
                                                                  : 'bg-[#CD7F32] text-white'
                                                        }`}
                                                    >
                                                        #{index + 1}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate font-semibold text-white">{participant.display_name}</h3>
                                            <p className="truncate text-sm text-slate-400">{participant.riot_id}</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {participant.summoner ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-300">Rank</span>
                                                    <Badge className={`${getTierColor(participant.summoner.current_tier)} font-semibold`}>
                                                        {participant.summoner.current_formatted_rank}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-300">LP</span>
                                                    <span className="font-medium text-white">{participant.summoner.current_league_points}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-300">Win Rate</span>
                                                    <span
                                                        className={`font-medium ${
                                                            participant.summoner.current_win_rate >= 60
                                                                ? 'text-emerald-400'
                                                                : participant.summoner.current_win_rate >= 50
                                                                  ? 'text-yellow-400'
                                                                  : 'text-red-400'
                                                        }`}
                                                    >
                                                        {participant.summoner.current_win_rate}%
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    <Progress value={participant.summoner.current_win_rate} className="h-2 w-full bg-slate-700" />
                                                    <div className="flex justify-between text-xs text-slate-400">
                                                        <span className="text-emerald-400">{participant.summoner.current_wins}W</span>
                                                        <span className="text-red-400">{participant.summoner.current_losses}L</span>
                                                    </div>
                                                </div>
                                                {participant.summoner.total_dodges > 0 && (
                                                    <div className="border-t border-slate-700 pt-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-orange-400">Dodges</span>
                                                            <Badge variant="outline" className="border-orange-400 text-orange-400">
                                                                {participant.summoner.total_dodges}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="py-4 text-center text-slate-400">No data available</p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Full Leaderboard */}
                        <Card className="border-slate-700 bg-gradient-to-br from-slate-800/80 to-slate-900/80 shadow-2xl backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-white">Full Leaderboard</CardTitle>
                                <CardDescription className="text-slate-400">Complete ranking of all participants</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-slate-700 hover:bg-slate-800/50">
                                                <TableHead className="w-12 text-slate-300">#</TableHead>
                                                <TableHead className="text-slate-300">Player</TableHead>
                                                <TableHead className="text-slate-300">Rank</TableHead>
                                                <TableHead className="text-slate-300">LP</TableHead>
                                                <TableHead className="hidden text-slate-300 sm:table-cell">Games</TableHead>
                                                <TableHead className="text-slate-300">Win Rate</TableHead>
                                                <TableHead className="hidden text-slate-300 md:table-cell">Level</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sortedParticipants.map((participant, index) => (
                                                <TableRow
                                                    key={participant.id}
                                                    className="border-slate-700 transition-colors duration-150 hover:bg-slate-800/30"
                                                >
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            {getPodiumIcon(index)}
                                                            <Badge
                                                                variant={index < 3 ? 'default' : 'secondary'}
                                                                className={index < 3 ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white' : ''}
                                                            >
                                                                {index + 1}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8 ring-1 ring-slate-600">
                                                                <AvatarImage
                                                                    src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/profileicon/${participant.summoner?.profile_icon_id || '1'}.png`}
                                                                    alt="Profile icon"
                                                                />
                                                                <AvatarFallback className="bg-slate-700 text-slate-200">
                                                                    {participant.display_name[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="min-w-0">
                                                                <div className="truncate font-medium text-white">{participant.display_name}</div>
                                                                <a
                                                                    href={`https://dpm.lol/${participant.riot_id.replace('#', '-')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="cursor-pointer truncate text-sm text-blue-400 transition-colors duration-150 hover:text-blue-300 hover:underline sm:hidden md:block"
                                                                >
                                                                    {participant.riot_id}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {participant.summoner ? (
                                                            <Badge
                                                                className={`${getTierColor(participant.summoner.current_tier)} font-semibold whitespace-nowrap`}
                                                            >
                                                                {participant.summoner.current_formatted_rank}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-slate-500">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-white">{participant.summoner?.current_league_points || '-'}</TableCell>
                                                    <TableCell className="hidden text-white sm:table-cell">
                                                        {participant.summoner?.current_total_games || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {participant.summoner ? (
                                                            <span
                                                                className={`font-medium ${
                                                                    participant.summoner.current_win_rate >= 60
                                                                        ? 'text-emerald-400'
                                                                        : participant.summoner.current_win_rate >= 50
                                                                          ? 'text-yellow-400'
                                                                          : 'text-red-400'
                                                                }`}
                                                            >
                                                                {participant.summoner.current_win_rate}%
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-500">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="hidden text-white md:table-cell">
                                                        {participant.summoner?.level || '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Rank Progression Section */}
                    <RankProgressionChart rankProgression={rankProgression} />

                    {/* Recent Matches Section */}
                    <RecentMatchesList recentMatches={recentMatches} />
                </div>
            </div>
        </>
    );
}
