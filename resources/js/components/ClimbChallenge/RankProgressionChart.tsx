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

export default function RankProgressionChart({ rankProgression }: RankProgressionChartProps) {
    const { dailyChartData, players, availableDates } = rankProgression;
    const [viewType, setViewType] = React.useState<'daily' | 'hourly'>('daily');
    const [selectedDate, setSelectedDate] = React.useState<string>(availableDates[availableDates.length - 1]?.value || '');
    const [hourlyData, setHourlyData] = React.useState<HourlyData | null>(null);
    const [isLoadingHourly, setIsLoadingHourly] = React.useState(false);

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

    // Load hourly data when date changes or view switches to hourly
    React.useEffect(() => {
        if (viewType === 'hourly' && selectedDate) {
            setIsLoadingHourly(true);
            axios
                .get('/climb-challenge/hourly-progression', {
                    params: { date: selectedDate },
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
                <div className={viewType === 'hourly' ? 'overflow-x-auto' : ''}>
                    <ChartContainer config={chartConfig} className={`aspect-auto h-[400px] ${viewType === 'hourly' ? 'w-[1200px]' : 'w-full'}`}>
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
                                        return value; // Already formatted as HH:MM
                                    }
                                }}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                domain={['dataMin - 200', 'dataMax + 200']}
                                ticks={[-400, 0, 400, 800, 1200, 1600, 2000, 2400, 2800, 3200, 3600]}
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
                                    return tierOrder[tierIndex] || '';
                                }}
                            />
                            <ChartTooltip
                                content={({ active, payload, label }) => {
                                    if (!active || !payload || !payload.length) {
                                        return null;
                                    }

                                    return (
                                        <div className="rounded-lg border bg-background p-3 shadow-md">
                                            <div className="mb-2 text-sm font-medium">
                                                {viewType === 'daily'
                                                    ? new Date(label).toLocaleDateString('en-US', {
                                                          month: 'short',
                                                          day: 'numeric',
                                                          year: 'numeric',
                                                      })
                                                    : `${selectedDate} at ${label}`}
                                            </div>
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
