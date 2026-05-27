import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import { BarChart2, Calendar, Clock, Eye, EyeOff, TrendingUp } from 'lucide-react';
import * as React from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';

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

interface RankProgressionChartProps {
    initialRankProgression: RankProgressionData | null;
}

interface HourlyData {
    chartData: Array<Record<string, string | number | RankMeta | null>>;
    players: string[];
    centerTime?: string;
    centerIndex?: number;
}

const chartPalette = [
    'hsl(205, 86%, 66%)',
    'hsl(349, 78%, 65%)',
    'hsl(137, 70%, 59%)',
    'hsl(38, 92%, 60%)',
    'hsl(279, 72%, 68%)',
    'hsl(184, 72%, 52%)',
];

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

const getPlayerColor = (playerName: string, index = 0): string => {
    if (index < chartPalette.length) {
        return chartPalette[index];
    }

    const hash = playerName.split('').reduce((acc, char) => char.charCodeAt(0) + (acc << 5) - acc, 0);
    const hue = Math.abs(hash) % 360;

    return `hsl(${hue}, 72%, 62%)`;
};

const isRankMeta = (value: unknown): value is RankMeta => {
    return typeof value === 'object' && value !== null && 'tier' in value && 'lp' in value;
};

const getRankMeta = (entry: Record<string, string | number | RankMeta | null> | undefined, player: string): RankMeta | null => {
    const value = entry?.[`${player}__rank`];

    return isRankMeta(value) ? value : null;
};

const formatRankMeta = (meta: RankMeta | null, fallbackValue: number | null): string => {
    if (meta !== null) {
        const tier = meta.tier.charAt(0) + meta.tier.slice(1).toLowerCase();
        const rank = ['MASTER', 'GRANDMASTER', 'CHALLENGER', 'UNRANKED'].includes(meta.tier) ? '' : ` ${meta.rank ?? ''}`;

        return `${tier}${rank} ${meta.lp}LP`.trim();
    }

    if (fallbackValue === null || fallbackValue < 0) {
        return 'Unranked';
    }

    if (fallbackValue >= rankBases.CHALLENGER) return `Challenger ${fallbackValue - rankBases.CHALLENGER}LP`;
    if (fallbackValue >= rankBases.GRANDMASTER) return `Grandmaster ${fallbackValue - rankBases.GRANDMASTER}LP`;
    if (fallbackValue >= rankBases.MASTER) return `Master ${fallbackValue - rankBases.MASTER}LP`;

    const tierOrder = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND'];
    const rankOrder = ['IV', 'III', 'II', 'I'];
    const tierIndex = Math.floor(fallbackValue / 400);
    const remainingValue = fallbackValue % 400;
    const rankIndex = Math.floor(remainingValue / 100);
    const lp = remainingValue % 100;

    return `${tierOrder[tierIndex] ?? 'Unknown'} ${rankOrder[rankIndex] ?? 'IV'} ${lp}LP`;
};

const formatTierLabel = (value: number, visibleApexTiers: Set<string>): string => {
    if (value < 0) return 'Unranked';
    if (visibleApexTiers.has('CHALLENGER') && value >= rankBases.CHALLENGER)
        return value === rankBases.CHALLENGER ? 'Challenger' : `Challenger +${value - rankBases.CHALLENGER}`;
    if (visibleApexTiers.has('GRANDMASTER') && value >= rankBases.GRANDMASTER)
        return value === rankBases.GRANDMASTER ? 'Grandmaster' : `Grandmaster +${value - rankBases.GRANDMASTER}`;
    if (value >= rankBases.MASTER) return value === rankBases.MASTER ? 'Master' : `Master +${value - rankBases.MASTER}`;

    const tierOrder = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond'];
    const tierIndex = Math.floor(value / 400);

    return tierOrder[tierIndex] ?? '';
};

const getRankImageUrl = (meta: RankMeta | null): string => {
    const tier = meta?.tier ?? 'UNRANKED';

    if (tier === 'UNRANKED') return '/assets/img/Rank=Unranked.png';

    const formattedTier = tier.charAt(0) + tier.slice(1).toLowerCase();
    return `/assets/img/Rank=${formattedTier}.png`;
};

