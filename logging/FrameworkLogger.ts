import winston from 'winston';
import { COLOR_MAP } from "./ColorMap";

export type LogFeature =
    | 'postgres'
    | 'task-processing'
    | 'flow-control'
    | 'remote-logging'
    | 'cron-scheduling'
    | 'process-management'
    | 'misc'
    | 'all'
    | 'timeout'
    | 'system'


type LoggerConfig = {
    features: LogFeature[];
}

type LogColor = keyof typeof COLOR_MAP;

export function kvFormatForLogging(obj: Record<string, any>): string {
    return Object.entries(obj)
        .map(([key, value]) => `${key}=${formatValue(value)}`)
        .join(', ');
}

// Helper function to handle different value types
function formatValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}


class FrameworkLogger {
    private logger: winston.Logger;
    private enabledFeatures: Set<LogFeature>

    constructor(config: LoggerConfig) {
        this.enabledFeatures = new Set(config.features);

        this.logger = winston.createLogger({
            format: winston.format.combine(
                winston.format.json(),
                winston.format.printf((info) => {
                    const feature = info.feature as string;
                    const color = info.color as string | undefined;
                    const featureTag = `[${feature}]`.padEnd(22)

                    let result = `${info.message}`;

                    if (feature !== 'system') {
                        result = `${featureTag} ${result}`
                    }

                    if (color) {
                        const colorCode = COLOR_MAP[color as LogColor];
                        result =`\x1b[${colorCode}m${result}\x1b[0m`;
                    }

                    return result
                })
            ),
            transports: [
                new winston.transports.Console()
            ],
        });
    }

    private isFeatureEnabled(feature: LogFeature): boolean {
        return this.enabledFeatures.has('all') || this.enabledFeatures.has(feature);
    }

    private log(
        level: string,
        feature: LogFeature,
        message: string,
        color?: LogColor
    ) {
        if (this.isFeatureEnabled(feature)) {
            this.logger.log({
                level,
                feature,
                message,
                color
            });
        }
    }

    debug(feature: LogFeature, message: string, color?: LogColor) {
        this.log('debug', feature, message, color);
    }

    info(feature: LogFeature, message: string, color?: LogColor) {
        this.log('info', feature, message, color);
    }

    warn(feature: LogFeature, message: string, color?: LogColor) {
        this.log('warn', feature, message, color);
    }

    error(feature: LogFeature, message: string, color?: LogColor) {
        this.log('error', feature, message, color);
    }
}

export const hyrexLogger = new FrameworkLogger({
    features: [
        'all'
    ],
})
