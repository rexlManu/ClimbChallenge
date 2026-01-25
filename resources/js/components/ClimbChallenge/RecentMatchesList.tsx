import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, Swords, User } from 'lucide-react';

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
}

const getKDAColor = (kda: number): string => {
    if (kda >= 3) return 'text-emerald-400';
    if (kda >= 2) return 'text-blue-400';
    if (kda >= 1.5) return 'text-yellow-400';
    return 'text-red-400';
};

const getKDABadgeVariant = (kda: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (kda >= 2) return 'default';
    if (kda >= 1.5) return 'secondary';
    return 'destructive';
};

const getKDABadgeStyle = (kda: number): string => {
    if (kda >= 3) return 'bg-emerald-600 text-white border-emerald-600';
    if (kda >= 2) return 'bg-blue-600 text-white border-blue-600';
    if (kda >= 1.5) return 'bg-yellow-600 text-black border-yellow-600';
    return 'bg-red-600 text-white border-red-600';
};

const getWinRateColor = (winRate: number): string => {
    if (winRate >= 70) return 'text-emerald-400';
    if (winRate >= 60) return 'text-blue-400';
    if (winRate >= 50) return 'text-yellow-400';
    return 'text-red-400';
};

export default function RecentMatchesList({ recentMatches }: RecentMatchesListProps) {
    const matchDates = Object.keys(recentMatches).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Helper function to normalize champion names for ddragon URLs (remove apostrophes)
    const normalizeChampionName = (championName: string): string => {
        return championName.replace(/'/g, '').replace(' ', '');
    };

    if (matchDates.length === 0) {
        return (
            <Card className="border-slate-700 bg-gradient-to-br from-slate-800/80 to-slate-900/80 shadow-2xl backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Clock className="h-5 w-5 text-blue-400" />
                        Recent Matches
                    </CardTitle>
                    <CardDescription className="text-slate-400">Latest games played by participants</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex h-64 items-center justify-center text-slate-400">No recent matches available</div>
                </CardContent>
            </Card>
        );
    }

    // Flatten all matches and sort by date
    const allMatches = matchDates
        .flatMap((date) =>
            recentMatches[date].map((match) => ({
                ...match,
                match_date: date,
            })),
        )
        .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

    const getResultBadge = (result: string) => {
        if (result === 'WIN') {
            return <Badge className="bg-emerald-600 font-semibold text-white hover:bg-emerald-700">Victory</Badge>;
        } else if (result === 'DRAW') {
            return <Badge className="bg-yellow-600 font-semibold text-white hover:bg-yellow-700">Draw</Badge>;
        } else {
            return <Badge className="bg-red-600 font-semibold text-white hover:bg-red-700">Defeat</Badge>;
        }
    };

    const getKDAScore = (kills: number, deaths: number, assists: number): number => {
        if (deaths === 0) return kills + assists;
        return Number(((kills + assists) / deaths).toFixed(2));
    };

    const getLPBadge = (lpChange: number | null, lpChangeType: string | null) => {
        if (lpChange === null || lpChange === 0) {
            return (
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                    +0
                </Badge>
            );
        }

        if (lpChangeType === 'gain') {
            return <Badge className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border-emerald-600/20">+{lpChange}</Badge>;
        } else if (lpChangeType === 'loss') {
            return <Badge className="bg-red-600/20 text-red-400 hover:bg-red-600/30 border-red-600/20">-{Math.abs(lpChange)}</Badge>;
        } else {
            return (
                <Badge variant="secondary">
                    {lpChange > 0 ? '+' : ''}
                    {lpChange}
                </Badge>
            );
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Swords className="h-5 w-5 text-primary" />
                        Recent Matches
                    </CardTitle>
                    <CardDescription>Latest games played</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-muted/50">
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
                                {allMatches.slice(0, 20).map((match, index) => {
                                    const kda = getKDAScore(match.kills, match.deaths, match.assists);
                                    return (
                                        <TableRow
                                            key={`${match.display_name}-${match.champion}-${index}`}
                                            className="hover:bg-muted/50"
                                        >
                                            {showPlayerColumn && (
                                                <TableCell>
                                                    <div className="font-medium">{match.display_name}</div>
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 ring-1 ring-border">
                                                        <AvatarImage
                                                            src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/champion/${normalizeChampionName(match.champion)}.png`}
                                                            alt={`${match.champion} champion icon`}
                                                        />
                                                        <AvatarFallback>
                                                            {match.champion.slice(0, 2)}
                                                        </AvatarFallback>
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
                                                <Badge className={`font-semibold ${getKDABadgeStyle(kda)}`}>{kda}</Badge>
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
                </CardContent>
            </Card>

            {/* Match Summary by Player */}
            {showSummary && (
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(
                        allMatches.reduce(
                            (acc, match) => {
                                if (!acc[match.display_name]) {
                                    acc[match.display_name] = { wins: 0, losses: 0, draws: 0, totalKills: 0, totalDeaths: 0, totalAssists: 0, games: 0 };
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
                    ).map(([playerName, stats]) => {
                        const winRate = stats.games > 0 ? Number(((stats.wins / stats.games) * 100).toFixed(1)) : 0;
                        const avgKda =
                            stats.games > 0 && stats.totalDeaths > 0
                                ? Number(((stats.totalKills + stats.totalAssists) / stats.totalDeaths).toFixed(2))
                                : stats.totalKills + stats.totalAssists;

                        return (
                            <Card
                                key={playerName}
                                className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <User className="h-4 w-4 text-primary" />
                                        {playerName}
                                    </CardTitle>
                                    <CardDescription>Recent performance summary</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Games</span>
                                        <span className="font-medium">{stats.games}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Win Rate</span>
                                        <span className={`font-medium ${getWinRateColor(winRate)}`}>{winRate}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">W/D/L</span>
                                        <span className="font-medium">
                                            <span className="text-emerald-400">{stats.wins}</span>
                                            <span className="text-muted-foreground">/</span>
                                            <span className="text-yellow-400">{stats.draws}</span>
                                            <span className="text-muted-foreground">/</span>
                                            <span className="text-red-400">{stats.losses}</span>
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Avg KDA</span>
                                        <Badge className={`font-semibold ${getKDABadgeStyle(avgKda)}`}>{avgKda}</Badge>
                                    </div>
                                    <div className="border-t border-border pt-3">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Avg K/D/A</span>
                                            <span className="font-medium">
                                                {(stats.totalKills / stats.games).toFixed(1)}/{(stats.totalDeaths / stats.games).toFixed(1)}/
                                                {(stats.totalAssists / stats.games).toFixed(1)}
                                            </span>
                                        </div>
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
