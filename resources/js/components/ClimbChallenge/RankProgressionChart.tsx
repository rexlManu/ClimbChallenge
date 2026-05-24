import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import { BarChart2, Calendar, Clock, TrendingUp } from 'lucide-react';
import * as React from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';

interface RankProgressionData {
    dailyChartData: Array<Record<string, string | number | null>>;
    players: string[];
    availableDates: Array<{ value: string; label: string }>;
}

interface RankProgressionChartProps {
    rankProgression: RankProgressionData;
}

interface HourlyData {
    chartData: Array<Record<string, string | number | null>>;
    players: string[];
    centerTime?: string;
    centerIndex?: number;
}

const chartPalette = ['hsl(222, 86%, 66%)', 'hsl(349, 78%, 65%)', 'hsl(137, 70%, 59%)', 'hsl(38, 92%, 60%)', 'hsl(279, 72%, 68%)', 'hsl(184, 72%, 52%)'];

const getPlayerColor = (playerName: string, index = 0): string => {
    if (index < chartPalette.length) {
        return chartPalette[index];
    }

    const hash = playerName.split('').reduce((acc, char) => char.charCodeAt(0) + (acc << 5) - acc, 0);
    const hue = Math.abs(hash) % 360;

    return `hsl(${hue}, 72%, 62%)`;
};

const formatRankValue = (value: number): string => {
    if (value < 0) {
        return 'Unranked';
    }

    if (value >= 3600) {
        return `Challenger ${value - 3600}LP`;
    }

    if (value >= 3200) {
        return `Grandmaster ${value - 3200}LP`;
    }

    if (value >= 2800) {
        return `Master ${value - 2800}LP`;
    }

    const tierOrder = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
    const rankOrder = ['IV', 'III', 'II', 'I'];

    const tierIndex = Math.floor(value / 400);
    const remainingValue = value % 400;
    const rankIndex = Math.floor(remainingValue / 100);
    const lp = remainingValue % 100;

    const tier = tierOrder[tierIndex] || 'UNKNOWN';
    const rank = tier === 'MASTER' || tier === 'GRANDMASTER' || tier === 'CHALLENGER' ? '' : rankOrder[rankIndex] || 'IV';

    return `${tier} ${rank} ${lp}LP`.trim();
};

const formatTierLabel = (value: number): string => {
    if (value < 0) {
        return 'Unranked';
    }

    if (value > 3600) {
        return `Challenger +${value - 3600}`;
    }

    const tierOrder = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'];
    const tierIndex = Math.floor(value / 400);

    return tierOrder[tierIndex] ?? '';
};

const getRankImageUrl = (value: number): string => {
    if (value < 0) {
        return `/assets/img/Rank=Unranked.png`;
    }

    if (value >= 3600) {
        return `/assets/img/Rank=Challenger.png`;
    }

    if (value >= 3200) {
        return `/assets/img/Rank=Grandmaster.png`;
    }

    if (value >= 2800) {
        return `/assets/img/Rank=Master.png`;
    }

    const tierOrder = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
    const tierIndex = Math.floor(value / 400);
    const tier = tierOrder[tierIndex] || 'IRON';

    const formattedTier = tier.charAt(0) + tier.slice(1).toLowerCase();
    return `/assets/img/Rank=${formattedTier}.png`;
};

const calculateDataRange = (data: Array<Record<string, string | number | null>>, players: string[]): { min: number; max: number } => {
    let min = Number.MAX_SAFE_INTEGER;
    let max = Number.MIN_SAFE_INTEGER;

    data.forEach((entry) => {
        players.forEach((player) => {
            const value = entry[player];
            if (typeof value === 'number') {
                min = Math.min(min, value);
                max = Math.max(max, value);
            }
        });
    });

    if (min === Number.MAX_SAFE_INTEGER || max === Number.MIN_SAFE_INTEGER) {
        return { min: -400, max: 3600 };
    }

    return { min, max };
};

const generateDynamicTicks = (min: number, max: number, viewType: 'daily' | 'hourly'): number[] => {
    const tierBoundaries = [-400, 0, 400, 800, 1200, 1600, 2000, 2400, 2800, 3200, 3600];

    const padding = viewType === 'daily' ? 300 : 160;
    const paddedMin = min - padding;
    const paddedMax = max + padding;

    const relevantBoundaries = tierBoundaries.filter((boundary) => boundary >= paddedMin && boundary <= paddedMax);

    const minBoundary = tierBoundaries.filter((b) => b <= paddedMin).pop();
    const maxBoundary = tierBoundaries.filter((b) => b >= paddedMax)[0];

    if (minBoundary !== undefined && !relevantBoundaries.includes(minBoundary)) {
        relevantBoundaries.unshift(minBoundary);
    }
    if (maxBoundary !== undefined && !relevantBoundaries.includes(maxBoundary)) {
        relevantBoundaries.push(maxBoundary);
    }

    if (paddedMax > 3600) {
        const highEloStep = viewType === 'daily' ? 1000 : 500;
        const highEloMax = Math.ceil(paddedMax / highEloStep) * highEloStep;

        for (let tick = 3600 + highEloStep; tick <= highEloMax; tick += highEloStep) {
            relevantBoundaries.push(tick);
        }
    }

    if (viewType === 'hourly') {
        const additionalTicks: number[] = [];
        for (let i = 0; i < relevantBoundaries.length - 1; i++) {
            const tierStart = relevantBoundaries[i];
            const tierEnd = relevantBoundaries[i + 1];

            if (tierStart >= paddedMin && tierEnd <= paddedMax) {
                for (let div = tierStart + 100; div < tierEnd; div += 100) {
                    if (div >= paddedMin && div <= paddedMax) {
                        additionalTicks.push(div);
                    }
                }
            }
        }
        relevantBoundaries.push(...additionalTicks);
    }

    return relevantBoundaries.sort((a, b) => a - b);
};

