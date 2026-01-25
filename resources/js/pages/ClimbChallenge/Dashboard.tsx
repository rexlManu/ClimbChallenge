import RankProgressionChart from '@/components/ClimbChallenge/RankProgressionChart';
import RecentMatchesList from '@/components/ClimbChallenge/RecentMatchesList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
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
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
            <Head title="Friends Leaderboard" />

            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Leaderboard</h1>
                    <p className="text-muted-foreground">Detailed ranking of all participants.</p>
                </div>

                {/* Podium Section */}
                <div className="grid gap-6 md:grid-cols-3">
                    {sortedParticipants.slice(0, 3).map((participant, index) => (
                        <Card key={participant.id} className={`relative overflow-hidden border-border bg-card shadow-sm transition-all hover:shadow-md ${index === 0 ? 'ring-1 ring-yellow-500/50 md:-mt-4 md:mb-4' : ''
                            }`}>
                            <div className={`absolute inset-x-0 top-0 h-1 ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-300' : 'bg-amber-700'
                                }`} />
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <Link href={`/player/${participant.id}`}>
                                    <Avatar className="h-16 w-16 cursor-pointer ring-2 ring-background transition-transform hover:scale-105">
                                        <AvatarImage
                                            src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/profileicon/${participant.summoner?.profile_icon_id || '1'}.png`}
                                            alt="Profile icon"
                                        />
                                        <AvatarFallback>{participant.display_name[0]}</AvatarFallback>
                                    </Avatar>
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        {getPodiumIcon(index)}
                                        <Link href={`/player/${participant.id}`} className="truncate font-bold text-lg hover:underline">
                                            {participant.display_name}
                                        </Link>
                                    </div>
                                    <p className="truncate text-sm text-muted-foreground">{participant.riot_id}</p>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-2xl font-bold">#{index + 1}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                {participant.summoner ? (
                                    <>
                                        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                                            <div className="text-sm font-medium text-muted-foreground">Current Rank</div>
                                            <div className="text-right">
                                                <div className={`font-bold ${getTierColor(participant.summoner.current_tier).replace('bg-', 'text-').replace('text-white', '').replace('text-black', '')}`}>
                                                    {participant.summoner.current_tier} {participant.summoner.current_rank}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{participant.summoner.current_league_points} LP</div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Win Rate</span>
                                                <span className={participant.summoner.current_win_rate >= 50 ? 'text-emerald-500' : 'text-red-500'}>
                                                    {participant.summoner.current_win_rate}%
                                                </span>
                                            </div>
                                            <Progress value={participant.summoner.current_win_rate} className="h-2" />
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>{participant.summoner.current_wins}W</span>
                                                <span>{participant.summoner.current_losses}L</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-8 text-center text-muted-foreground">No rank data</div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Full Ranking Table */}
                <Card className="border-border bg-card shadow-sm">
                    <CardHeader>
                        <CardTitle>All Players</CardTitle>
                        <CardDescription>Comprehensive list of everyone in the challenge.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-muted/50">
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead>Player</TableHead>
                                    <TableHead>Rank</TableHead>
                                    <TableHead className="text-right">LP</TableHead>
                                    <TableHead className="hidden sm:table-cell text-right">Win Rate</TableHead>
                                    <TableHead className="hidden md:table-cell text-right">Games</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedParticipants.map((participant, index) => (
                                    <TableRow key={participant.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Link href={`/player/${participant.id}`}>
                                                    <Avatar className="h-8 w-8 ring-1 ring-border">
                                                        <AvatarImage src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/profileicon/${participant.summoner?.profile_icon_id || '1'}.png`} />
                                                        <AvatarFallback>{participant.display_name[0]}</AvatarFallback>
                                                    </Avatar>
                                                </Link>
                                                <div className="flex flex-col">
                                                    <Link href={`/player/${participant.id}`} className="font-medium hover:underline">
                                                        {participant.display_name}
                                                    </Link>
                                                    <span className="text-xs text-muted-foreground md:hidden">{participant.riot_id}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {participant.summoner ? (
                                                <Badge
                                                    variant="secondary"
                                                    className={`${getTierColor(participant.summoner.current_tier)} bg-opacity-20 text-opacity-100 hover:bg-opacity-30`}
                                                    style={{ backgroundColor: 'transparent' }} // Override background to avoid conflicts if needed, but classes should handle it. Actually I should improve badge styling.
                                                >
                                                    <span className={getTierColor(participant.summoner.current_tier).replace('bg-', 'text-').split(' ')[0]}>
                                                        {participant.summoner.current_tier} {participant.summoner.current_rank}
                                                    </span>
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {participant.summoner?.current_league_points ?? '-'}
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell text-right">
                                            {participant.summoner ? (
                                                <span className={participant.summoner.current_win_rate >= 50 ? 'text-emerald-500' : 'text-red-500'}>
                                                    {participant.summoner.current_win_rate}%
                                                </span>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-right text-muted-foreground">
                                            {participant.summoner?.current_total_games ?? '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                    <RankProgressionChart rankProgression={rankProgression} />
                    <div className="space-y-6">
                        {/* We could put something else here, or just let RecentMatches take full width below if preferred. 
                            For now I'll put recent matches below full width */}
                    </div>
                </div>

                <RecentMatchesList recentMatches={recentMatches} />
            </div>
        </AppLayout>
    );
}
