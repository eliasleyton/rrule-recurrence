import { datetime, RRule, RRuleSet } from "rrule";
import { DateTime } from "luxon";
import { 
    RecurrenceOptions, 
    TimeOptions, 
    TimeOffset, 
    DateReplacement,
    isCompatibleWithCurrentSchema,
    migrateToCurrentSchema,
    validateOptions
} from "./RecurrenceSchema";

class CustomRecurrenceRule {
    private rruleSet: RRuleSet;
    private keepLocalTime: boolean;
    private targetTimezone: string;
    private timeAdjustment: TimeOptions | null = null;
    private dateReplacements: DateReplacement[] = [];
    private timeOffset: TimeOffset | null = null;
    private excludeDays: Date[] = [];
    static DAILY: number;

    constructor(options: RecurrenceOptions) {
        // Verify and migrate schema if needed
        let validatedOptions = options;
        
        if (!isCompatibleWithCurrentSchema(options)) {
            console.warn('Incompatible options schema. Attempting migration...');
            validatedOptions = migrateToCurrentSchema(options);
        }
        
        if (!validateOptions(validatedOptions)) {
            throw new Error('Invalid recurrence options');
        }
        
        this.rruleSet = new RRuleSet();
        this.keepLocalTime = validatedOptions.keepLocalTime !== undefined ? validatedOptions.keepLocalTime : true;
        this.targetTimezone = validatedOptions.targetTimezone || validatedOptions.tzid || "UTC";
        this.timeAdjustment = validatedOptions.setTime || null;
        this.dateReplacements = validatedOptions.replaceDates || [];
        this.timeOffset = validatedOptions.timeOffset || null;
        this.excludeDays = validatedOptions.excludeDays || [];

        const rule = new RRule({
            freq: validatedOptions.freq,
            interval: validatedOptions.interval || 1,
            dtstart: validatedOptions.dtstart,
            until: validatedOptions.until,
            tzid: validatedOptions.tzid,
            byweekday: validatedOptions.byweekday
        });

        this.rruleSet.rrule(rule);

        if (validatedOptions.excludeDates && validatedOptions.excludeDates.length > 0) {
            validatedOptions.excludeDates.forEach(date => {
                this.rruleSet.exdate(date);
            });
        }
    }

    // Adjust the time of generated dates
    setTimeForDates(timeOptions: TimeOptions): void {
        this.timeAdjustment = timeOptions;
    }

    // Replace specific dates
    replaceDates(replacements: DateReplacement[]): void {
        this.dateReplacements = replacements;
    }

    // Apply time offset to all dates
    applyTimeOffset(offset: TimeOffset): void {
        this.timeOffset = offset;
    }

    // Set days to exclude (date only, no time)
    setExcludeDays(days: Date[]): void {
        this.excludeDays = days;
    }

    // Add a single day to exclude (timezone-aware)
    addExcludeDay(year: number, month: number, day: number): void {
        const dateTime = this.createDateInTimezone(year, month, day);
        this.excludeDays.push(dateTime.toJSDate());
    }

    // Add multiple days to exclude (timezone-aware)
    addExcludeDays(days: Array<{year: number, month: number, day: number}>): void {
        days.forEach(({year, month, day}) => {
            this.addExcludeDay(year, month, day);
        });
    }