const getNumericValue = (entry: Record<string, string | number | RankMeta | null>, key: string): number | null => {
    const value = entry[key];

    return typeof value === 'number' ? value : null;
};

const calculateDataRange = (data: Array<Record<string, string | number | RankMeta | null>>, players: string[]): { min: number; max: number } => {
    let min = Number.MAX_SAFE_INTEGER;
    let max = Number.MIN_SAFE_INTEGER;

    data.forEach((entry) => {
        players.forEach((player) => {
            const value = getNumericValue(entry, player);
            if (value !== null) {
                min = Math.min(min, value);
                max = Math.max(max, value);
            }
        });
    });

    if (min === Number.MAX_SAFE_INTEGER || max === Number.MIN_SAFE_INTEGER) {
        return { min: -400, max: rankBases.MASTER };
    }

    return { min, max };
};

const getVisibleApexTiers = (data: Array<Record<string, string | number | RankMeta | null>>, players: string[]): Set<string> => {
    const tiers = new Set<string>();

    data.forEach((entry) => {
        players.forEach((player) => {
            const meta = getRankMeta(entry, player);
            if (meta && ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(meta.tier)) {
                tiers.add(meta.tier);
            }
        });
    });

    return tiers;
};

const generateDynamicTicks = (min: number, max: number, viewType: 'daily' | 'hourly', visibleApexTiers: Set<string>): number[] => {
    const baseBoundaries = [-400, 0, 400, 800, 1200, 1600, 2000, 2400, rankBases.MASTER];
    const apexBoundaries = [rankBases.MASTER];

    if (visibleApexTiers.has('GRANDMASTER')) apexBoundaries.push(rankBases.GRANDMASTER);
    if (visibleApexTiers.has('CHALLENGER')) apexBoundaries.push(rankBases.CHALLENGER);

    const padding = viewType === 'daily' ? 220 : 120;
    const paddedMin = min - padding;
    const paddedMax = max + padding;
    const ticks = new Set([...baseBoundaries, ...apexBoundaries].filter((boundary) => boundary >= paddedMin && boundary <= paddedMax));

    const step = viewType === 'daily' ? 500 : 250;
    if (paddedMax > rankBases.MASTER) {
        for (let tick = rankBases.MASTER + step; tick <= Math.ceil(paddedMax / step) * step; tick += step) {
            ticks.add(tick);
        }
    }

    ticks.add(Math.floor(Math.max(-400, paddedMin) / 400) * 400);
    ticks.add(Math.ceil(paddedMax / 400) * 400);

    return Array.from(ticks).sort((a, b) => a - b);
};

const getLatestDataPoint = (data: Array<Record<string, string | number | RankMeta | null>>, player: string) => {
    for (let index = data.length - 1; index >= 0; index--) {
        if (getNumericValue(data[index], player) !== null) {
            return data[index];
        }
    }

    return undefined;
};

const getDelta = (data: Array<Record<string, string | number | RankMeta | null>>, player: string): number | null => {
    const values = data.map((entry) => getNumericValue(entry, player)).filter((value): value is number => value !== null);

    if (values.length < 2) return null;

    return values[values.length - 1] - values[0];
};

const formatDelta = (value: number | null): string => {
    if (value === null) return 'No movement';
    if (value === 0) return 'Even';

    return `${value > 0 ? '+' : ''}${value} LP`;
};

const formatDateLabel = (value: string): string => {
    return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
};

