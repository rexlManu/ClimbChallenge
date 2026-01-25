import RankProgressionChart from '@/components/ClimbChallenge/RankProgressionChart';
import RecentMatchesList from '@/components/ClimbChallenge/RecentMatchesList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Sword, Trophy, User } from 'lucide-react';

interface ProfileProps {
    participant: any;
    recentMatches: any;
    rankProgression: any;
    championStats: any[];
}

export default function Profile({ participant, recentMatches, rankProgression, championStats }: ProfileProps) {
    const getTierColor = (tier: string) => {
        const colors: Record<string, string> = {
            IRON: 'bg-stone-500 text-white',
            BRONZE: 'bg-orange-700 text-white',
            SILVER: 'bg-slate-400 text-slate-900',
            GOLD: 'bg-yellow-500 text-black',
            PLATINUM: 'bg-cyan-500 text-black',
            EMERALD: 'bg-emerald-500 text-white',
            DIAMOND: 'bg-blue-500 text-white',
            MASTER: 'bg-purple-600 text-white',
            GRANDMASTER: 'bg-red-600 text-white',
            CHALLENGER: 'bg-yellow-300 text-black',
        };
        return colors[tier] || 'bg-slate-500 text-white';
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: participant.display_name, href: `/player/${participant.id}` }
        ]}>
            <Head title={`${participant.display_name} - Profile`} />

            <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                    <Card className="flex-1 border-border bg-card shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col gap-6 md:flex-row md:items-center">
                                <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
                                    <AvatarImage
                                        src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/profileicon/${participant.summoner?.profile_icon_id || '1'}.png`}
                                        alt="Profile icon"
                                    />
                                    <AvatarFallback className="text-2xl">{participant.display_name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-2 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h1 className="text-3xl font-bold">{participant.display_name}</h1>
                                        {participant.summoner && (
                                            <Badge className={getTierColor(participant.summoner.current_tier)}>
                                                {participant.summoner.current_formatted_rank}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        <span>{participant.riot_id}</span>
                                        {participant.summoner && (
                                            <>
                                                <span className="mx-2">•</span>
                                                <span>Level {participant.summoner.level}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {participant.summoner && (
                                    <div className="flex flex-col gap-4 min-w-[200px]">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Win Rate</span>
                                                <span className={participant.summoner.current_win_rate >= 50 ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>
                                                    {participant.summoner.current_win_rate}%
                                                </span>
                                            </div>
                                            <Progress value={participant.summoner.current_win_rate} className="h-2" />
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>{participant.summoner.current_wins}W</span>
                                                <span>{participant.summoner.current_losses}L</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-center">
                                            <div className="rounded-lg bg-muted/50 p-2">
                                                <div className="text-2xl font-bold text-primary">{participant.summoner.current_league_points}</div>
                                                <div className="text-xs text-muted-foreground">BP</div>
                                            </div>
                                            <div className="rounded-lg bg-muted/50 p-2">
                                                <div className="text-2xl font-bold text-primary">{participant.summoner.total_dodges}</div>
                                                <div className="text-xs text-muted-foreground">Dodges</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="matches">Match History</TabsTrigger>
                        <TabsTrigger value="champions">Champions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <RankProgressionChart rankProgression={rankProgression} />

                            <Card className="border-border bg-card shadow-sm h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-primary" />
                                        Top Champions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {championStats.slice(0, 5).map((stat: any) => (
                                            <div key={stat.champion} className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10 ring-1 ring-border">
                                                    <AvatarImage src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/champion/${stat.champion}.png`} />
                                                    <AvatarFallback>{stat.champion[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{stat.champion}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {stat.games_played} games • {stat.win_rate}% WR
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium">{stat.avg_kda} KDA</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {Number(stat.avg_kills).toFixed(1)} / {Number(stat.avg_deaths).toFixed(1)} / {Number(stat.avg_assists).toFixed(1)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {championStats.length === 0 && (
                                            <div className="text-center text-muted-foreground py-4">No champion data available</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                            <RecentMatchesList recentMatches={recentMatches} showSummary={false} showPlayerColumn={false} />
                        </div>
                    </TabsContent>

                    <TabsContent value="matches">
                        <RecentMatchesList recentMatches={recentMatches} showSummary={false} showPlayerColumn={false} />
                    </TabsContent>

                    <TabsContent value="champions">
                        <Card className="border-border bg-card shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sword className="h-5 w-5 text-primary" />
                                    Champion Statistics
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {championStats.map((stat: any) => (
                                        <Card key={stat.champion} className="relative overflow-hidden">
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <Avatar className="h-12 w-12 ring-2 ring-border">
                                                    <AvatarImage src={`https://ddragon.leagueoflegends.com/cdn/15.11.1/img/champion/${stat.champion}.png`} />
                                                    <AvatarFallback>{stat.champion[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold truncate">{stat.champion}</h4>
                                                        <Badge variant={stat.win_rate >= 50 ? "default" : "destructive"} className="ml-2">
                                                            {stat.win_rate}%
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {stat.games_played} Played ({stat.wins}W - {stat.losses}L)
                                                    </p>
                                                    <div className="mt-2 text-sm font-medium">
                                                        KDA: <span className={Number(stat.avg_kda) >= 3 ? 'text-emerald-500' : ''}>{stat.avg_kda}</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
