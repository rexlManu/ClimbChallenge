import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Trophy } from 'lucide-react';

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

interface ChampionStatsTableProps {
    championStats: Record<string, ChampionStat[]>;
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

const getWinRateColor = (winRate: number): string => {
    if (winRate >= 70) return 'text-emerald-400';
    if (winRate >= 60) return 'text-blue-400';
    if (winRate >= 50) return 'text-yellow-400';
    return 'text-red-400';
};

export default function ChampionStatsTable({ championStats }: ChampionStatsTableProps) {
    const participants = Object.keys(championStats);

    // Helper function to normalize champion names for ddragon URLs (remove apostrophes)
    const normalizeChampionName = (championName: string): string => {
        return championName.replace(/'/g, '').replace(' ', '');
    };

    if (participants.length === 0) {
        return (
            <Card className="border-slate-700 bg-gradient-to-br from-slate-800/80 to-slate-900/80 shadow-2xl backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Target className="h-5 w-5 text-blue-400" />
                        Champion Statistics
                    </CardTitle>
                    <CardDescription className="text-slate-400">Performance breakdown by champion</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex h-64 items-center justify-center text-slate-400">No champion statistics available</div>
                </CardContent>
            </Card>
        );
    }

    // Get all champions and their overall stats
    const allChampions = participants.flatMap((participant) => championStats[participant].map((stat) => stat.champion));
    const uniqueChampions = Array.from(new Set(allChampions));

    const overallChampionStats = uniqueChampions
        .map((champion) => {
            const allStats = participants.flatMap((participant) => championStats[participant].filter((stat) => stat.champion === champion));

            const totalGames = allStats.reduce((sum, stat) => sum + Number(stat.games_played), 0);
            const totalWins = allStats.reduce((sum, stat) => sum + Number(stat.wins), 0);
            const totalLosses = allStats.reduce((sum, stat) => sum + Number(stat.losses), 0);
            const avgKills = allStats.reduce((sum, stat) => sum + Number(stat.avg_kills) * Number(stat.games_played), 0) / totalGames;
            const avgDeaths = allStats.reduce((sum, stat) => sum + Number(stat.avg_deaths) * Number(stat.games_played), 0) / totalGames;
            const avgAssists = allStats.reduce((sum, stat) => sum + Number(stat.avg_assists) * Number(stat.games_played), 0) / totalGames;
            const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

            return {
                champion,
                totalGames,
                totalWins,
                totalLosses,
                avgKills: Number(avgKills.toFixed(1)),
                avgDeaths: Number(avgDeaths.toFixed(1)),
                avgAssists: Number(avgAssists.toFixed(1)),
                avgKda: avgDeaths > 0 ? Number(((avgKills + avgAssists) / avgDeaths).toFixed(2)) : avgKills + avgAssists,
                winRate: Number(winRate.toFixed(1)),
            };
        })
        .sort((a, b) => b.totalGames - a.totalGames);

    return (
        <div className="space-y-6">
            <Tabs defaultValue="overall" className="w-full">
                <div className="overflow-x-auto">
                    <TabsList className="grid w-full min-w-[300px] grid-cols-2 border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                        <TabsTrigger value="overall" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                            Overall Stats
                        </TabsTrigger>
                        <TabsTrigger value="individual" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
                            Individual Stats
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overall">
                    <Card className="border-slate-700 bg-gradient-to-br from-slate-800/80 to-slate-900/80 shadow-2xl backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Trophy className="h-5 w-5 text-yellow-400" />
                                Champion Performance Overview
                            </CardTitle>
                            <CardDescription className="text-slate-400">Combined statistics across all participants</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-slate-700 hover:bg-slate-800/50">
                                            <TableHead className="text-slate-300">Champion</TableHead>
                                            <TableHead className="text-slate-300">Games</TableHead>
                                            <TableHead className="text-slate-300">Win Rate</TableHead>
                                            <TableHead className="text-slate-300">Avg KDA</TableHead>
                                            <TableHead className="hidden text-slate-300 sm:table-cell">K/D/A</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {overallChampionStats.map((stat) => (
                                            <TableRow key={stat.champion} className="border-slate-700 hover:bg-slate-800/30">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8 ring-1 ring-slate-600">
                                                            <AvatarImage
                                                                src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/champion/${normalizeChampionName(stat.champion)}.png`}
                                                                alt={`${stat.champion} champion icon`}
                                                            />
                                                            <AvatarFallback className="bg-slate-700 text-slate-200">
                                                                {stat.champion.slice(0, 2)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium text-white">{stat.champion}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-200">{stat.totalGames}</TableCell>
                                                <TableCell>
                                                    <span className={`font-medium ${getWinRateColor(stat.winRate)}`}>{stat.winRate}%</span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={getKDABadgeVariant(stat.avgKda)}
                                                        className={`${getKDAColor(stat.avgKda)} border-current`}
                                                    >
                                                        {stat.avgKda}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden text-sm text-slate-400 sm:table-cell">
                                                    {stat.avgKills}/{stat.avgDeaths}/{stat.avgAssists}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="individual">
                    <div className="grid gap-6">
                        {participants.map((participant) => (
                            <Card
                                key={participant}
                                className="border-slate-700 bg-gradient-to-br from-slate-800/80 to-slate-900/80 shadow-2xl backdrop-blur-sm"
                            >
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        <Target className="h-5 w-5 text-blue-400" />
                                        {participant} - Champion Statistics
                                    </CardTitle>
                                    <CardDescription className="text-slate-400">Individual champion performance</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-slate-700 hover:bg-slate-800/50">
                                                    <TableHead className="text-slate-300">Champion</TableHead>
                                                    <TableHead className="text-slate-300">Games</TableHead>
                                                    <TableHead className="hidden text-slate-300 sm:table-cell">W/L</TableHead>
                                                    <TableHead className="text-slate-300">Win Rate</TableHead>
                                                    <TableHead className="text-slate-300">KDA</TableHead>
                                                    <TableHead className="hidden text-slate-300 md:table-cell">K/D/A</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {championStats[participant]
                                                    .sort((a, b) => b.games_played - a.games_played)
                                                    .map((stat) => (
                                                        <TableRow
                                                            key={`${participant}-${stat.champion}`}
                                                            className="border-slate-700 hover:bg-slate-800/30"
                                                        >
                                                            <TableCell>
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar className="h-8 w-8 ring-1 ring-slate-600">
                                                                        <AvatarImage
                                                                            src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/champion/${normalizeChampionName(stat.champion)}.png`}
                                                                            alt={`${stat.champion} champion icon`}
                                                                        />
                                                                        <AvatarFallback className="bg-slate-700 text-slate-200">
                                                                            {stat.champion.slice(0, 2)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="font-medium text-white">{stat.champion}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-slate-200">{stat.games_played}</TableCell>
                                                            <TableCell className="hidden sm:table-cell">
                                                                <div className="flex items-center gap-1">
                                                                    <span className="font-medium text-emerald-400">{stat.wins}</span>
                                                                    <span className="text-slate-400">/</span>
                                                                    <span className="font-medium text-red-400">{stat.losses}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className={`font-medium ${getWinRateColor(stat.win_rate)}`}>
                                                                    {stat.win_rate}%
                                                                </span>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant={getKDABadgeVariant(stat.avg_kda)}
                                                                    className={`${getKDAColor(stat.avg_kda)} border-current`}
                                                                >
                                                                    {stat.avg_kda}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="hidden text-sm text-slate-400 md:table-cell">
                                                                {Number(stat.avg_kills).toFixed(1)}/{Number(stat.avg_deaths).toFixed(1)}/
                                                                {Number(stat.avg_assists).toFixed(1)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
