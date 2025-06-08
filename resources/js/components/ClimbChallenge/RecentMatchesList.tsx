import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RecentMatch {
    display_name: string;
    champion: string;
    kills: number;
    deaths: number;
    assists: number;
    result: string;
}

interface RecentMatchesListProps {
    recentMatches: Record<string, RecentMatch[]>;
}

export default function RecentMatchesList({ recentMatches }: RecentMatchesListProps) {
    const matchDates = Object.keys(recentMatches).sort((a, b) => 
        new Date(b).getTime() - new Date(a).getTime()
    );

    // Helper function to normalize champion names for ddragon URLs (remove apostrophes)
    const normalizeChampionName = (championName: string): string => {
        return championName.replace(/'/g, '').replace(' ', '');
    };

    if (matchDates.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Matches</CardTitle>
                    <CardDescription>Latest games played by participants</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                        No recent matches available
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Flatten all matches and sort by date
    const allMatches = matchDates.flatMap(date => 
        recentMatches[date].map(match => ({
            ...match,
            match_date: date
        }))
    ).sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

    const getResultBadge = (result: string) => {
        if (result === 'WIN') {
            return <Badge className="bg-green-600 hover:bg-green-700">Victory</Badge>;
        } else if (result === 'DRAW') {
            return <Badge className="bg-yellow-600 hover:bg-yellow-700">Draw</Badge>;
        } else {
            return <Badge variant="destructive">Defeat</Badge>;
        }
    };

    const getKDAScore = (kills: number, deaths: number, assists: number): number => {
        if (deaths === 0) return kills + assists;
        return Number(((kills + assists) / deaths).toFixed(2));
    };

    const getKDAColor = (kda: number): string => {
        if (kda >= 3) return 'text-green-600';
        if (kda >= 2) return 'text-blue-600';
        if (kda >= 1.5) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Recent Matches</CardTitle>
                    <CardDescription>Latest games played by participants</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Player</TableHead>
                                <TableHead>Champion</TableHead>
                                <TableHead>Result</TableHead>
                                <TableHead>KDA</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allMatches.slice(0, 20).map((match, index) => {
                                const kda = getKDAScore(match.kills, match.deaths, match.assists);
                                return (
                                    <TableRow key={`${match.display_name}-${match.champion}-${index}`}>
                                        <TableCell>
                                            <div className="font-medium">{match.display_name}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage 
                                                        src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/champion/${normalizeChampionName(match.champion)}.png`}
                                                        alt={`${match.champion} champion icon`}
                                                    />
                                                    <AvatarFallback>{match.champion.slice(0, 2)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{match.champion}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getResultBadge(match.result)}
                                        </TableCell>
                                        <TableCell>
                                            <span className={getKDAColor(kda)}>
                                                {match.kills}/{match.deaths}/{match.assists}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={kda >= 2 ? 'default' : kda >= 1.5 ? 'secondary' : 'outline'}
                                                className={getKDAColor(kda)}
                                            >
                                                {kda}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(match.match_date).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Match Summary by Player */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(
                    allMatches.reduce((acc, match) => {
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
                    }, {} as Record<string, { wins: number; losses: number; draws: number; totalKills: number; totalDeaths: number; totalAssists: number; games: number }>)
                ).map(([playerName, stats]) => {
                    const winRate = stats.games > 0 ? Number(((stats.wins / stats.games) * 100).toFixed(1)) : 0;
                    const avgKda = stats.games > 0 && stats.totalDeaths > 0 
                        ? Number(((stats.totalKills + stats.totalAssists) / stats.totalDeaths).toFixed(2))
                        : stats.totalKills + stats.totalAssists;

                    return (
                        <Card key={playerName}>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">{playerName}</CardTitle>
                                <CardDescription>Recent performance summary</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm">Games</span>
                                    <span className="font-medium">{stats.games}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">Win Rate</span>
                                    <span className={winRate >= 60 ? 'text-green-600 font-medium' : winRate >= 50 ? 'text-yellow-600 font-medium' : 'text-red-600 font-medium'}>
                                        {winRate}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">W/D/L</span>
                                    <span className="font-medium">
                                        <span className="text-green-600">{stats.wins}</span>
                                        /
                                        <span className="text-yellow-600">{stats.draws}</span>
                                        /
                                        <span className="text-red-600">{stats.losses}</span>
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">Avg KDA</span>
                                    <Badge 
                                        variant={avgKda >= 2 ? 'default' : avgKda >= 1.5 ? 'secondary' : 'outline'}
                                        className={getKDAColor(avgKda)}
                                    >
                                        {avgKda}
                                    </Badge>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Avg K/D/A</span>
                                    <span>
                                        {(stats.totalKills / stats.games).toFixed(1)}/
                                        {(stats.totalDeaths / stats.games).toFixed(1)}/
                                        {(stats.totalAssists / stats.games).toFixed(1)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
} 