import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface RankTrack {
    display_name: string;
    tier: string;
    rank: string;
    league_points: number;
    wins: number;
    losses: number;
    created_at: string;
}

interface RankProgressionChartProps {
    rankProgression: Record<string, RankTrack[]>;
}

const getRankValue = (tier: string, rank: string, lp: number): number => {
    const tierValues: Record<string, number> = {
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
    
    const tierValue = tierValues[tier?.toUpperCase()] || 0;
    const rankValue = rankValues[rank] || 0;
    
    return tierValue + rankValue + lp;
};

const getPlayerColor = (index: number): string => {
    const colors = [
        '#3b82f6', // blue
        '#ef4444', // red
        '#10b981', // green
        '#f59e0b', // amber
        '#8b5cf6', // violet
        '#ec4899', // pink
        '#06b6d4', // cyan
        '#84cc16', // lime
    ];
    return colors[index % colors.length];
};

export default function RankProgressionChart({ rankProgression }: RankProgressionChartProps) {
    // Process data for chart
    const playerNames = Object.keys(rankProgression);
    
    if (playerNames.length === 0) {
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

    // Get all unique dates and sort them
    const allDates = Array.from(
        new Set(
            playerNames.flatMap(name => 
                rankProgression[name].map(track => 
                    new Date(track.created_at).toLocaleDateString()
                )
            )
        )
    ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    const datasets = playerNames.map((name, index) => {
        const playerTracks = rankProgression[name].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        const data = allDates.map(date => {
            const track = playerTracks.find(
                t => new Date(t.created_at).toLocaleDateString() === date
            );
            return track ? getRankValue(track.tier, track.rank, track.league_points) : null;
        });

        const color = getPlayerColor(index);

        return {
            label: name,
            data,
            borderColor: color,
            backgroundColor: color + '20',
            borderWidth: 2,
            fill: false,
            tension: 0.1,
            pointRadius: 4,
            pointHoverRadius: 6,
            spanGaps: true,
        };
    });

    const chartData = {
        labels: allDates,
        datasets,
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        const value = context.parsed.y;
                        const label = context.dataset.label || '';
                        if (value === null) return `${label}: No data`;
                        
                        // Convert back to tier/rank/LP for display
                        const tierOrder = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
                        const rankOrder = ['IV', 'III', 'II', 'I'];
                        
                        const tierIndex = Math.floor(value / 400);
                        const remainingValue = value % 400;
                        const rankIndex = Math.floor(remainingValue / 100);
                        const lp = remainingValue % 100;
                        
                        const tier = tierOrder[tierIndex] || 'UNKNOWN';
                        const rank = tier === 'MASTER' || tier === 'GRANDMASTER' || tier === 'CHALLENGER' ? '' : rankOrder[rankIndex] || 'IV';
                        
                        return `${label}: ${tier} ${rank} ${lp}LP`;
                    },
                },
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Date',
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Rank Value',
                },
                ticks: {
                    callback: function(value: string | number) {
                        const tierOrder = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
                        const tierIndex = Math.floor(Number(value) / 400);
                        return tierOrder[tierIndex] || '';
                    },
                },
            },
        },
        interaction: {
            intersect: false,
            mode: 'index' as const,
        },
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Rank Progression</CardTitle>
                <CardDescription>Track rank progress over time</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-96">
                    <Line data={chartData} options={options} />
                </div>
            </CardContent>
        </Card>
    );
} 