export default function RankProgressionChart({ initialRankProgression }: RankProgressionChartProps) {
    const [rankProgression, setRankProgression] = React.useState(initialRankProgression);
    const [viewType, setViewType] = React.useState<'daily' | 'hourly'>('daily');
    const [selectedDate, setSelectedDate] = React.useState<string>('');
    const [hourlyData, setHourlyData] = React.useState<HourlyData | null>(null);
    const [selectedPlayers, setSelectedPlayers] = React.useState<Set<string>>(new Set());
    const [isLoadingProgression, setIsLoadingProgression] = React.useState(initialRankProgression === null);
    const [isLoadingHourly, setIsLoadingHourly] = React.useState(false);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (rankProgression !== null) return;

        setIsLoadingProgression(true);
        axios
            .get<RankProgressionData>('/climb-challenge/rank-progression')
            .then((response) => {
                setRankProgression(response.data);
                setSelectedDate(response.data.availableDates[response.data.availableDates.length - 1]?.value ?? '');
            })
            .catch((error: unknown) => {
                console.error('Failed to load rank progression:', error);
            })
            .finally(() => {
                setIsLoadingProgression(false);
            });
    }, [rankProgression]);

    const players = React.useMemo(() => rankProgression?.players ?? [], [rankProgression]);
    const dailyChartData = React.useMemo(() => rankProgression?.dailyChartData ?? [], [rankProgression]);
    const availableDates = React.useMemo(() => rankProgression?.availableDates ?? [], [rankProgression]);

    React.useEffect(() => {
        if (selectedDate === '' && availableDates.length > 0) {
            setSelectedDate(availableDates[availableDates.length - 1].value);
        }
    }, [availableDates, selectedDate]);

    React.useEffect(() => {
        if (players.length > 0 && selectedPlayers.size === 0) {
            setSelectedPlayers(new Set(players));
        }
    }, [players, selectedPlayers.size]);

    React.useEffect(() => {
        if (viewType === 'hourly' && selectedDate) {
            setIsLoadingHourly(true);
            axios
                .get<HourlyData>('/climb-challenge/hourly-progression', {
                    params: {
                        date: selectedDate,
                        currentTime: new Date().toISOString(),
                    },
                })
                .then((response) => {
                    setHourlyData(response.data);
                })
                .catch((error: unknown) => {
                    console.error('Failed to load hourly data:', error);
                })
                .finally(() => {
                    setIsLoadingHourly(false);
                });
        }
    }, [viewType, selectedDate]);

    React.useEffect(() => {
        if (viewType === 'hourly' && hourlyData && hourlyData.centerIndex !== undefined && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const chartWidth = 1600;
            const dataPoints = hourlyData.chartData.length || 1;
            const pointWidth = chartWidth / dataPoints;
            const centerPosition = hourlyData.centerIndex * pointWidth - container.clientWidth / 2;

            container.scrollTo({
                left: Math.max(0, centerPosition),
                behavior: 'smooth',
            });
        }
    }, [viewType, hourlyData]);

    const chartConfig: ChartConfig = React.useMemo(() => {
        return players.reduce((config, player, index) => {
            config[player] = {
                label: player,
                color: getPlayerColor(player, index),
            };

            return config;
        }, {} as ChartConfig);
    }, [players]);

    const currentData = React.useMemo(
        () => (viewType === 'daily' ? dailyChartData : (hourlyData?.chartData ?? [])),
        [dailyChartData, hourlyData, viewType],
    );
    const allCurrentPlayers = React.useMemo(() => (viewType === 'daily' ? players : (hourlyData?.players ?? [])), [hourlyData, players, viewType]);
    const currentPlayers = React.useMemo(
        () => allCurrentPlayers.filter((player) => selectedPlayers.has(player)),
        [allCurrentPlayers, selectedPlayers],
    );
    const xAxisKey = viewType === 'daily' ? 'date' : 'time';
    const visibleApexTiers = React.useMemo(() => getVisibleApexTiers(currentData, currentPlayers), [currentData, currentPlayers]);
    const { dataRange, dynamicTicks } = React.useMemo(() => {
        const range = calculateDataRange(currentData, currentPlayers);
        const ticks = generateDynamicTicks(range.min, range.max, viewType, visibleApexTiers);

        return { dataRange: range, dynamicTicks: ticks };
    }, [currentData, currentPlayers, viewType, visibleApexTiers]);
    const latestPoints = currentPlayers.map((player) => {
        const latestEntry = getLatestDataPoint(currentData, player);
        const value = latestEntry ? getNumericValue(latestEntry, player) : null;

        return {
            player,
            value,
            meta: getRankMeta(latestEntry, player),
            delta: getDelta(currentData, player),
            color: chartConfig[player]?.color ?? getPlayerColor(player),
        };
    });
    const yMin = Math.max(-400, Math.min(...dynamicTicks, dataRange.min) - (viewType === 'daily' ? 120 : 80));
    const yMax = Math.max(...dynamicTicks, dataRange.max) + (viewType === 'daily' ? 140 : 80);

    const togglePlayer = (player: string) => {
        setSelectedPlayers((current) => {
            const next = new Set(current);

            if (next.has(player)) {
                next.delete(player);
            } else {
                next.add(player);
            }

            return next;
        });
    };

    if (isLoadingProgression) {
        return (
            <Card className="border-border/80 bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Rank Progression
                    </CardTitle>
                    <CardDescription>Loading comparison data after the leaderboard renders.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex h-80 items-center justify-center text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary" />
                            Loading progression...
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (currentData.length === 0 || allCurrentPlayers.length === 0) {
        return (
            <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Rank Progression
                    </CardTitle>
                    <CardDescription>Track rank progress over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex h-64 items-center justify-center text-muted-foreground">
                        {isLoadingHourly ? 'Loading hourly data...' : 'No progression data available'}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="min-w-0 overflow-hidden border-border/80 bg-card shadow-sm">
            <CardHeader className="gap-5 pb-3">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1.5">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <BarChart2 className="h-4 w-4 text-primary" />
                            Rank Progression
                        </CardTitle>
                        <CardDescription>
                            Select players to compare exact climb paths. Apex tiers use the stored Riot tier, not guessed LP bands.
                        </CardDescription>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="grid grid-cols-2 rounded-md border border-border/70 bg-muted/30 p-1">
                            <Button
                                variant={viewType === 'daily' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewType('daily')}
                                className="h-8 gap-2 px-3"
                            >
                                <Calendar className="h-4 w-4" />
                                Daily
                            </Button>
                            <Button
                                variant={viewType === 'hourly' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewType('hourly')}
                                className="h-8 gap-2 px-3"
                            >
                                <Clock className="h-4 w-4" />
                                Hourly
                            </Button>
                        </div>

                        {viewType === 'hourly' && (
                            <Select value={selectedDate} onValueChange={setSelectedDate}>
                                <SelectTrigger className="h-10 w-full sm:w-44">
                                    <SelectValue placeholder="Select date" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableDates.map((date) => (
                                        <SelectItem key={date.value} value={date.value}>
                                            {date.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedPlayers(new Set(players))}>
                        <Eye className="mr-2 h-4 w-4" />
                        All
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedPlayers(new Set(players.slice(0, 2)))}>
                        Top 2
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPlayers(new Set())}>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Clear
                    </Button>
                    {players.map((player) => {
                        const selected = selectedPlayers.has(player);

                        return (
                            <Button
                                key={player}
                                variant={selected ? 'secondary' : 'outline'}
                                size="sm"
                                onClick={() => togglePlayer(player)}
                                className="gap-2"
                            >
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartConfig[player]?.color }} />
                                {player}
                            </Button>
                        );
                    })}
                </div>

                {latestPoints.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {latestPoints.map(({ player, value, meta, delta, color }) => (
                            <div key={player} className="rounded-md border border-border/70 bg-background/40 px-3 py-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                                        <span className="truncate text-sm font-medium">{player}</span>
                                    </div>
                                    <span
                                        className={`text-xs tabular-nums ${delta && delta > 0 ? 'text-emerald-400' : delta && delta < 0 ? 'text-rose-400' : 'text-muted-foreground'}`}
                                    >
                                        {formatDelta(delta)}
                                    </span>
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                    <img src={getRankImageUrl(meta)} alt="" className="h-5 w-5 object-contain" />
                                    <span>{formatRankMeta(meta, value)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardHeader>
            <CardContent className="px-2 pb-5 sm:px-5">
                {currentPlayers.length === 0 ? (
                    <div className="flex h-80 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                        Select at least one player to show the progression chart.
                    </div>
                ) : (
                    <>
                        <div
                            ref={viewType === 'hourly' ? scrollContainerRef : null}
                            className={viewType === 'hourly' ? 'w-full overflow-x-auto' : 'min-w-0'}
                        >
                            <ChartContainer
                                config={chartConfig}
                                className={`aspect-auto h-[430px] ${viewType === 'hourly' ? 'w-[1600px] min-w-full' : 'w-full'}`}
                            >
                                <LineChart data={currentData} margin={{ top: 20, right: 22, bottom: 8, left: 6 }} accessibilityLayer>
                                    <CartesianGrid vertical={false} strokeDasharray="4 8" stroke="hsl(var(--border))" strokeOpacity={0.65} />
                                    {dynamicTicks.map((tick) => (
                                        <ReferenceLine key={tick} y={tick} stroke="hsl(var(--border))" strokeOpacity={0.32} strokeDasharray="3 7" />
                                    ))}
                                    <XAxis
                                        dataKey={xAxisKey}
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={12}
                                        minTickGap={viewType === 'hourly' ? 18 : 42}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        tickFormatter={(value) => {
                                            if (viewType === 'daily') return formatDateLabel(String(value));

                                            const dataPoint = currentData.find((entry) => entry.time === value);
                                            return value === '00:00' && dataPoint?.display ? String(dataPoint.display) : String(value);
                                        }}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                        width={104}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                        domain={[yMin, yMax]}
                                        ticks={dynamicTicks}
                                        tickFormatter={(value) => formatTierLabel(Number(value), visibleApexTiers)}
                                    />
                                    <ChartTooltip
                                        content={({ active, payload, label }) => {
                                            if (!active || !payload || payload.length === 0) return null;

                                            const dataPoint = currentData.find((entry) => entry.time === label || entry.date === label);
                                            const displayLabel =
                                                viewType === 'daily'
                                                    ? new Date(String(label)).toLocaleDateString('en-US', {
                                                          month: 'short',
                                                          day: 'numeric',
                                                          year: 'numeric',
                                                      })
                                                    : String(dataPoint?.display ?? `${selectedDate} at ${label}`);

                                            return (
                                                <div className="min-w-64 rounded-lg border border-border/80 bg-popover p-3 text-popover-foreground shadow-xl">
                                                    <div className="mb-3 text-sm font-semibold">{displayLabel}</div>
                                                    <div className="space-y-2">
                                                        {payload.map((entry) => {
                                                            const playerName = String(entry.dataKey);
                                                            const value = typeof entry.value === 'number' ? entry.value : null;
                                                            const meta = getRankMeta(dataPoint, playerName);
                                                            const color = String(
                                                                entry.color ?? chartConfig[playerName]?.color ?? getPlayerColor(playerName),
                                                            );

                                                            return (
                                                                <div key={playerName} className="flex items-center justify-between gap-4">
                                                                    <div className="flex min-w-0 items-center gap-2">
                                                                        <span
                                                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                                                            style={{ backgroundColor: color }}
                                                                        />
                                                                        <span className="truncate text-sm font-medium">{playerName}</span>
                                                                    </div>
                                                                    <div className="flex shrink-0 items-center gap-2">
                                                                        <img src={getRankImageUrl(meta)} alt="" className="h-6 w-6 object-contain" />
                                                                        <span className="text-sm font-medium">{formatRankMeta(meta, value)}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        }}
                                    />
                                    {currentPlayers.map((player) => (
                                        <Line
                                            key={player}
                                            dataKey={player}
                                            type="linear"
                                            stroke={chartConfig[player]?.color}
                                            strokeWidth={2.5}
                                            dot={false}
                                            activeDot={{ r: 5, stroke: 'hsl(var(--background))', strokeWidth: 2, fill: chartConfig[player]?.color }}
                                            connectNulls={false}
                                        />
                                    ))}
                                </LineChart>
                            </ChartContainer>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                            {currentPlayers.map((player) => (
                                <div key={player} className="flex items-center gap-2">
                                    <span className="h-2 w-6 rounded-full" style={{ backgroundColor: chartConfig[player]?.color }} />
                                    <span>{player}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
