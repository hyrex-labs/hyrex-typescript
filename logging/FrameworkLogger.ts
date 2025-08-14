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
    | 'listener'
    | 'durability'
    | 'workflow'
    | 'platform'
    | 'init'


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
    private enabledFeatures: Set<LogFeature>
    private supportsColor: boolean

    constructor(config: LoggerConfig) {
        this.enabledFeatures = new Set(config.features);
        this.supportsColor = this.detectColorSupport();
    }

    private detectColorSupport(): boolean {
        // Check if colors are explicitly disabled
        if (process.env.NO_COLOR || process.env.NODE_DISABLE_COLORS) {
            return false;
        }

        // Check if colors are explicitly enabled
        if (process.env.FORCE_COLOR || process.env.COLORTERM) {
            return true;
        }

        // Check if running in a CI environment (usually no color support)
        if (process.env.CI) {
            return false;
        }

        // Check if stdout is a TTY (terminal)
        if (process.stdout && process.stdout.isTTY) {
            // Check TERM environment variable
            const term = process.env.TERM;
            if (term && term !== 'dumb') {
                return true;
            }
        }

        // Check platform-specific indicators
        if (process.platform === 'win32') {
            // Windows 10 build 14931+ supports ANSI colors
            return process.env.TERM_PROGRAM === 'vscode' || 
                   !!process.env.WT_SESSION || // Windows Terminal
                   process.env.ConEmuANSI === 'ON'; // ConEmu
        }

        return false;
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
            // Format the message with feature tag and color
            let formattedMessage = message || '';
            
            if (feature !== 'system') {
                const featureTag = `[${feature}]`.padEnd(22);
                formattedMessage = `${featureTag} ${formattedMessage}`;
            }
            
            if (color && this.supportsColor) {
                const colorCode = COLOR_MAP[color as LogColor];
                formattedMessage = `\x1b[${colorCode}m${formattedMessage}\x1b[0m`;
            }
            
            // Write directly to stdout for our custom formatting
            process.stdout.write(formattedMessage + '\n');
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