const getNumericValue = (entry: Record<string, string | number | null>, key: string): number | null => {
    const value = entry[key];

    return typeof value === 'number' ? value : null;
};

const getLatestPlayerValue = (data: Array<Record<string, string | number | null>>, player: string): number | null => {
    for (let index = data.length - 1; index >= 0; index--) {
        const value = getNumericValue(data[index], player);

        if (value !== null) {
            return value;
        }
    }

    return null;
};

const getDelta = (data: Array<Record<string, string | number | null>>, player: string): number | null => {
    const values = data.map((entry) => getNumericValue(entry, player)).filter((value): value is number => value !== null);

    if (values.length < 2) {
        return null;
    }

    return values[values.length - 1] - values[0];
};

const formatDelta = (value: number | null): string => {
    if (value === null) {
        return 'No movement';
    }

    if (value === 0) {
        return 'Even';
    }

    return `${value > 0 ? '+' : ''}${value} LP`;
};

const formatDateLabel = (value: string): string => {
    const date = new Date(value);

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
};

export default function RankProgressionChart({ rankProgression }: RankProgressionChartProps) {
    const { dailyChartData, players, availableDates } = rankProgression;
    const [viewType, setViewType] = React.useState<'daily' | 'hourly'>('daily');
    const [selectedDate, setSelectedDate] = React.useState<string>(availableDates[availableDates.length - 1]?.value || '');
    const [hourlyData, setHourlyData] = React.useState<HourlyData | null>(null);
    const [isLoadingHourly, setIsLoadingHourly] = React.useState(false);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const chartConfig: ChartConfig = React.useMemo(() => {
        if (!players) return {};
        return players.reduce((config, player, index) => {
            config[player] = {
                label: player,
                color: getPlayerColor(player, index),
            };
            return config;
        }, {} as ChartConfig);
    }, [players]);

    const { dataRange, dynamicTicks } = React.useMemo(() => {
        const currentData = viewType === 'daily' ? dailyChartData : hourlyData?.chartData || [];
        const currentPlayers = viewType === 'daily' ? players : hourlyData?.players || [];

        if (!currentData || currentData.length === 0 || !currentPlayers || currentPlayers.length === 0) {
            return { dataRange: { min: -400, max: 3600 }, dynamicTicks: [-400, 0, 400, 800, 1200, 1600, 2000, 2400, 2800, 3200, 3600] };
        }

        const dataRange = calculateDataRange(currentData, currentPlayers);
        const dynamicTicks = generateDynamicTicks(dataRange.min, dataRange.max, viewType);

        return { dataRange, dynamicTicks };
    }, [viewType, dailyChartData, hourlyData, players]);

    React.useEffect(() => {
        if (viewType === 'hourly' && selectedDate) {
            setIsLoadingHourly(true);
            const currentTime = new Date().toISOString();
            axios
                .get('/climb-challenge/hourly-progression', {
                    params: {
                        date: selectedDate,
                        currentTime: currentTime,
                    },
                })
                .then((response) => {
                    setHourlyData(response.data);
                })
                .catch((error) => {
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
            const dataPoints = hourlyData.chartData.length;
            const pointWidth = chartWidth / dataPoints;
            const centerPosition = hourlyData.centerIndex * pointWidth - container.clientWidth / 2;

            container.scrollTo({
                left: Math.max(0, centerPosition),
                behavior: 'smooth',
            });
        }
    }, [viewType, hourlyData]);

    const currentData = viewType === 'daily' ? dailyChartData : hourlyData?.chartData || [];
    const currentPlayers = viewType === 'daily' ? players : hourlyData?.players || [];
    const xAxisKey = viewType === 'daily' ? 'date' : 'time';
    const latestPoints = currentPlayers.map((player) => ({
        player,
        value: getLatestPlayerValue(currentData, player),
        delta: getDelta(currentData, player),
        color: chartConfig[player]?.color ?? getPlayerColor(player),
    }));
    const yMin = Math.max(-400, Math.min(...dynamicTicks) - (viewType === 'daily' ? 160 : 80));
    const yMax = Math.max(...dynamicTicks) + (viewType === 'daily' ? 160 : 80);

    if (!currentData || currentData.length === 0 || !currentPlayers || currentPlayers.length === 0) {
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
                        {isLoadingHourly ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
                                Loading hourly data...
                            </div>
                        ) : (
                            'No progression data available'
                        )}
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
                        <CardDescription>Tier movement across tracked solo queue snapshots.</CardDescription>
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

                <div className="grid gap-2 sm:grid-cols-3">
                    {latestPoints.map(({ player, value, delta, color }) => (
                        <div key={player} className="rounded-md border border-border/70 bg-background/40 px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                                    <span className="truncate text-sm font-medium">{player}</span>
                                </div>
                                <span className={`text-xs tabular-nums ${delta && delta > 0 ? 'text-emerald-400' : delta && delta < 0 ? 'text-rose-400' : 'text-muted-foreground'}`}>
                                    {formatDelta(delta)}
                                </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                {value !== null && <img src={getRankImageUrl(value)} alt="" className="h-5 w-5 object-contain" />}
                                <span>{value !== null ? formatRankValue(value) : 'No rank data'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="px-2 pb-5 sm:px-5">
                <div ref={viewType === 'hourly' ? scrollContainerRef : null} className={viewType === 'hourly' ? 'w-full overflow-x-auto' : 'min-w-0'}>
                    <ChartContainer
                        config={chartConfig}
                        className={`aspect-auto h-[430px] ${viewType === 'hourly' ? 'w-[1600px] min-w-full' : 'w-full'}`}
                    >
                        <LineChart
                            accessibilityLayer
                            data={currentData}
                            margin={{
                                top: 20,
                                right: 22,
                                bottom: 8,
                                left: 6,
                            }}
                        >
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
                                    if (viewType === 'daily') {
                                        return formatDateLabel(String(value));
                                    }

                                    const dataPoint = currentData.find((d) => d.time === value);
                                    if (dataPoint && dataPoint.display) {
                                        return value === '00:00' ? String(dataPoint.display) : String(value);
                                    }

                                    return String(value);
                                }}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                width={82}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                domain={[yMin, yMax]}
                                ticks={dynamicTicks}
                                tickFormatter={(value) => {
                                    const tier = formatTierLabel(Number(value));

                                    if (viewType === 'hourly' && tier && Number(value) >= 0) {
                                        const remainingValue = Number(value) % 400;
                                        const rankIndex = Math.floor(remainingValue / 100);
                                        const rankOrder = ['IV', 'III', 'II', 'I'];
                                        const rank = ['Master', 'Grandmaster', 'Challenger'].includes(tier) ? '' : rankOrder[rankIndex] || 'IV';

                                        return rank ? `${tier} ${rank}` : tier;
                                    }

                                    return tier;
                                }}
                            />
                            <ChartTooltip
                                content={({ active, payload, label }) => {
                                    if (!active || !payload || !payload.length) {
                                        return null;
                                    }

                                    // Find the corresponding data point for better tooltip info
                                    const dataPoint = currentData.find((d) => d.time === label || d.date === label);
                                    const displayLabel =
                                        viewType === 'daily'
                                            ? new Date(String(label)).toLocaleDateString('en-US', {
                                                  month: 'short',
                                                  day: 'numeric',
                                                  year: 'numeric',
                                              })
                                            : dataPoint?.display || `${selectedDate} at ${label}`;

                                    return (
                                        <div className="min-w-64 rounded-lg border border-border/80 bg-popover p-3 text-popover-foreground shadow-xl">
                                            <div className="mb-3 text-sm font-semibold">{displayLabel}</div>
                                            <div className="space-y-2">
                                                {payload.map((entry) => {
                                                    const value = entry.value as number;
                                                    const playerName = entry.dataKey as string;
                                                    const color = String(entry.color ?? chartConfig[playerName]?.color ?? getPlayerColor(playerName));

                                                    return (
                                                        <div key={playerName} className="flex items-center justify-between gap-4">
                                                            <div className="flex min-w-0 items-center gap-2">
                                                                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                                                                <span className="truncate text-sm font-medium">{playerName}</span>
                                                            </div>
                                                            {value ? (
                                                                <div className="flex shrink-0 items-center gap-2">
                                                                    <img
                                                                        src={getRankImageUrl(value)}
                                                                        alt={formatRankValue(value)}
                                                                        className="h-6 w-6 object-contain"
                                                                    />
                                                                    <span className="text-sm font-medium">{formatRankValue(value)}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-muted-foreground">No data</span>
                                                            )}
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
                                    activeDot={{
                                        r: 5,
                                        stroke: 'hsl(var(--background))',
                                        strokeWidth: 2,
                                        fill: chartConfig[player]?.color,
                                    }}
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
            </CardContent>
        </Card>
    );
}
