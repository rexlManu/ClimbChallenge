import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

export default function ChampionStatsTable({ championStats }: ChampionStatsTableProps) {
    const participants = Object.keys(championStats);

    // Helper function to normalize champion names for ddragon URLs (remove apostrophes)
    const normalizeChampionName = (championName: string): string => {
        return championName.replace(/'/g, '').replace(' ', '');
    };

    if (participants.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Champion Statistics</CardTitle>
                    <CardDescription>Performance breakdown by champion</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                        No champion statistics available
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Get all champions and their overall stats
    const allChampions = participants.flatMap(participant => 
        championStats[participant].map(stat => stat.champion)
    );
    const uniqueChampions = Array.from(new Set(allChampions));

    const overallChampionStats = uniqueChampions.map(champion => {
        const allStats = participants.flatMap(participant => 
            championStats[participant].filter(stat => stat.champion === champion)
        );

        const totalGames = allStats.reduce((sum, stat) => sum + Number(stat.games_played), 0);
        const totalWins = allStats.reduce((sum, stat) => sum + Number(stat.wins), 0);
        const totalLosses = allStats.reduce((sum, stat) => sum + Number(stat.losses), 0);
        const avgKills = allStats.reduce((sum, stat) => sum + (Number(stat.avg_kills) * Number(stat.games_played)), 0) / totalGames;
        const avgDeaths = allStats.reduce((sum, stat) => sum + (Number(stat.avg_deaths) * Number(stat.games_played)), 0) / totalGames;
        const avgAssists = allStats.reduce((sum, stat) => sum + (Number(stat.avg_assists) * Number(stat.games_played)), 0) / totalGames;
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
    }).sort((a, b) => b.totalGames - a.totalGames);

    return (
        <div className="space-y-6">
            <Tabs defaultValue="overall" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overall">Overall Stats</TabsTrigger>
                    <TabsTrigger value="individual">Individual Stats</TabsTrigger>
                </TabsList>

                <TabsContent value="overall">
                    <Card>
                        <CardHeader>
                            <CardTitle>Champion Performance Overview</CardTitle>
                            <CardDescription>Combined statistics across all participants</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Champion</TableHead>
                                        <TableHead>Games</TableHead>
                                        <TableHead>Win Rate</TableHead>
                                        <TableHead>Avg KDA</TableHead>
                                        <TableHead>K/D/A</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {overallChampionStats.map((stat) => (
                                        <TableRow key={stat.champion}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage 
                                                            src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/champion/${normalizeChampionName(stat.champion)}.png`}
                                                            alt={`${stat.champion} champion icon`}
                                                        />
                                                        <AvatarFallback>{stat.champion.slice(0, 2)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{stat.champion}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{stat.totalGames}</TableCell>
                                            <TableCell>
                                                <span className={stat.winRate >= 60 ? 'text-green-600' : stat.winRate >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                                                    {stat.winRate}%
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={stat.avgKda >= 2 ? 'default' : stat.avgKda >= 1.5 ? 'secondary' : 'destructive'}>
                                                    {stat.avgKda}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {stat.avgKills}/{stat.avgDeaths}/{stat.avgAssists}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="individual">
                    <div className="grid gap-6">
                        {participants.map((participant) => (
                            <Card key={participant}>
                                <CardHeader>
                                    <CardTitle>{participant} - Champion Statistics</CardTitle>
                                    <CardDescription>Individual champion performance</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Champion</TableHead>
                                                <TableHead>Games</TableHead>
                                                <TableHead>W/L</TableHead>
                                                <TableHead>Win Rate</TableHead>
                                                <TableHead>KDA</TableHead>
                                                <TableHead>K/D/A</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {championStats[participant]
                                                .sort((a, b) => b.games_played - a.games_played)
                                                .map((stat) => (
                                                <TableRow key={`${participant}-${stat.champion}`}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage 
                                                                    src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/champion/${normalizeChampionName(stat.champion)}.png`}
                                                                    alt={`${stat.champion} champion icon`}
                                                                />
                                                                <AvatarFallback>{stat.champion.slice(0, 2)}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-medium">{stat.champion}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{stat.games_played}</TableCell>
                                                    <TableCell>
                                                        <span className="text-green-600">{stat.wins}</span>
                                                        /
                                                        <span className="text-red-600">{stat.losses}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={stat.win_rate >= 60 ? 'text-green-600' : stat.win_rate >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                                                            {stat.win_rate}%
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={stat.avg_kda >= 2 ? 'default' : stat.avg_kda >= 1.5 ? 'secondary' : 'destructive'}>
                                                            {stat.avg_kda}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {Number(stat.avg_kills).toFixed(1)}/{Number(stat.avg_deaths).toFixed(1)}/{Number(stat.avg_assists).toFixed(1)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
} 