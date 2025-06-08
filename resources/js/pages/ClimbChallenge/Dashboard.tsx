import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import RankProgressionChart from '@/components/ClimbChallenge/RankProgressionChart';
import ChampionStatsTable from '@/components/ClimbChallenge/ChampionStatsTable';
import RecentMatchesList from '@/components/ClimbChallenge/RecentMatchesList';


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
}

interface Participant {
    id: number;
    display_name: string;
    riot_id: string;
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
    chartData: Array<Record<string, string | number | null>>;
    players: string[];
}

interface RecentMatch {
    display_name: string;
    champion: string;
    kills: number;
    deaths: number;
    assists: number;
    result: string;
}

interface DashboardProps {
    participants: Participant[];
    championStats: Record<string, ChampionStat[]>;
    rankProgression: RankProgressionData;
    recentMatches: Record<string, RecentMatch[]>;
}

const getTierColor = (tier: string): string => {
    const tierColors: Record<string, string> = {
        'UNRANKED': 'bg-gray-600',
        'IRON': 'bg-gray-500',
        'BRONZE': 'bg-amber-600',
        'SILVER': 'bg-gray-400',
        'GOLD': 'bg-yellow-500',
        'PLATINUM': 'bg-teal-500',
        'EMERALD': 'bg-emerald-500',
        'DIAMOND': 'bg-blue-500',
        'MASTER': 'bg-purple-600',
        'GRANDMASTER': 'bg-red-600',
        'CHALLENGER': 'bg-orange-500',
    };
    return tierColors[tier?.toUpperCase()] || 'bg-gray-600';
};

const getRankValue = (tier: string, rank: string, lp: number): number => {
    const tierValues: Record<string, number> = {
        'UNRANKED': -400,
        'IRON': 0,
        'BRONZE': 400,
        'SILVER': 800,
        'GOLD': 1200,
        'PLATINUM': 1600,
        'EMERALD': 2000,
        'DIAMOND': 2400,
        'MASTER': 2800,
        'GRANDMASTER': 3200,
        'CHALLENGER': 3600,
    };
    
    const rankValues: Record<string, number> = {
        'IV': 0, 'III': 100, 'II': 200, 'I': 300
    };
    
    const tierValue = tierValues[tier?.toUpperCase()] || -400;
    const rankValue = rankValues[rank] || 0;
    
    return tierValue + rankValue + lp;
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
        <>
            <Head title="Climb Challenge Dashboard" />
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Climb Challenge Dashboard</h1>
                        <p className="text-muted-foreground">Track your friends' League of Legends climb progress</p>
                    </div>
                </div>

                <Tabs defaultValue="leaderboard" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                        <TabsTrigger value="champions">Champion Stats</TabsTrigger>
                        <TabsTrigger value="progression">Rank Progress</TabsTrigger>
                        <TabsTrigger value="matches">Recent Matches</TabsTrigger>
                    </TabsList>

                    <TabsContent value="leaderboard" className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {sortedParticipants.slice(0, 3).map((participant, index) => (
                                <Card key={participant.id} className={index === 0 ? "ring-2 ring-yellow-500" : ""}>
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <div className="relative">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage 
                                                    src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/profileicon/${participant.summoner?.profile_icon_id || '1'}.png`}
                                                    alt="Profile icon"
                                                />
                                                <AvatarFallback>{participant.display_name[0]}</AvatarFallback>
                                            </Avatar>
                                            {index < 3 && (
                                                <Badge className={`absolute -top-2 -right-2 ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'}`}>
                                                    #{index + 1}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold">{participant.display_name}</h3>
                                            <p className="text-sm text-muted-foreground">{participant.riot_id}</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {participant.summoner ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm">Rank</span>
                                                    <Badge className={getTierColor(participant.summoner.current_tier)}>
                                                        {participant.summoner.current_formatted_rank}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm">LP</span>
                                                    <span className="font-medium">{participant.summoner.current_league_points}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm">Win Rate</span>
                                                    <span className="font-medium">{participant.summoner.current_win_rate}%</span>
                                                </div>
                                                <Progress 
                                                    value={participant.summoner.current_win_rate} 
                                                    className="w-full"
                                                />
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>{participant.summoner.current_wins}W</span>
                                                    <span>{participant.summoner.current_losses}L</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">No data available</p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Full Leaderboard</CardTitle>
                                <CardDescription>Complete ranking of all participants</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">#</TableHead>
                                            <TableHead>Player</TableHead>
                                            <TableHead>Rank</TableHead>
                                            <TableHead>LP</TableHead>
                                            <TableHead>Games</TableHead>
                                            <TableHead>Win Rate</TableHead>
                                            <TableHead>Level</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedParticipants.map((participant, index) => (
                                            <TableRow key={participant.id}>
                                                <TableCell>
                                                    <Badge variant={index < 3 ? "default" : "secondary"}>
                                                        {index + 1}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage 
                                                                src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/profileicon/${participant.summoner?.profile_icon_id || '1'}.png`}
                                                                alt="Profile icon"
                                                            />
                                                            <AvatarFallback>{participant.display_name[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium">{participant.display_name}</div>
                                                            <div className="text-sm text-muted-foreground">{participant.riot_id}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {participant.summoner ? (
                                                        <Badge className={getTierColor(participant.summoner.current_tier)}>
                                                            {participant.summoner.current_formatted_rank}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {participant.summoner?.current_league_points || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {participant.summoner?.current_total_games || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {participant.summoner ? (
                                                        <span className={participant.summoner.current_win_rate >= 60 ? 'text-green-600' : participant.summoner.current_win_rate >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                                                            {participant.summoner.current_win_rate}%
                                                        </span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {participant.summoner?.level || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="champions">
                        <ChampionStatsTable championStats={championStats} />
                    </TabsContent>

                    <TabsContent value="progression">
                        <RankProgressionChart rankProgression={rankProgression} />
                    </TabsContent>

                    <TabsContent value="matches">
                        <RecentMatchesList recentMatches={recentMatches} />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
} 