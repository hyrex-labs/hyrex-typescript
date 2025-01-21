interface DataPoint {
    value: number;
    timestamp: number;
}

interface MinuteAverage {
    minute: number;  // Unix timestamp rounded to minute
    average: number;
    // count: number;
}

export class TimeSeriesAverager {
    private dataPoints: DataPoint[];

    constructor() {
        this.dataPoints = [];
    }

    private getMinuteTimestamp(timestamp: number): number {
        // Round down to nearest minute
        return Math.floor(timestamp / 60000) * 60000;
    }

    private groupByMinute(): Map<number, DataPoint[]> {
        const groupedData = new Map<number, DataPoint[]>();

        for (const point of this.dataPoints) {
            const minute = this.getMinuteTimestamp(point.timestamp);
            if (!groupedData.has(minute)) {
                groupedData.set(minute, []);
            }
            groupedData.get(minute)!.push(point);
        }

        return groupedData;
    }

    submit(x: number) {
        const currentTime = Date.now();
        this.dataPoints.push({
            value: x,
            timestamp: currentTime
        });
    }

    getTimeSeries(): MinuteAverage[] {
        const groupedData = this.groupByMinute();
        const result: MinuteAverage[] = [];

        // Sort minutes chronologically
        const sortedMinutes = Array.from(groupedData.keys()).sort();

        for (const minute of sortedMinutes) {
            const points = groupedData.get(minute)!;
            const sum = points.reduce((acc, point) => acc + point.value, 0);

            result.push({
                minute,
                average: sum / points.length,
                // count: points.length
            });
        }

        return result;
    }

    // Get average for specific minute
    getAverageForMinute(timestamp: number): MinuteAverage | null {
        const minute = this.getMinuteTimestamp(timestamp);
        const groupedData = this.groupByMinute();

        if (!groupedData.has(minute)) {
            return null;
        }

        const points = groupedData.get(minute)!;
        const sum = points.reduce((acc, point) => acc + point.value, 0);

        return {
            minute,
            average: sum / points.length,
            // count: points.length
        };
    }

    // Get the current minute's average
    getCurrentMinuteAverage(): MinuteAverage {
        const currentMinute = this.getMinuteTimestamp(Date.now());
        return this.getAverageForMinute(currentMinute) || {
            minute: currentMinute,
            average: 0,
            // count: 0
        };
    }

    // Clear all data
    clear() {
        this.dataPoints = [];
    }

    // Optionally, prune old data to prevent memory growth
    pruneDataOlderThan(timestamp: number) {
        this.dataPoints = this.dataPoints.filter(point =>
            point.timestamp >= timestamp
        );
    }
}
