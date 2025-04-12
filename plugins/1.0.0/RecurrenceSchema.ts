import { RRule } from "rrule";

export interface TimeOptions {
    hour?: number;
    minute?: number;
    second?: number;
}

export interface TimeOffset {
    hours?: number;
    minutes?: number;
    seconds?: number;
}

export interface DateReplacement {
    date: Date;
    newDate: Date;
}

export interface RecurrenceOptions {
    freq: number;
    interval?: number;
    dtstart: Date;
    until?: Date;
    tzid?: string;
    byweekday?: number[];
    excludeDates?: Date[];
    keepLocalTime?: boolean;
    targetTimezone?: string;
    setTime?: TimeOptions;
    replaceDates?: DateReplacement[];
    timeOffset?: TimeOffset;
}

export function isCompatibleWithCurrentSchema(options: any): boolean {
    // Basic validation to check if the options object has the minimum required properties
    return options && 
           typeof options.freq === 'number' && 
           options.dtstart instanceof Date;
}

export function migrateToCurrentSchema(options: any): RecurrenceOptions {
    // Simple migration function that ensures the options match the current schema
    return {
        freq: options.freq,
        interval: options.interval || 1,
        dtstart: options.dtstart,
        until: options.until,
        tzid: options.tzid,
        byweekday: options.byweekday,
        excludeDates: options.excludeDates || [],
        keepLocalTime: options.keepLocalTime !== undefined ? options.keepLocalTime : true,
        targetTimezone: options.targetTimezone || options.tzid || "UTC",
        setTime: options.setTime,
        replaceDates: options.replaceDates || [],
        timeOffset: options.timeOffset
    };
}

export function validateOptions(options: RecurrenceOptions): boolean {
    // Validate that all required fields are present and have correct types
    if (!options || typeof options !== 'object') return false;
    
    // Check required fields
    if (typeof options.freq !== 'number') return false;
    if (!(options.dtstart instanceof Date)) return false;
    
    // Check optional fields if they exist
    if (options.interval !== undefined && typeof options.interval !== 'number') return false;
    if (options.until !== undefined && !(options.until instanceof Date)) return false;
    if (options.tzid !== undefined && typeof options.tzid !== 'string') return false;
    if (options.byweekday !== undefined && !Array.isArray(options.byweekday)) return false;
    if (options.excludeDates !== undefined && !Array.isArray(options.excludeDates)) return false;
    if (options.keepLocalTime !== undefined && typeof options.keepLocalTime !== 'boolean') return false;
    if (options.targetTimezone !== undefined && typeof options.targetTimezone !== 'string') return false;
    
    return true;
} 