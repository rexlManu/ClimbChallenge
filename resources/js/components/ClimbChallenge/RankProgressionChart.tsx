import * as React from "react"
import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"

interface RankProgressionData {
    chartData: Array<Record<string, string | number | null>>;
    players: string[];
}

interface RankProgressionChartProps {
    rankProgression: RankProgressionData;
}

const getPlayerColor = (index: number): string => {
    const colors = [
        'var(--chart-1)',
        'var(--chart-2)',
        'var(--chart-3)',
        'var(--chart-4)',
        'var(--chart-5)',
    ];
    return colors[index % colors.length];
};

const formatRankValue = (value: number): string => {
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
    const tierOrder = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
    const tierIndex = Math.floor(value / 400);
    const tier = tierOrder[tierIndex] || 'IRON';
    
    // Capitalize first letter, rest lowercase to match file naming
    const formattedTier = tier.charAt(0) + tier.slice(1).toLowerCase();
    return `/assets/img/Rank=${formattedTier}.png`;
};

export default function RankProgressionChart({ rankProgression }: RankProgressionChartProps) {
    const { chartData, players } = rankProgression;

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
    
    if (!chartData || chartData.length === 0 || !players || players.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Rank Progression</CardTitle>
                    <CardDescription>Track rank progress over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                        No progression data available
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Rank Progression</CardTitle>
                <CardDescription>
                    Track rank progress over time for all players
                </CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:p-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[400px] w-full"
                >
                    <LineChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = new Date(value)
                                return date.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })
                            }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            domain={['dataMin - 200', 'dataMax + 200']}
                            ticks={[0, 400, 800, 1200, 1600, 2000, 2400, 2800, 3200, 3600]}
                            tickFormatter={(value) => {
                                const tierOrder = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
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
                                            {new Date(label).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </div>
                                        <div className="space-y-1">
                                                                                         {payload.map((entry) => {
                                                 const value = entry.value as number;
                                                 const playerName = entry.dataKey as string;
                                                 const color = entry.color;
                                                 
                                                 return (
                                                     <div key={playerName} className="flex items-center gap-3">
                                                         <div 
                                                             className="h-2 w-2 rounded-full" 
                                                             style={{ backgroundColor: color }}
                                                         />
                                                         <span className="text-sm font-medium">
                                                             {playerName}:
                                                         </span>
                                                         {value ? (
                                                             <div className="flex items-center gap-2">
                                                                 <img 
                                                                     src={getRankImageUrl(value)}
                                                                     alt={formatRankValue(value)}
                                                                     className="h-6 w-6 object-contain"
                                                                 />
                                                                 <span className="text-sm">
                                                                     {formatRankValue(value)}
                                                                 </span>
                                                             </div>
                                                         ) : (
                                                             <span className="text-sm text-muted-foreground">
                                                                 No data
                                                             </span>
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
                        {players.map((player) => (
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
            </CardContent>
        </Card>
    );
} 