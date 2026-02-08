import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface ParticipantSummoner {
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
    peak_formatted_rank: string | null;
    total_lp_gained: number;
    total_lp_lost: number;
    total_dodges: number;
}

interface Participant {
    id: number;
    display_name: string;
    riot_id: string;
    summoner: ParticipantSummoner | null;
}

interface RecentMatch {
    champion: string;
    kills: number;
    deaths: number;
    assists: number;
    result: string;
    lp_change: number | null;
    lp_change_type: string | null;
    lp_change_reason: string | null;
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

interface ProfileProps {
    participant: Participant;
    recentMatches: Record<string, RecentMatch[]>;
    rankProgression: unknown;
    championStats: ChampionStat[];
}

interface FlattenedMatch extends RecentMatch {
    match_date: string;
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

const normalizeChampionName = (championName: string): string => championName.replace(/'/g, '').replace(' ', '');

const getKda = (kills: number, deaths: number, assists: number): number => {
    if (deaths === 0) return kills + assists;

    return Number(((kills + assists) / deaths).toFixed(2));
};

const getMatchRowClass = (result: string): string => {
    if (result === 'WIN') return 'border-l-4 border-l-emerald-500 bg-emerald-950/20';
    if (result === 'LOSS') return 'border-l-4 border-l-rose-500 bg-rose-950/20';

    return 'border-l-4 border-l-amber-500 bg-amber-950/20';
};

const getLPText = (lpChange: number | null): string => {
    if (lpChange === null || lpChange === 0) return '0 LP';

    return `${lpChange > 0 ? '+' : ''}${lpChange} LP`;
};

export default function Profile({ participant, recentMatches, championStats }: ProfileProps) {
    const summoner = participant.summoner;

    const matches: FlattenedMatch[] = Object.entries(recentMatches)
        .flatMap(([date, rows]) =>
            rows.map((row) => ({
                ...row,
                match_date: date,
            })),
        )
        .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

    const totalKills = matches.reduce((sum, match) => sum + match.kills, 0);
    const totalDeaths = matches.reduce((sum, match) => sum + match.deaths, 0);
    const totalAssists = matches.reduce((sum, match) => sum + match.assists, 0);
    const overallKda = totalDeaths > 0 ? Number(((totalKills + totalAssists) / totalDeaths).toFixed(2)) : totalKills + totalAssists;

    const sortedChampionStats = [...championStats].sort((a, b) => b.games_played - a.games_played);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Tracked Summoners', href: '/' },
                { title: participant.display_name, href: `/player/${participant.id}` },
            ]}
        >
            <Head title={`${participant.display_name} - Profile`} />

            <div className="space-y-4">
                <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                </Link>