    // Get all dates according to the specified timezone
    getAllDates(targetTimezone?: string, keepLocalTime?: boolean): Date[] {
        const timezone = targetTimezone || this.targetTimezone;
        const keepLocal = keepLocalTime !== undefined ? keepLocalTime : this.keepLocalTime;
        
        // Get all dates from the rule
        let allDates = this.rruleSet.all();
        
        // Convert to Luxon DateTime objects for manipulation
        let dateTimes = allDates.map(date => 
            DateTime.fromJSDate(date)
                .toUTC()
                .setZone(timezone, { keepLocalTime: keepLocal })
        );
        
        // Apply time adjustment if configured
        if (this.timeAdjustment) {
            dateTimes = dateTimes.map(dt => {
                let newDt = dt;
                if (this.timeAdjustment?.hour !== undefined) {
                    newDt = newDt.set({ hour: this.timeAdjustment.hour });
                }
                if (this.timeAdjustment?.minute !== undefined) {
                    newDt = newDt.set({ minute: this.timeAdjustment.minute });
                }
                if (this.timeAdjustment?.second !== undefined) {
                    newDt = newDt.set({ second: this.timeAdjustment.second });
                }
                return newDt;
            });
        }
        
        // Apply time offset if configured - IMPORTANT: apply offset BEFORE converting
        if (this.timeOffset) {
            dateTimes = dateTimes.map(dt => {
                let newDt = dt;
                if (this.timeOffset?.hours) {
                    newDt = newDt.plus({ hours: this.timeOffset.hours });
                }
                if (this.timeOffset?.minutes) {
                    newDt = newDt.plus({ minutes: this.timeOffset.minutes });
                }
                if (this.timeOffset?.seconds) {
                    newDt = newDt.plus({ seconds: this.timeOffset.seconds });
                }
                return newDt;
            });
        }
        
        // Filter out excluded days (compare by date only, ignoring time)
        if (this.excludeDays && this.excludeDays.length > 0) {
            const excludedDates = this.excludeDays.map(day => {
                // Extract year, month, day from the Date object
                const year = day.getFullYear();
                const month = day.getMonth();
                const date = day.getDate();
                
                // Create the date directly in the target timezone using our helper
                return this.createDateInTimezone(year, month, date);
            });
            
            dateTimes = dateTimes.filter(dt => {
                return !excludedDates.some(excluded => 
                    dt.year === excluded.year &&
                    dt.month === excluded.month &&
                    dt.day === excluded.day
                );
            });
        }
        
        // Perform specific replacements BEFORE converting to Date
        if (this.dateReplacements && this.dateReplacements.length > 0) {
            // Convert replacement dates to Luxon DateTime for correct comparison
            const luxonReplacements = this.dateReplacements.map(r => ({
                date: DateTime.fromJSDate(r.date).setZone(timezone, { keepLocalTime: keepLocal }),
                newDate: DateTime.fromJSDate(r.newDate).setZone(timezone, { keepLocalTime: keepLocal })
            }));
            
            for (let i = 0; i < dateTimes.length; i++) {
                for (const replacement of luxonReplacements) {
                    // Compare only by year, month, day (without considering the time that may vary by offset)
                    if (dateTimes[i].year === replacement.date.year &&
                        dateTimes[i].month === replacement.date.month &&
                        dateTimes[i].day === replacement.date.day) {
                        // Replace with the new date
                        dateTimes[i] = replacement.newDate;
                        break;
                    }
                }
            }
        }
        
        // Convert to JavaScript Date objects after all transformations
        return dateTimes.map(dt => dt.toJSDate());
    }

    // Print all dates
    printAllDates(targetTimezone?: string, keepLocalTime?: boolean): void {
        const dates = this.getAllDates(targetTimezone, keepLocalTime);
        dates.forEach(date => console.log(date));
    }

    // For debugging purposes
    getConfig(): any {
        return {
            ruleOptions: this.rruleSet.rrules()[0].options,
            exdates: this.rruleSet.exdates().map(date => date.toString()),
            keepLocalTime: this.keepLocalTime,
            targetTimezone: this.targetTimezone,
            timeAdjustment: this.timeAdjustment,
            dateReplacements: this.dateReplacements.map(r => ({
                original: DateTime.fromJSDate(r.date).toISO(),
                new: DateTime.fromJSDate(r.newDate).toISO()
            })),
            timeOffset: this.timeOffset,
            excludeDays: this.excludeDays.map(day => ({
                original: day.toISOString(),
                timezoneAdjusted: DateTime.fromJSDate(day).setZone(this.targetTimezone).toISODate()
            }))
        };
    }

    // Helper method to create dates in the target timezone
    private createDateInTimezone(year: number, month: number, day: number): DateTime {
        // month is 0-based for JavaScript Date, but 1-based for Luxon
        return DateTime.fromObject(
            { year, month: month + 1, day },
            { zone: this.targetTimezone }
        );
    }
}

export { CustomRecurrenceRule, datetime, RRule, RRuleSet };
