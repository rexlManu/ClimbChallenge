import RankProgressionChart from '@/components/ClimbChallenge/RankProgressionChart';
import RecentMatchesList from '@/components/ClimbChallenge/RecentMatchesList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, Crown, Gamepad2, Medal, Trophy, Users } from 'lucide-react';

interface SummonerData {
    id: number;
    level: number;
    profile_icon_id: string | null;
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

interface RankMeta {
    tier: string;
    rank: string | null;
    lp: number;
}

interface RankProgressionData {
    dailyChartData: Array<Record<string, string | number | RankMeta | null>>;
    players: string[];
    availableDates: Array<{ value: string; label: string }>;
}

interface DashboardProps {
    participants: Participant[];
    rankProgression: RankProgressionData | null;
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

const rankBases: Record<string, number> = {
    UNRANKED: -400,
    IRON: 0,
    BRONZE: 400,
    SILVER: 800,
    GOLD: 1200,
    PLATINUM: 1600,
    EMERALD: 2000,
    DIAMOND: 2400,
    MASTER: 2800,
    GRANDMASTER: 3800,
    CHALLENGER: 4800,
};

const rankValues: Record<string, number> = {
    IV: 0,
    III: 100,
    II: 200,
    I: 300,
};

const getRankValue = (tier: string, rank: string, lp: number): number => {
    return (rankBases[tier?.toUpperCase()] ?? rankBases.UNRANKED) + (rankValues[rank] ?? 0) + lp;
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

const formatSigned = (value: number): string => `${value > 0 ? '+' : ''}${value}`;

export default function Dashboard({ participants, rankProgression }: DashboardProps) {
    const sortedParticipants = [...participants].sort((a, b) => {
        if (!a.summoner) return 1;
        if (!b.summoner) return -1;

        return (
            getRankValue(b.summoner.current_tier, b.summoner.current_rank, b.summoner.current_league_points) -
            getRankValue(a.summoner.current_tier, a.summoner.current_rank, a.summoner.current_league_points)
        );
    });

    const rankedParticipants = sortedParticipants.filter(
        (participant): participant is Participant & { summoner: SummonerData } => participant.summoner !== null,
    );
    const globalGames = rankedParticipants.reduce((sum, participant) => sum + participant.summoner.current_total_games, 0);
    const globalWins = rankedParticipants.reduce((sum, participant) => sum + participant.summoner.current_wins, 0);
    const netLpTotal = rankedParticipants.reduce((sum, participant) => sum + participant.summoner.net_lp_change, 0);
    const globalWinRate = globalGames > 0 ? Number(((globalWins / globalGames) * 100).toFixed(1)) : 0;
    const leader = rankedParticipants[0];
    const matchPlayers = rankedParticipants.map((participant) => ({ id: participant.summoner.id, name: participant.display_name }));

    return (
        <AppLayout breadcrumbs={[{ title: 'Climb Compare', href: '/' }]}>
            <Head title="Climb Challenge Compare" />

            <div className="space-y-7">
                <section className="overflow-hidden rounded-xl border border-border/70 bg-card">
                    <div className="grid gap-0 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                        <div className="space-y-5 border-b border-border/70 p-5 sm:p-7 xl:border-r xl:border-b-0">
                            <Badge variant="secondary" className="w-fit border-sky-500/40 bg-sky-500/10 text-sky-200">
                                Solo queue control room
                            </Badge>
                            <div className="max-w-2xl space-y-2">
                                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Climb Challenge</h1>
                                <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                                    Current leaderboard first, comparison tools below. Graph and match history load after the shell so the page is
                                    usable faster.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/45 p-3">
                                <Avatar className="h-12 w-12 ring-1 ring-border/70">
                                    <AvatarImage
                                        src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/profileicon/${leader?.summoner.profile_icon_id || '1'}.png`}
                                        alt=""
                                    />
                                    <AvatarFallback>{leader?.display_name[0] ?? '?'}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <Crown className="h-4 w-4 text-yellow-400" />
                                        <span className="truncate">{leader?.display_name ?? 'No leader yet'}</span>
                                    </div>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {leader
                                            ? `${leader.summoner.current_formatted_rank} · ${leader.summoner.current_league_points} LP`
                                            : 'Waiting for rank data'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-7">
                            <div className="rounded-lg border border-border/70 bg-background/55 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs tracking-wide text-muted-foreground uppercase">Global games</p>
                                    <Gamepad2 className="h-4 w-4 text-sky-300" />
                                </div>
                                <p className="mt-3 text-3xl font-semibold tabular-nums">{globalGames}</p>
                                <p className="text-xs text-muted-foreground">Ranked games tracked</p>
                            </div>
                            <div className="rounded-lg border border-border/70 bg-background/55 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs tracking-wide text-muted-foreground uppercase">LP gained</p>
                                    {getTrendIcon(netLpTotal)}
                                </div>
                                <p
                                    className={
                                        netLpTotal >= 0
                                            ? 'mt-3 text-3xl font-semibold text-emerald-300 tabular-nums'
                                            : 'mt-3 text-3xl font-semibold text-rose-300 tabular-nums'
                                    }
                                >
                                    {formatSigned(netLpTotal)}
                                </p>
                                <p className="text-xs text-muted-foreground">Net challenge LP</p>
                            </div>
                            <div className="rounded-lg border border-border/70 bg-background/55 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs tracking-wide text-muted-foreground uppercase">Win percentage</p>
                                    <Activity className="h-4 w-4 text-emerald-300" />
                                </div>
                                <p className="mt-3 text-3xl font-semibold tabular-nums">{globalWinRate}%</p>
                                <p className="text-xs text-muted-foreground">{globalWins} wins across the field</p>
                            </div>
                        </div>
                    </div>
                </section>

                <Card className="border-border/70 bg-card/85">
                    <CardHeader className="gap-2">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-sky-300" />
                            Leaderboard
                        </CardTitle>
                        <CardDescription>Sorted by Riot tier, division, and LP. Unranked accounts stay at the bottom.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-w-full overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-muted/30">
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Player</TableHead>
                                        <TableHead>Rank</TableHead>
                                        <TableHead className="text-right">Games</TableHead>
                                        <TableHead className="text-right">W / L</TableHead>
                                        <TableHead className="text-right">WR</TableHead>
                                        <TableHead className="text-right">Net LP</TableHead>
                                        <TableHead className="hidden text-right lg:table-cell">Dodges</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedParticipants.map((participant, index) => (
                                        <TableRow key={participant.id} className="hover:bg-muted/30">
                                            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 ring-1 ring-border/70">
                                                        <AvatarImage
                                                            src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/profileicon/${participant.summoner?.profile_icon_id || '1'}.png`}
                                                            alt=""
                                                        />
                                                        <AvatarFallback>{participant.display_name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="flex items-center gap-2 font-medium">
                                                            {getPodiumIcon(index)}
                                                            <span className="truncate">{participant.display_name}</span>
                                                        </p>
                                                        <p className="truncate text-xs text-muted-foreground">{participant.riot_id}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {participant.summoner ? (
                                                    <Badge
                                                        className={`border ${tierStyles[participant.summoner.current_tier] ?? tierStyles.UNRANKED}`}
                                                    >
                                                        {participant.summoner.current_formatted_rank} · {participant.summoner.current_league_points}{' '}
                                                        LP
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">No data</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {participant.summoner?.current_total_games ?? 0}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {participant.summoner
                                                    ? `${participant.summoner.current_wins} / ${participant.summoner.current_losses}`
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
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
                                            <TableCell className="text-right tabular-nums">
                                                {participant.summoner ? (
                                                    <span
                                                        className={
                                                            participant.summoner.net_lp_change >= 0
                                                                ? 'font-medium text-emerald-300'
                                                                : 'font-medium text-rose-300'
                                                        }
                                                    >
                                                        {formatSigned(participant.summoner.net_lp_change)}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden text-right tabular-nums lg:table-cell">
                                                {participant.summoner?.total_dodges ?? 0}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <section className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <BarChart3 className="h-4 w-4 text-sky-300" />
                        <h2 className="text-sm font-semibold text-muted-foreground">Progression comparison</h2>
                    </div>
                    <RankProgressionChart initialRankProgression={rankProgression} />
                </section>

                <RecentMatchesList players={matchPlayers} />
            </div>
        </AppLayout>
    );
}
