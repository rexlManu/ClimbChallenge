import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import { Calendar, Clock } from 'lucide-react';
import * as React from 'react';
import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from 'recharts';

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

const getPlayerColor = (index: number): string => {
    const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
    return colors[index % colors.length];
};

const formatRankValue = (value: number): string => {
    // Handle unranked (negative values)
    if (value < 0) {
        return 'Unranked';
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

const getRankImageUrl = (value: number): string => {
    // Handle unranked (negative values)
    if (value < 0) {
        return `/assets/img/Rank=Unranked.png`;
    }

    const tierOrder = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
    const tierIndex = Math.floor(value / 400);
    const tier = tierOrder[tierIndex] || 'IRON';

    // Capitalize first letter, rest lowercase to match file naming
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

    // If no valid data found, return default range
    if (min === Number.MAX_SAFE_INTEGER || max === Number.MIN_SAFE_INTEGER) {
        return { min: -400, max: 3600 };
    }

    return { min, max };
};

const generateDynamicTicks = (min: number, max: number, viewType: 'daily' | 'hourly'): number[] => {
    const tierBoundaries = [-400, 0, 400, 800, 1200, 1600, 2000, 2400, 2800, 3200, 3600];

    // Add some padding to the range
    const padding = viewType === 'daily' ? 400 : 200; // One tier padding for daily, half tier for hourly
    const paddedMin = min - padding;
    const paddedMax = max + padding;

    // Find relevant tier boundaries within the padded range
    const relevantBoundaries = tierBoundaries.filter((boundary) => boundary >= paddedMin && boundary <= paddedMax);

    // Ensure we have at least the boundaries just outside our data range
    const minBoundary = tierBoundaries.filter((b) => b <= paddedMin).pop();
    const maxBoundary = tierBoundaries.filter((b) => b >= paddedMax)[0];

    if (minBoundary !== undefined && !relevantBoundaries.includes(minBoundary)) {
        relevantBoundaries.unshift(minBoundary);
    }
    if (maxBoundary !== undefined && !relevantBoundaries.includes(maxBoundary)) {
        relevantBoundaries.push(maxBoundary);
    }

    // For hourly view, add division boundaries within relevant tiers
    if (viewType === 'hourly') {
        const additionalTicks: number[] = [];
        for (let i = 0; i < relevantBoundaries.length - 1; i++) {
            const tierStart = relevantBoundaries[i];
            const tierEnd = relevantBoundaries[i + 1];

            // Only add division ticks for tiers that contain actual data
            if (tierStart >= paddedMin && tierEnd <= paddedMax) {
                // Add division boundaries (every 100 LP within a tier)
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

export default function RankProgressionChart({ rankProgression }: RankProgressionChartProps) {
    const { dailyChartData, players, availableDates } = rankProgression;
    const [viewType, setViewType] = React.useState<'daily' | 'hourly'>('daily');
    const [selectedDate, setSelectedDate] = React.useState<string>(availableDates[availableDates.length - 1]?.value || '');
    const [hourlyData, setHourlyData] = React.useState<HourlyData | null>(null);
    const [isLoadingHourly, setIsLoadingHourly] = React.useState(false);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Create chart config for all players
    const chartConfig: ChartConfig = React.useMemo(() => {
        if (!players) return {};
        return players.reduce((config, player, index) => {
            config[player] = {
                label: player,
                color: getPlayerColor(index),
            };
            return config;
        }, {} as ChartConfig);
    }, [players]);

    // Calculate dynamic data range and ticks
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

    // Load hourly data when date changes or view switches to hourly
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

    // Auto-scroll to center time when hourly data loads
    React.useEffect(() => {
        if (viewType === 'hourly' && hourlyData && hourlyData.centerIndex !== undefined && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const chartWidth = 1800; // Total chart width
            const dataPoints = hourlyData.chartData.length;
            const pointWidth = chartWidth / dataPoints;
            const centerPosition = hourlyData.centerIndex * pointWidth - container.clientWidth / 2;

            // Smooth scroll to center position
            container.scrollTo({
                left: Math.max(0, centerPosition),
                behavior: 'smooth',
            });
        }
    }, [viewType, hourlyData]);

    const currentData = viewType === 'daily' ? dailyChartData : hourlyData?.chartData || [];
    const currentPlayers = viewType === 'daily' ? players : hourlyData?.players || [];

    if (!currentData || currentData.length === 0 || !currentPlayers || currentPlayers.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Rank Progression</CardTitle>
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
        <Card>
            <CardHeader>
                <CardTitle>Rank Progression</CardTitle>
                <CardDescription>Track rank progress over time for all players</CardDescription>
                <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant={viewType === 'daily' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewType('daily')}
                            className="flex items-center gap-2"
                        >
                            <Calendar className="h-4 w-4" />
                            Daily View
                        </Button>
                        <Button
                            variant={viewType === 'hourly' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewType('hourly')}
                            className="flex items-center gap-2"
                        >
                            <Clock className="h-4 w-4" />
                            Hourly View
                        </Button>
                    </div>

                    {viewType === 'hourly' && (
                        <Select value={selectedDate} onValueChange={setSelectedDate}>
                            <SelectTrigger className="w-48">
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
            </CardHeader>
            <CardContent className="px-2 sm:p-6">
                <div ref={viewType === 'hourly' ? scrollContainerRef : null} className={viewType === 'hourly' ? 'w-full overflow-x-auto' : ''}>
                    <ChartContainer
                        config={chartConfig}
                        className={`aspect-auto h-[400px] ${viewType === 'hourly' ? 'w-[1800px] min-w-full' : 'w-full'}`}
                    >
                        <LineChart
                            accessibilityLayer
                            data={currentData}
                            margin={{
                                left: 12,
                                right: 12,
                            }}
                        >
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey={viewType === 'daily' ? 'date' : 'time'}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={viewType === 'hourly' ? 10 : 32}
                                tickFormatter={(value) => {
                                    if (viewType === 'daily') {
                                        const date = new Date(value);
                                        return date.toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                        });
                                    } else {
                                        // For hourly view, show time and date info
                                        const dataPoint = currentData.find((d) => d.time === value);
                                        if (dataPoint && dataPoint.display) {
                                            // Show just the time part for most ticks, but include date for midnight
                                            return value === '00:00' ? dataPoint.display : value;
                                        }
                                        return value; // Fallback to time only
                                    }
                                }}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                domain={[
                                    Math.min(...dynamicTicks) - (viewType === 'daily' ? 200 : 100),
                                    Math.max(...dynamicTicks) + (viewType === 'daily' ? 200 : 100),
                                ]}
                                ticks={dynamicTicks}
                                tickFormatter={(value) => {
                                    if (Number(value) < 0) {
                                        return 'UNRANKED';
                                    }
                                    const tierOrder = [
                                        'IRON',
                                        'BRONZE',
                                        'SILVER',
                                        'GOLD',
                                        'PLATINUM',
                                        'EMERALD',
                                        'DIAMOND',
                                        'MASTER',
                                        'GRANDMASTER',
                                        'CHALLENGER',
                                    ];
                                    const tierIndex = Math.floor(Number(value) / 400);
                                    const tier = tierOrder[tierIndex] || '';

                                    if (viewType === 'hourly' && tier) {
                                        // Show division for hourly view
                                        const remainingValue = Number(value) % 400;
                                        const rankIndex = Math.floor(remainingValue / 100);
                                        const rankOrder = ['IV', 'III', 'II', 'I'];
                                        const rank =
                                            tier === 'MASTER' || tier === 'GRANDMASTER' || tier === 'CHALLENGER' ? '' : rankOrder[rankIndex] || 'IV';
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
                                            ? new Date(label).toLocaleDateString('en-US', {
                                                  month: 'short',
                                                  day: 'numeric',
                                                  year: 'numeric',
                                              })
                                            : dataPoint?.display || `${selectedDate} at ${label}`;

                                    return (
                                        <div className="rounded-lg border bg-background p-3 shadow-md">
                                            <div className="mb-2 text-sm font-medium">{displayLabel}</div>
                                            <div className="space-y-1">
                                                {payload.map((entry) => {
                                                    const value = entry.value as number;
                                                    const playerName = entry.dataKey as string;
                                                    const color = entry.color;

                                                    return (
                                                        <div key={playerName} className="flex items-center gap-3">
                                                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                                                            <span className="text-sm font-medium">{playerName}:</span>
                                                            {value ? (
                                                                <div className="flex items-center gap-2">
                                                                    <img
                                                                        src={getRankImageUrl(value)}
                                                                        alt={formatRankValue(value)}
                                                                        className="h-6 w-6 object-contain"
                                                                    />
                                                                    <span className="text-sm">{formatRankValue(value)}</span>
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
                            <Legend />
                            {currentPlayers.map((player) => (
                                <Line
                                    key={player}
                                    dataKey={player}
                                    type="monotone"
                                    stroke={chartConfig[player]?.color}
                                    strokeWidth={2}
                                    dot={false}
                                    connectNulls={false}
                                />
                            ))}
                        </LineChart>
                    </ChartContainer>
                </div>
            </CardContent>
        </Card>
    );
}
