import RankProgressionChart from '@/components/ClimbChallenge/RankProgressionChart';
import RecentMatchesList from '@/components/ClimbChallenge/RecentMatchesList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Crown, Medal, Target, Trophy, Users } from 'lucide-react';

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
    net_lp_change: number;
}

interface Participant {
    id: number;
    display_name: string;
    riot_id: string;
    hide_name: boolean;
    summoner: SummonerData | null;
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
    championStats: Record<string, unknown[]>;
    rankProgression: RankProgressionData;
    recentMatches: Record<string, RecentMatch[]>;
}

const tierStyles: Record<string, string> = {
    UNRANKED: 'bg-stone-600/20 text-stone-200 border-stone-500/40',
    IRON: 'bg-amber-950/40 text-amber-300 border-amber-700/40',
    BRONZE: 'bg-orange-950/40 text-orange-300 border-orange-700/40',
    SILVER: 'bg-zinc-700/40 text-zinc-100 border-zinc-500/40',
    GOLD: 'bg-yellow-900/40 text-yellow-300 border-yellow-600/40',
    PLATINUM: 'bg-cyan-900/40 text-cyan-300 border-cyan-600/40',
    EMERALD: 'bg-emerald-900/40 text-emerald-300 border-emerald-600/40',
    DIAMOND: 'bg-blue-900/40 text-blue-300 border-blue-600/40',
    MASTER: 'bg-fuchsia-900/40 text-fuchsia-300 border-fuchsia-600/40',
    GRANDMASTER: 'bg-rose-900/40 text-rose-300 border-rose-600/40',
    CHALLENGER: 'bg-sky-900/40 text-sky-300 border-sky-600/40',
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

    const tierValue = tierValues[tier?.toUpperCase()] ?? -400;
    const rankValue = rankValues[rank] ?? 0;

    return tierValue + rankValue + lp;
};

const getPodiumIcon = (position: number) => {
    if (position === 0) return <Crown className="h-5 w-5 text-yellow-400" />;
    if (position === 1) return <Trophy className="h-5 w-5 text-zinc-300" />;
    if (position === 2) return <Medal className="h-5 w-5 text-orange-400" />;

    return null;
};

