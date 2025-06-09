import { useCallback, useEffect, useRef, useState } from 'react';

interface DashboardData {
    participants: any[];
    championStats: Record<string, any[]>;
    rankProgression: any;
    recentMatches: Record<string, any[]>;
    lastUpdated: string;
}

interface UseAutoUpdateProps {
    initialData: DashboardData;
    updateIntervalMs?: number;
    onDataUpdate?: (newData: DashboardData) => void;
    enabled?: boolean;
}

interface UseAutoUpdateReturn {
    data: DashboardData;
    isLoading: boolean;
    isChecking: boolean;
    lastChecked: Date | null;
    error: string | null;
    forceUpdate: () => void;
}

export function useAutoUpdate({
    initialData,
    updateIntervalMs = 60000, // 1 minute default
    onDataUpdate,
    enabled = true,
}: UseAutoUpdateProps): UseAutoUpdateReturn {
    const [data, setData] = useState<DashboardData>(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastUpdateRef = useRef<string>(initialData.lastUpdated);

    const checkForUpdates = useCallback(async () => {
        if (!enabled) return;

        setIsChecking(true);
        setError(null);

        try {
            const response = await fetch(`/api/climb-challenge/check-updates?lastUpdate=${encodeURIComponent(lastUpdateRef.current)}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setLastChecked(new Date());

            if (result.hasUpdates) {
                await fetchUpdatedData();
            }
        } catch (err) {
            console.error('Error checking for updates:', err);
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setIsChecking(false);
        }
    }, [enabled]);

    const fetchUpdatedData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/climb-challenge/dashboard-data');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const newData: DashboardData = await response.json();

            setData(newData);
            lastUpdateRef.current = newData.lastUpdated;

            if (onDataUpdate) {
                onDataUpdate(newData);
            }
        } catch (err) {
            console.error('Error fetching updated data:', err);
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [onDataUpdate]);

    const forceUpdate = useCallback(() => {
        fetchUpdatedData();
    }, [fetchUpdatedData]);

    // Set up the interval for checking updates
    useEffect(() => {
        if (!enabled) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Initial check after component mounts
        const timeoutId = setTimeout(() => {
            checkForUpdates();
        }, 1000); // Check after 1 second

        // Set up recurring checks
        intervalRef.current = setInterval(checkForUpdates, updateIntervalMs);

        return () => {
            clearTimeout(timeoutId);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [enabled, updateIntervalMs, checkForUpdates]);

    // Update initial data when it changes
    useEffect(() => {
        setData(initialData);
        lastUpdateRef.current = initialData.lastUpdated;
    }, [initialData]);

    return {
        data,
        isLoading,
        isChecking,
        lastChecked,
        error,
        forceUpdate,
    };
}