                <section className="grid gap-3 lg:grid-cols-[280px_1fr]">
                    <Card className="border-border/70 bg-card/90">
                        <CardContent className="space-y-3 p-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-14 w-14 ring-1 ring-border/70">
                                    <AvatarImage
                                        src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/profileicon/${summoner?.profile_icon_id || '1'}.png`}
                                        alt="Profile icon"
                                    />
                                    <AvatarFallback>{participant.display_name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <h1 className="truncate text-lg font-semibold">{participant.display_name}</h1>
                                    <p className="truncate text-xs text-muted-foreground">{participant.riot_id}</p>
                                </div>
                            </div>

                            {summoner && (
                                <>
                                    <Badge className={`border ${tierStyles[summoner.current_tier] ?? tierStyles.UNRANKED}`}>
                                        {summoner.current_formatted_rank} · {summoner.current_league_points} LP
                                    </Badge>

                                    <div className="space-y-1 rounded-md border border-border/70 bg-background/50 p-2.5 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Level</span>
                                            <span className="font-medium">{summoner.level}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Games</span>
                                            <span className="font-medium">{summoner.current_total_games}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">W / L</span>
                                            <span className="font-medium">
                                                {summoner.current_wins} / {summoner.current_losses}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Win Rate</span>
                                            <span className="font-medium">{summoner.current_win_rate}%</span>
                                        </div>
                                        <Progress value={summoner.current_win_rate} className="mt-1 h-1" />
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 bg-card/90">
                        <CardContent className="p-0">
                            <div className="grid grid-cols-2 gap-px bg-border/70 sm:grid-cols-4 lg:grid-cols-8">
                                {[
                                    { label: 'Games', value: matches.length },
                                    { label: 'KDA', value: overallKda },
                                    { label: 'Kills', value: totalKills },
                                    { label: 'Deaths', value: totalDeaths },
                                    { label: 'Assists', value: totalAssists },
                                    { label: 'Peak', value: summoner?.peak_formatted_rank ?? '-' },
                                    { label: 'LP+', value: `+${summoner?.total_lp_gained ?? 0}` },
                                    { label: 'LP-', value: `-${summoner?.total_lp_lost ?? 0}` },
                                ].map((item) => (
                                    <div key={item.label} className="bg-card px-3 py-3">
                                        <p className="text-[10px] tracking-wide text-muted-foreground uppercase">{item.label}</p>
                                        <p className="mt-0.5 truncate text-sm font-semibold">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-3 lg:grid-cols-[360px_1fr]">
                    <Card className="border-border/70 bg-card/90">
                        <CardContent className="p-0">
                            <div className="border-b border-border/70 px-3 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                Played Champions
                            </div>
                            <div className="max-h-[600px] overflow-auto">
                                {sortedChampionStats.map((stat) => (
                                    <div key={stat.champion} className="border-b border-border/70 px-3 py-2 last:border-b-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <Avatar className="h-7 w-7 ring-1 ring-border/70">
                                                    <AvatarImage
                                                        src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/champion/${normalizeChampionName(stat.champion)}.png`}
                                                        alt={`${stat.champion} champion icon`}
                                                    />
                                                    <AvatarFallback>{stat.champion.slice(0, 2)}</AvatarFallback>
                                                </Avatar>
                                                <span className="truncate text-sm font-medium">{stat.champion}</span>
                                            </div>
                                            <span className="text-xs font-semibold">{stat.win_rate}%</span>
                                        </div>
                                        <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                                            <span>
                                                {stat.games_played} games · {stat.wins}W {stat.losses}L
                                            </span>
                                            <span>{stat.avg_kda} KDA</span>
                                        </div>
                                    </div>
                                ))}
                                {sortedChampionStats.length === 0 && (
                                    <div className="px-3 py-6 text-center text-xs text-muted-foreground">No champion statistics available.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 bg-card/90">
                        <CardContent className="p-0">
                            <div className="border-b border-border/70 px-3 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                Match History
                            </div>
                            <div className="max-h-[600px] overflow-auto p-2">
                                <div className="space-y-2">
                                    {matches.map((match, index) => {
                                        const kda = getKda(match.kills, match.deaths, match.assists);

                                        return (
                                            <div
                                                key={`${match.match_date}-${match.champion}-${index}`}
                                                className={`rounded-md border border-border/60 px-3 py-2 ${getMatchRowClass(match.result)}`}
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <Avatar className="h-7 w-7 ring-1 ring-border/70">
                                                            <AvatarImage
                                                                src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/champion/${normalizeChampionName(match.champion)}.png`}
                                                                alt={`${match.champion} champion icon`}
                                                            />
                                                            <AvatarFallback>{match.champion.slice(0, 2)}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-semibold">{match.champion}</span>
                                                        <span className="text-muted-foreground">
                                                            {new Date(match.match_date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold">{match.result}</span>
                                                        <span
                                                            className={
                                                                match.lp_change_type === 'gain'
                                                                    ? 'text-emerald-300'
                                                                    : match.lp_change_type === 'loss'
                                                                      ? 'text-rose-300'
                                                                      : 'text-muted-foreground'
                                                            }
                                                        >
                                                            {getLPText(match.lp_change)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mt-1.5 grid grid-cols-3 gap-2 text-xs">
                                                    <div className="rounded border border-border/60 bg-background/40 px-2 py-1">
                                                        <p className="text-[10px] text-muted-foreground">K / D / A</p>
                                                        <p className="font-medium">
                                                            {match.kills} / {match.deaths} / {match.assists}
                                                        </p>
                                                    </div>
                                                    <div className="rounded border border-border/60 bg-background/40 px-2 py-1">
                                                        <p className="text-[10px] text-muted-foreground">KDA</p>
                                                        <p className="font-medium">{kda}</p>
                                                    </div>
                                                    <div className="rounded border border-border/60 bg-background/40 px-2 py-1">
                                                        <p className="text-[10px] text-muted-foreground">LP Reason</p>
                                                        <p className="truncate font-medium">{match.lp_change_reason ?? '-'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {matches.length === 0 && (
                                    <div className="px-3 py-6 text-center text-xs text-muted-foreground">No recent matches available.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}
