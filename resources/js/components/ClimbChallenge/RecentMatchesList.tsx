import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, Filter, Swords, User } from 'lucide-react';
import * as React from 'react';

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

interface RecentMatchesListProps {
    recentMatches: Record<string, RecentMatch[]>;
    showSummary?: boolean;
    showPlayerColumn?: boolean;
}

const getKDAColor = (kda: number): string => {
    if (kda >= 3) return 'text-emerald-300';
    if (kda >= 2) return 'text-sky-300';
    if (kda >= 1.5) return 'text-amber-300';

    return 'text-rose-300';
};

const getKDABadgeStyle = (kda: number): string => {
    if (kda >= 3) return 'border-emerald-700/40 bg-emerald-900/40 text-emerald-200';
    if (kda >= 2) return 'border-sky-700/40 bg-sky-900/40 text-sky-200';
    if (kda >= 1.5) return 'border-amber-700/40 bg-amber-900/40 text-amber-200';

    return 'border-rose-700/40 bg-rose-900/40 text-rose-200';
};

const getWinRateColor = (winRate: number): string => {
    if (winRate >= 70) return 'text-emerald-300';
    if (winRate >= 60) return 'text-sky-300';
    if (winRate >= 50) return 'text-amber-300';

    return 'text-rose-300';
};

