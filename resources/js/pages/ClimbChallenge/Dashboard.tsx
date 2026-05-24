import RankProgressionChart from '@/components/ClimbChallenge/RankProgressionChart';
import RecentMatchesList from '@/components/ClimbChallenge/RecentMatchesList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Activity, ArrowDownRight, ArrowUpRight, Crown, Medal, Swords, Target, Trophy, Users } from 'lucide-react';

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
    if (position === 0) return <Crown className="h-4 w-4 text-yellow-400" />;
    if (position === 1) return <Trophy className="h-4 w-4 text-zinc-300" />;
    if (position === 2) return <Medal className="h-4 w-4 text-orange-400" />;

    return null;
};

const getTrendIcon = (value: number) => {
    if (value >= 0) {
        return <ArrowUpRight className="h-4 w-4 text-emerald-300" />;
    }

    return <ArrowDownRight className="h-4 w-4 text-rose-300" />;
};

const getKdaScore = (match: RecentMatch): number => {
    if (match.deaths === 0) {
        return match.kills + match.assists;
    }

    return Number(((match.kills + match.assists) / match.deaths).toFixed(2));
};

const getAverageKda = (matches: RecentMatch[]): number => {
    if (matches.length === 0) {
        return 0;
    }

    return Number((matches.reduce((sum, match) => sum + getKdaScore(match), 0) / matches.length).toFixed(2));
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
    const netLpTotal = rankedParticipants.reduce((sum, participant) => sum + (participant.summoner?.net_lp_change ?? 0), 0);
    const leader = rankedParticipants[0];
    const closestChaser = rankedParticipants[1];
    const leaderGap =
        leader?.summoner && closestChaser?.summoner
            ? getRankValue(leader.summoner.current_tier, leader.summoner.current_rank, leader.summoner.current_league_points) -
              getRankValue(closestChaser.summoner.current_tier, closestChaser.summoner.current_rank, closestChaser.summoner.current_league_points)
            : 0;

    const playerMatchStats = sortedParticipants.map((participant) => {
        const matches = allMatches.filter((match) => match.display_name === participant.display_name);
        const wins = matches.filter((match) => match.result === 'WIN').length;
        const losses = matches.filter((match) => match.result === 'LOSS').length;
        const recentWinRate = matches.length > 0 ? Number(((wins / matches.length) * 100).toFixed(1)) : 0;

        return {
            participant,
            matches,
            wins,
            losses,
            recentWinRate,
            averageKda: getAverageKda(matches),
        };
    });

    return (
        <AppLayout breadcrumbs={[{ title: 'Climb Compare', href: '/' }]}>
            <Head title="Climb Challenge Compare" />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-lg border border-border/70 bg-card">
                    <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
                        <div className="space-y-6 p-5 sm:p-7">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className="border-sky-500/40 bg-sky-500/10 text-sky-200">
                                    Solo queue race control
                                </Badge>
                                <Badge variant="secondary" className="border-border/70 bg-background/70 text-muted-foreground">
                                    {rankedParticipants.length} tracked players
                                </Badge>
                            </div>

                            <div className="max-w-3xl space-y-2">
                                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Climb Challenge Compare</h1>
                                <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                                    Compare ranks, LP movement, win rates, and recent games for everyone in the challenge from one shared view.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-md border border-border/70 bg-background/60 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs tracking-wide text-muted-foreground uppercase">Leader</p>
                                        <Crown className="h-4 w-4 text-yellow-400" />
                                    </div>
                                    <p className="mt-2 truncate text-2xl font-semibold">{leader?.display_name ?? '-'}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {leader?.summoner ? `${leader.summoner.current_formatted_rank} · ${leader.summoner.current_league_points} LP` : 'No rank data'}
                                    </p>
                                </div>
                                <div className="rounded-md border border-border/70 bg-background/60 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs tracking-wide text-muted-foreground uppercase">Leader gap</p>
                                        <Target className="h-4 w-4 text-sky-300" />
                                    </div>
                                    <p className="mt-2 text-2xl font-semibold">{leaderGap}</p>
                                    <p className="text-xs text-muted-foreground">LP over second place</p>
                                </div>
                                <div className="rounded-md border border-border/70 bg-background/60 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs tracking-wide text-muted-foreground uppercase">Avg win rate</p>
                                        <Activity className="h-4 w-4 text-emerald-300" />
                                    </div>
                                    <p className="mt-2 text-2xl font-semibold">{avgWinRate}%</p>
                                    <p className="text-xs text-muted-foreground">Across tracked accounts</p>
                                </div>
                                <div className="rounded-md border border-border/70 bg-background/60 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs tracking-wide text-muted-foreground uppercase">Net LP</p>
                                        {getTrendIcon(netLpTotal)}
                                    </div>
                                    <p className={netLpTotal >= 0 ? 'mt-2 text-2xl font-semibold text-emerald-300' : 'mt-2 text-2xl font-semibold text-rose-300'}>
                                        {netLpTotal > 0 ? '+' : ''}
                                        {netLpTotal}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Challenge total</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-border/70 bg-background/35 p-5 lg:border-t-0 lg:border-l">
                            <div className="mb-4 flex items-center gap-2">
                                <Swords className="h-4 w-4 text-sky-300" />
                                <h2 className="text-sm font-semibold">Current race order</h2>
                            </div>
                            <div className="space-y-3">
                                {sortedParticipants.map((participant, index) => (
                                    <div key={participant.id} className="flex items-center gap-3 rounded-md border border-border/70 bg-card/70 p-3">
                                        <Avatar className="h-10 w-10 ring-1 ring-border/70">
                                            <AvatarImage
                                                src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/profileicon/${participant.summoner?.profile_icon_id || '1'}.png`}
                                                alt=""
                                            />
                                            <AvatarFallback>{participant.display_name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                {getPodiumIcon(index)}
                                                <p className="truncate text-sm font-medium">{participant.display_name}</p>
                                            </div>
                                            <p className="truncate text-xs text-muted-foreground">{participant.riot_id}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold">{participant.summoner?.current_league_points ?? '-'} LP</p>
                                            <p className="text-xs text-muted-foreground">#{index + 1}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-3">
                    {playerMatchStats.map(({ participant, matches, wins, losses, recentWinRate, averageKda }, index) => (
                        <Card key={participant.id} className="border-border/70 bg-card/85">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <Avatar className="h-12 w-12 ring-1 ring-border/70">
                                            <AvatarImage
                                                src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/profileicon/${participant.summoner?.profile_icon_id || '1'}.png`}
                                                alt=""
                                            />
                                            <AvatarFallback>{participant.display_name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <CardTitle className="flex items-center gap-2 truncate text-base">
                                                {getPodiumIcon(index)}
                                                {participant.display_name}
                                            </CardTitle>
                                            <CardDescription className="truncate">{participant.riot_id}</CardDescription>
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-muted-foreground">#{index + 1}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {participant.summoner ? (
                                    <>
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <Badge className={`border ${tierStyles[participant.summoner.current_tier] ?? tierStyles.UNRANKED}`}>
                                                {participant.summoner.current_tier} {participant.summoner.current_rank} · {participant.summoner.current_league_points} LP
                                            </Badge>
                                            <span className={participant.summoner.net_lp_change >= 0 ? 'text-sm font-medium text-emerald-300' : 'text-sm font-medium text-rose-300'}>
                                                {participant.summoner.net_lp_change > 0 ? '+' : ''}
                                                {participant.summoner.net_lp_change} LP
                                            </span>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Season win rate</span>
                                                <span className="font-medium">{participant.summoner.current_win_rate}%</span>
                                            </div>
                                            <Progress value={participant.summoner.current_win_rate} className="h-1.5" />
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div className="rounded-md bg-background/50 p-2">
                                                <p className="text-xs text-muted-foreground">Recent</p>
                                                <p className="font-semibold">{wins}W / {losses}L</p>
                                            </div>
                                            <div className="rounded-md bg-background/50 p-2">
                                                <p className="text-xs text-muted-foreground">Recent WR</p>
                                                <p className={recentWinRate >= 50 ? 'font-semibold text-emerald-300' : 'font-semibold text-rose-300'}>{recentWinRate}%</p>
                                            </div>
                                            <div className="rounded-md bg-background/50 p-2">
                                                <p className="text-xs text-muted-foreground">Avg KDA</p>
                                                <p className="font-semibold">{averageKda}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{participant.summoner.current_wins}W / {participant.summoner.current_losses}L season</span>
                                            <span>{matches.length} feed matches</span>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No rank data yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <section className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                    <Card className="min-w-0 border-border/70 bg-card/85">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-sky-300" />
                                Compare Table
                            </CardTitle>
                            <CardDescription>Snapshot metrics for the challenge, sorted by current rank.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="max-w-full overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-muted/30">
                                            <TableHead className="w-10">#</TableHead>
                                            <TableHead>Player</TableHead>
                                            <TableHead>Rank</TableHead>
                                            <TableHead className="text-right">WR</TableHead>
                                            <TableHead className="text-right">Net LP</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedParticipants.map((participant, index) => (
                                            <TableRow key={participant.id} className="hover:bg-muted/30">
                                                <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8 ring-1 ring-border/70">
                                                            <AvatarImage
                                                                src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/profileicon/${participant.summoner?.profile_icon_id || '1'}.png`}
                                                                alt=""
                                                            />
                                                            <AvatarFallback>{participant.display_name[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">{participant.display_name}</p>
                                                            <p className="text-xs text-muted-foreground">{participant.riot_id}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {participant.summoner ? (
                                                        <Badge className={`border ${tierStyles[participant.summoner.current_tier] ?? tierStyles.UNRANKED}`}>
                                                            {participant.summoner.current_tier} {participant.summoner.current_rank}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {participant.summoner ? (
                                                        <span className={participant.summoner.current_win_rate >= 50 ? 'font-medium text-emerald-300' : 'font-medium text-rose-300'}>
                                                            {participant.summoner.current_win_rate}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
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
                </section>

                <RecentMatchesList recentMatches={recentMatches} showSummary showPlayerColumn />
            </div>
        </AppLayout>
    );
}
