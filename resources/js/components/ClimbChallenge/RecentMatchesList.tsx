import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import axios from 'axios';
import { Clock, Swords } from 'lucide-react';
import * as React from 'react';

interface MatchPlayer {
    id: number;
    name: string;
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
    match_date: string;
}

interface RecentMatchesResponse {
    matches: RecentMatch[];
}

interface RecentMatchesListProps {
    players: MatchPlayer[];
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
        return <Badge variant="secondary">0</Badge>;
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

export default function RecentMatchesList({ players }: RecentMatchesListProps) {
    const [selectedSummonerId, setSelectedSummonerId] = React.useState<string>(players[0]?.id.toString() ?? '');
    const [matches, setMatches] = React.useState<RecentMatch[]>([]);
    const [isLoading, setIsLoading] = React.useState(players.length > 0);

    React.useEffect(() => {
        if (selectedSummonerId !== '' || players.length === 0) return;

        setSelectedSummonerId(players[0].id.toString());
    }, [players, selectedSummonerId]);

    React.useEffect(() => {
        if (selectedSummonerId === '') {
            setMatches([]);
            return;
        }

        setIsLoading(true);
        axios
            .get<RecentMatchesResponse>('/climb-challenge/recent-matches', {
                params: {
                    summoner_id: selectedSummonerId,
                },
            })
            .then((response) => {
                setMatches(response.data.matches);
            })
            .catch((error: unknown) => {
                console.error('Failed to load recent matches:', error);
                setMatches([]);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [selectedSummonerId]);

    if (players.length === 0) {
        return (
            <Card className="min-w-0 border-border/70 bg-card/85">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Recent Games
                    </CardTitle>
                    <CardDescription>Latest games from one tracked summoner</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex h-40 items-center justify-center text-muted-foreground">No ranked players available.</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/70 bg-card/85">
            <CardHeader className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Swords className="h-5 w-5 text-sky-300" />
                            Recent Games
                        </CardTitle>
                        <CardDescription>Pick one player and load their latest 20 tracked games.</CardDescription>
                    </div>
                    <Select value={selectedSummonerId} onValueChange={setSelectedSummonerId}>
                        <SelectTrigger className="w-full sm:w-64">
                            <SelectValue placeholder="Select player" />
                        </SelectTrigger>
                        <SelectContent>
                            {players.map((player) => (
                                <SelectItem key={player.id} value={player.id.toString()}>
                                    {player.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="flex h-48 items-center justify-center text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary" />
                            Loading recent games...
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="max-w-full overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-muted/30">
                                        <TableHead>Champion</TableHead>
                                        <TableHead>Result</TableHead>
                                        <TableHead>KDA</TableHead>
                                        <TableHead className="hidden sm:table-cell">Score</TableHead>
                                        <TableHead className="hidden sm:table-cell">LP</TableHead>
                                        <TableHead className="hidden md:table-cell">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {matches.map((match, index) => {
                                        const kda = getKDAScore(match.kills, match.deaths, match.assists);

                                        return (
                                            <TableRow key={`${match.match_date}-${match.champion}-${index}`} className="hover:bg-muted/30">
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

                        {matches.length === 0 && (
                            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                                No tracked matches for this player yet.
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