export default function Dashboard({ participants, rankProgression, recentMatches }: DashboardProps) {
    const sortedParticipants = [...participants].sort((a, b) => {
        if (!a.summoner) return 1;
        if (!b.summoner) return -1;

        const aValue = getRankValue(a.summoner.current_tier, a.summoner.current_rank, a.summoner.current_league_points);
        const bValue = getRankValue(b.summoner.current_tier, b.summoner.current_rank, b.summoner.current_league_points);

        return bValue - aValue;
    });

    const allMatches = Object.entries(recentMatches)
        .flatMap(([matchDate, matches]) =>
            matches.map((match) => ({
                ...match,
                matchDate,
            })),
        )
        .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());

    const rankedParticipants = sortedParticipants.filter((participant) => participant.summoner);
    const activeTiers = new Set(rankedParticipants.map((participant) => participant.summoner?.current_tier ?? 'UNRANKED')).size;
    const avgWinRate =
        rankedParticipants.length > 0
            ? Number(
                  (
                      rankedParticipants.reduce((sum, participant) => sum + (participant.summoner?.current_win_rate ?? 0), 0) /
                      rankedParticipants.length
                  ).toFixed(1),
              )
            : 0;

    return (
        <AppLayout breadcrumbs={[{ title: 'Tracked Summoners', href: '/' }]}>
            <Head title="Tracked Summoners" />

            <div className="space-y-8">
                <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-6 shadow-lg sm:p-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_48%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.14),transparent_52%)]" />
                    <div className="relative z-10 space-y-5">
                        <Badge variant="secondary" className="border-sky-500/40 bg-sky-500/10 text-sky-200">
                            Personal op.gg for tracked players
                        </Badge>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Tracked Summoners Dashboard</h1>
                            <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
                                Leaderboard and match feed only for the summoners you track, with quick access to each player profile.
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <Card className="border-border/70 bg-background/70">
                                <CardContent className="flex items-center justify-between p-4">
                                    <div>
                                        <p className="text-xs tracking-wide text-muted-foreground uppercase">Tracked players</p>
                                        <p className="text-2xl font-semibold">{sortedParticipants.length}</p>
                                    </div>
                                    <Users className="h-5 w-5 text-sky-300" />
                                </CardContent>
                            </Card>
                            <Card className="border-border/70 bg-background/70">
                                <CardContent className="p-4">
                                    <p className="text-xs tracking-wide text-muted-foreground uppercase">Matches in feed</p>
                                    <p className="text-2xl font-semibold">{allMatches.length}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-border/70 bg-background/70">
                                <CardContent className="p-4">
                                    <p className="text-xs tracking-wide text-muted-foreground uppercase">Average win rate</p>
                                    <p className="text-2xl font-semibold">{avgWinRate}%</p>
                                </CardContent>
                            </Card>
                            <Card className="border-border/70 bg-background/70">
                                <CardContent className="p-4">
                                    <p className="text-xs tracking-wide text-muted-foreground uppercase">Active tiers</p>
                                    <p className="text-2xl font-semibold">{activeTiers}</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                <section className="grid gap-5 md:grid-cols-3">
                    {sortedParticipants.slice(0, 3).map((participant, index) => (
                        <Card key={participant.id} className="overflow-hidden border-border/70 bg-card/85">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <Link href={`/player/${participant.id}`}>
                                            <Avatar className="h-12 w-12 ring-1 ring-border/70">
                                                <AvatarImage
                                                    src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/profileicon/${participant.summoner?.profile_icon_id || '1'}.png`}
                                                    alt="Profile icon"
                                                />
                                                <AvatarFallback>{participant.display_name[0]}</AvatarFallback>
                                            </Avatar>
                                        </Link>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                {getPodiumIcon(index)}
                                                <Link href={`/player/${participant.id}`} className="font-semibold hover:underline">
                                                    {participant.display_name}
                                                </Link>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{participant.riot_id}</p>
                                        </div>
                                    </div>
                                    <span className="text-lg font-semibold text-muted-foreground">#{index + 1}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-2">
                                {participant.summoner ? (
                                    <>
                                        <Badge className={`border ${tierStyles[participant.summoner.current_tier] ?? tierStyles.UNRANKED}`}>
                                            {participant.summoner.current_tier} {participant.summoner.current_rank} ·{' '}
                                            {participant.summoner.current_league_points} LP
                                        </Badge>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Win rate</span>
                                                <span className="font-medium">{participant.summoner.current_win_rate}%</span>
                                            </div>
                                            <Progress value={participant.summoner.current_win_rate} className="h-1.5" />
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>
                                                {participant.summoner.current_wins}W / {participant.summoner.current_losses}L
                                            </span>
                                            <span>
                                                Net LP {participant.summoner.net_lp_change > 0 ? '+' : ''}
                                                {participant.summoner.net_lp_change}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No rank data yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <Card className="border-border/70 bg-card/85">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-sky-300" />
                            Leaderboard
                        </CardTitle>
                        <CardDescription>Only your tracked summoners, sorted by current rank and LP.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-muted/30">
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Player</TableHead>
                                        <TableHead>Rank</TableHead>
                                        <TableHead className="text-right">LP</TableHead>
                                        <TableHead className="text-right">Win Rate</TableHead>
                                        <TableHead className="hidden text-right md:table-cell">Games</TableHead>
                                        <TableHead className="hidden text-right lg:table-cell">Net LP</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedParticipants.map((participant, index) => (
                                        <TableRow key={participant.id} className="hover:bg-muted/30">
                                            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Link href={`/player/${participant.id}`}>
                                                        <Avatar className="h-8 w-8 ring-1 ring-border/70">
                                                            <AvatarImage
                                                                src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/profileicon/${participant.summoner?.profile_icon_id || '1'}.png`}
                                                                alt="Profile icon"
                                                            />
                                                            <AvatarFallback>{participant.display_name[0]}</AvatarFallback>
                                                        </Avatar>
                                                    </Link>
                                                    <div>
                                                        <Link href={`/player/${participant.id}`} className="font-medium hover:underline">
                                                            {participant.display_name}
                                                        </Link>
                                                        <p className="text-xs text-muted-foreground">{participant.riot_id}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {participant.summoner ? (
                                                    <Badge
                                                        className={`border ${tierStyles[participant.summoner.current_tier] ?? tierStyles.UNRANKED}`}
                                                    >
                                                        {participant.summoner.current_tier} {participant.summoner.current_rank}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {participant.summoner?.current_league_points ?? '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {participant.summoner ? (
                                                    <span
                                                        className={
                                                            participant.summoner.current_win_rate >= 50
                                                                ? 'font-medium text-emerald-300'
                                                                : 'font-medium text-rose-300'
                                                        }
                                                    >
                                                        {participant.summoner.current_win_rate}%
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                                                {participant.summoner?.current_total_games ?? '-'}
                                            </TableCell>
                                            <TableCell className="hidden text-right lg:table-cell">
                                                {participant.summoner ? (
                                                    <span className={participant.summoner.net_lp_change >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                                                        {participant.summoner.net_lp_change > 0 ? '+' : ''}
                                                        {participant.summoner.net_lp_change}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <RankProgressionChart rankProgression={rankProgression} />

                <RecentMatchesList recentMatches={recentMatches} showSummary showPlayerColumn />
            </div>
        </AppLayout>
    );
}