const normalizeChampionName = (championName: string): string => {
    return championName.replace(/'/g, '').replace(' ', '');
};

const getResultBadge = (result: string) => {
    if (result === 'WIN') {
        return <Badge className="border-emerald-700/40 bg-emerald-900/40 text-emerald-200 hover:bg-emerald-900/50">Victory</Badge>;
    }

    if (result === 'DRAW') {
        return <Badge className="border-amber-700/40 bg-amber-900/40 text-amber-200 hover:bg-amber-900/50">Draw</Badge>;
    }

    return <Badge className="border-rose-700/40 bg-rose-900/40 text-rose-200 hover:bg-rose-900/50">Defeat</Badge>;
};

const getKDAScore = (kills: number, deaths: number, assists: number): number => {
    if (deaths === 0) return kills + assists;

    return Number(((kills + assists) / deaths).toFixed(2));
};

const getLPBadge = (lpChange: number | null, lpChangeType: string | null) => {
    if (lpChange === null || lpChange === 0) {
        return <Badge variant="secondary">+0</Badge>;
    }

    if (lpChangeType === 'gain') {
        return <Badge className="border-emerald-700/40 bg-emerald-900/40 text-emerald-200">+{lpChange}</Badge>;
    }

    if (lpChangeType === 'loss') {
        return <Badge className="border-rose-700/40 bg-rose-900/40 text-rose-200">-{Math.abs(lpChange)}</Badge>;
    }

    return (
        <Badge variant="secondary">
            {lpChange > 0 ? '+' : ''}
            {lpChange}
        </Badge>
    );
};

export default function RecentMatchesList({ recentMatches, showSummary = true, showPlayerColumn = true }: RecentMatchesListProps) {
    const matchDates = Object.keys(recentMatches).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const allMatches = React.useMemo(
        () =>
            matchDates
                .flatMap((date) =>
                    recentMatches[date].map((match) => ({
                        ...match,
                        match_date: date,
                    })),
                )
                .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime()),
        [matchDates, recentMatches],
    );

    const players = React.useMemo(() => Array.from(new Set(allMatches.map((match) => match.display_name))).sort(), [allMatches]);

    const [selectedPlayer, setSelectedPlayer] = React.useState('all');
    const [selectedResult, setSelectedResult] = React.useState('all');
    const [visibleCount, setVisibleCount] = React.useState(20);

    React.useEffect(() => {
        setVisibleCount(20);
    }, [selectedPlayer, selectedResult]);

    const filteredMatches = React.useMemo(
        () =>
            allMatches.filter((match) => {
                const playerMatch = selectedPlayer === 'all' || match.display_name === selectedPlayer;
                const resultMatch = selectedResult === 'all' || match.result === selectedResult;

                return playerMatch && resultMatch;
            }),
        [allMatches, selectedPlayer, selectedResult],
    );

    if (matchDates.length === 0) {
        return (
            <Card className="border-border/70 bg-card/85">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Recent Matches
                    </CardTitle>
                    <CardDescription>Latest games from tracked summoners</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex h-40 items-center justify-center text-muted-foreground">No recent matches available.</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="border-border/70 bg-card/85">
                <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Swords className="h-5 w-5 text-sky-300" />
                                Combined Recent Games
                            </CardTitle>
                            <CardDescription>
                                {filteredMatches.length} matches shown from {players.length} tracked players
                            </CardDescription>
                        </div>
                        <Badge variant="secondary" className="hidden sm:inline-flex">
                            <Filter className="mr-1 h-3 w-3" />
                            Live filters
                        </Badge>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by player" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All tracked players</SelectItem>
                                {players.map((player) => (
                                    <SelectItem key={player} value={player}>
                                        {player}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="col-span-1 flex flex-wrap gap-2 sm:col-span-1 lg:col-span-2">
                            {[
                                { label: 'All', value: 'all' },
                                { label: 'Wins', value: 'WIN' },
                                { label: 'Losses', value: 'LOSS' },
                                { label: 'Draws', value: 'DRAW' },
                            ].map((option) => (
                                <Button
                                    key={option.value}
                                    variant={selectedResult === option.value ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedResult(option.value)}
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            {(selectedPlayer !== 'all' || selectedResult !== 'all') && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedPlayer('all');
                                        setSelectedResult('all');
                                    }}
                                >
                                    Reset filters
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-muted/30">
                                    {showPlayerColumn && <TableHead>Player</TableHead>}
                                    <TableHead>Champion</TableHead>
                                    <TableHead>Result</TableHead>
                                    <TableHead>KDA</TableHead>
                                    <TableHead className="hidden sm:table-cell">Score</TableHead>
                                    <TableHead className="hidden sm:table-cell">LP</TableHead>
                                    <TableHead className="hidden md:table-cell">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMatches.slice(0, visibleCount).map((match, index) => {
                                    const kda = getKDAScore(match.kills, match.deaths, match.assists);

                                    return (
                                        <TableRow key={`${match.display_name}-${match.champion}-${index}`} className="hover:bg-muted/30">
                                            {showPlayerColumn && (
                                                <TableCell>
                                                    <div className="font-medium">{match.display_name}</div>
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 ring-1 ring-border/70">
                                                        <AvatarImage
                                                            src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/champion/${normalizeChampionName(match.champion)}.png`}
                                                            alt={`${match.champion} champion icon`}
                                                        />
                                                        <AvatarFallback>{match.champion.slice(0, 2)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{match.champion}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getResultBadge(match.result)}</TableCell>
                                            <TableCell>
                                                <span className={`font-medium ${getKDAColor(kda)}`}>
                                                    {match.kills}/{match.deaths}/{match.assists}
                                                </span>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <Badge className={`border font-semibold ${getKDABadgeStyle(kda)}`}>{kda}</Badge>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                {getLPBadge(match.lp_change, match.lp_change_type)}
                                            </TableCell>
                                            <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                                                {new Date(match.match_date).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {filteredMatches.length === 0 && (
                        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                            No matches for the selected filters.
                        </div>
                    )}

                    {filteredMatches.length > visibleCount && (
                        <div className="flex justify-center">
                            <Button variant="outline" size="sm" onClick={() => setVisibleCount((count) => count + 20)}>
                                Show 20 more
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {showSummary && filteredMatches.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {Object.entries(
                        filteredMatches.reduce(
                            (acc, match) => {
                                if (!acc[match.display_name]) {
                                    acc[match.display_name] = {
                                        wins: 0,
                                        losses: 0,
                                        draws: 0,
                                        totalKills: 0,
                                        totalDeaths: 0,
                                        totalAssists: 0,
                                        games: 0,
                                    };
                                }

                                if (match.result === 'WIN') {
                                    acc[match.display_name].wins++;
                                } else if (match.result === 'DRAW') {
                                    acc[match.display_name].draws++;
                                } else {
                                    acc[match.display_name].losses++;
                                }

                                acc[match.display_name].totalKills += match.kills;
                                acc[match.display_name].totalDeaths += match.deaths;
                                acc[match.display_name].totalAssists += match.assists;
                                acc[match.display_name].games++;

                                return acc;
                            },
                            {} as Record<
                                string,
                                {
                                    wins: number;
                                    losses: number;
                                    draws: number;
                                    totalKills: number;
                                    totalDeaths: number;
                                    totalAssists: number;
                                    games: number;
                                }
                            >,
                        ),
                    )
                        .sort(([, left], [, right]) => right.games - left.games)
                        .map(([playerName, stats]) => {
                            const winRate = stats.games > 0 ? Number(((stats.wins / stats.games) * 100).toFixed(1)) : 0;
                            const avgKda =
                                stats.games > 0 && stats.totalDeaths > 0
                                    ? Number(((stats.totalKills + stats.totalAssists) / stats.totalDeaths).toFixed(2))
                                    : stats.totalKills + stats.totalAssists;

                            return (
                                <Card key={playerName} className="border-border/70 bg-card/85">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <User className="h-4 w-4 text-sky-300" />
                                            {playerName}
                                        </CardTitle>
                                        <CardDescription>Filtered match summary</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Games</span>
                                            <span className="font-medium">{stats.games}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Win Rate</span>
                                            <span className={`font-medium ${getWinRateColor(winRate)}`}>{winRate}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">W/D/L</span>
                                            <span>
                                                <span className="text-emerald-300">{stats.wins}</span>
                                                <span className="text-muted-foreground">/</span>
                                                <span className="text-amber-300">{stats.draws}</span>
                                                <span className="text-muted-foreground">/</span>
                                                <span className="text-rose-300">{stats.losses}</span>
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Avg KDA</span>
                                            <Badge className={`border font-semibold ${getKDABadgeStyle(avgKda)}`}>{avgKda}</Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                </div>
            )}
        </div>
    );
}
