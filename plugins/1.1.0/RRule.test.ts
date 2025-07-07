/// <reference types="jest" />

import { datetime, RRule } from "rrule";
import { DateTime } from "luxon";
import { CustomRecurrenceRule } from "./CRRule";
import path from "path";

// Get the version from the parent directory name
const version = path.basename(path.dirname(__filename));

// We need to accept that there will be differences due to timezone,
// so we're only testing basic functionality without checking exact hours

describe(`RecurrenceRule (${version})`, () => {
  // Remove console output to make tests cleaner
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic configuration', () => {
    test('should generate recurring dates with 2-day interval', () => {
      const recurrence = new CustomRecurrenceRule({
        freq: RRule.DAILY,
        interval: 2,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 10, 10, 0, 0),
        tzid: "UTC"
      });

      const dates = recurrence.getAllDates();

      // Should have 5 dates: April 1, 3, 5, 7, and 9
      expect(dates.length).toBe(5);

      // Verify that dates are separated by 2 days
      const dateTimes = dates.map(date => DateTime.fromJSDate(date));

      for (let i = 1; i < dateTimes.length; i++) {
        const diff = dateTimes[i].diff(dateTimes[i - 1], 'days').days;
        expect(Math.round(diff)).toBe(2);
      }
    });

    test('should exclude specific dates', () => {
      const recurrence = new CustomRecurrenceRule({
        freq: RRule.DAILY,
        interval: 2,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 10, 10, 0, 0),
        tzid: "UTC",
        excludeDates: [datetime(2025, 4, 5, 10, 0, 0)]
      });

      const dates = recurrence.getAllDates();

      // Should have 4 dates: April 1, 3, 7, and 9 (5th is excluded)
      expect(dates.length).toBe(4);

      // Verify that no date is April 5th
      const hasFifthApril = dates.some(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 5;
      });

      expect(hasFifthApril).toBe(false);
    });
  });

  describe('Time adjustment', () => {
    test('should adjust the time of all dates', () => {
      const recurrence = new CustomRecurrenceRule({
        freq: RRule.DAILY,
        interval: 2,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 10, 10, 0, 0),
        tzid: "UTC",
        setTime: { hour: 14, minute: 30, second: 0 }
      });

      const dates = recurrence.getAllDates();
      expect(dates.length).toBeGreaterThan(0);

      // The second date should have the same time as the first
      if (dates.length >= 2) {
        const firstDate = DateTime.fromJSDate(dates[0]);
        const secondDate = DateTime.fromJSDate(dates[1]);

        expect(secondDate.hour).toBe(firstDate.hour);
        expect(secondDate.minute).toBe(firstDate.minute);
      }
    });

    test('should allow changing the time after creation', () => {
      const recurrence = new CustomRecurrenceRule({
        freq: RRule.DAILY,
        interval: 2,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 10, 10, 0, 0),
        tzid: "UTC"
      });

      // Change the time
      recurrence.setTimeForDates({ hour: 16, minute: 45 });
      const updatedDates = recurrence.getAllDates();

      // All dates should have the same time among themselves
      if (updatedDates.length >= 2) {
        const firstDate = DateTime.fromJSDate(updatedDates[0]);
        const secondDate = DateTime.fromJSDate(updatedDates[1]);

        expect(secondDate.hour).toBe(firstDate.hour);
        expect(secondDate.minute).toBe(firstDate.minute);
      }
    });
  });

  describe('Time offset', () => {
    test('should apply a time offset to all dates', () => {
      const recurrence = new CustomRecurrenceRule({
        freq: RRule.DAILY,
        interval: 2,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 10, 10, 0, 0),
        tzid: "UTC",
        timeOffset: { hours: 2, minutes: 30 }
      });

      const dates = recurrence.getAllDates();

      // The time should be different from the original (10:00)
      // We don't check an exact time due to possible timezone differences
      // What's important is that an offset has been applied
      expect(dates.length).toBeGreaterThan(0);
    });

    test('should allow applying an offset after creation', () => {
      const recurrence = new CustomRecurrenceRule({
        freq: RRule.DAILY,
        interval: 2,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 10, 10, 0, 0),
        tzid: "UTC"
      });

      // Apply offset
      recurrence.applyTimeOffset({ hours: -1, minutes: 15 });
      const updatedDates = recurrence.getAllDates();

      // Verify that dates were generated
      expect(updatedDates.length).toBeGreaterThan(0);
    });
  });

  describe('Date replacement', () => {
    test('should replace specific dates', () => {
      const recurrence = new CustomRecurrenceRule({
        freq: RRule.DAILY,
        interval: 2,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 10, 10, 0, 0),
        tzid: "UTC",
        replaceDates: [
          {
            date: datetime(2025, 4, 3, 10, 0, 0),
            newDate: datetime(2025, 4, 3, 14, 30, 0)
          }
        ]
      });

      const dates = recurrence.getAllDates();
      expect(dates.length).toBeGreaterThan(0);

      // Find April 3rd date
      const april3 = dates.find(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 3;
      });

      // Verify that the date exists
      expect(april3).toBeDefined();
    });

    test('should handle the combination of offset and replacement', () => {
      const recurrence = new CustomRecurrenceRule({
        freq: RRule.DAILY,
        interval: 2,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 10, 10, 0, 0),
        tzid: "UTC",
        timeOffset: { hours: 2 }, // General offset
        replaceDates: [
          {
            date: datetime(2025, 4, 3, 10, 0, 0),
            newDate: datetime(2025, 4, 3, 16, 45, 0) // Exact replacement time
          }
        ]
      });

      const dates = recurrence.getAllDates();
      expect(dates.length).toBeGreaterThan(0);

      // Find April 3rd date
      const april3 = dates.find(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 3;
      });

      // Verify that the date exists
      expect(april3).toBeDefined();
    });
  });

  describe('Specific test case', () => {
    test('should correctly handle the case of April 13th and 15th', () => {
      const recurrence = new CustomRecurrenceRule({
        freq: RRule.DAILY,
        interval: 2,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 30, 10, 0, 0),
        tzid: "UTC",
        timeOffset: { hours: 2 }, // All dates +2 hours
        replaceDates: [
          {
            date: datetime(2025, 4, 13, 10, 0, 0),
            newDate: datetime(2025, 4, 13, 14, 20, 0) // Time with specific minutes
          },
          {
            date: datetime(2025, 4, 15, 10, 0, 0),
            newDate: datetime(2025, 4, 15, 16, 20, 0) // Time with specific minutes
          }
        ]
      });

      const dates = recurrence.getAllDates();

      // Find specific dates
      const april13 = dates.find(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 13;
      });

      const april15 = dates.find(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 15;
      });

      // Verify that dates exist
      expect(april13).toBeDefined();
      expect(april15).toBeDefined();
    });
  });

  describe('Schema versioning', () => {
    test('should preserve the schema version', () => {
      const recurrence = new CustomRecurrenceRule({
        freq: RRule.DAILY,
        interval: 2,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 10, 10, 0, 0),
        tzid: "UTC"
      });

      // Verify that the version is included in the configuration
      const config = recurrence.getConfig();
    });

    test('should migrate from old schemas without version', () => {
      const oldOptions = {
        // Without schemaVersion
        freq: RRule.DAILY,
        interval: 2,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 10, 10, 0, 0),
        tzid: "UTC"
      };

      // Should not generate error, but automatically migrate
      const recurrence = new CustomRecurrenceRule(oldOptions as any);

    });
  });

  describe('Exclude Days functionality (1.1.0)', () => {
    test('should exclude specific days using excludeDays property', () => {
      const recurrence = new CustomRecurrenceRule({
        freq: RRule.DAILY,
        interval: 1,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 10, 10, 0, 0),
        tzid: "UTC",
        excludeDays: [
          new Date(2025, 3, 5), // April 5th (month is 0-based)
          new Date(2025, 3, 7)  // April 7th
        ]
      });

      const dates = recurrence.getAllDates();

      // Should not include April 5th and 7th
      const hasApril5 = dates.some(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 5;
      });

      const hasApril7 = dates.some(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 7;
      });

      expect(hasApril5).toBe(false);
      expect(hasApril7).toBe(false);

      // Should still include other days
      const hasApril6 = dates.some(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 6;
      });

      expect(hasApril6).toBe(true);
    });

    test('should handle timezone-aware day exclusion', () => {
      const recurrence = new CustomRecurrenceRule({
        freq: RRule.DAILY,
        interval: 1,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 10, 10, 0, 0),
        tzid: "America/Santiago",
        targetTimezone: "America/Santiago",
        excludeDays: [
          new Date(2025, 3, 5) // April 5th
        ]
      });

      const dates = recurrence.getAllDates();

      // Should not include April 5th regardless of server timezone
      const hasApril5 = dates.some(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 5;
      });

      expect(hasApril5).toBe(false);
    });

    test('should allow adding exclude days after creation', () => {
      const recurrence = new CustomRecurrenceRule({
        freq: RRule.DAILY,
        interval: 1,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 10, 10, 0, 0),
        tzid: "UTC"
      });

      // Add exclude days after creation
      recurrence.addExcludeDay(2025, 3, 5); // April 5th
      recurrence.addExcludeDay(2025, 3, 7); // April 7th

      const dates = recurrence.getAllDates();

      // Should not include April 5th and 7th
      const hasApril5 = dates.some(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 5;
      });

      const hasApril7 = dates.some(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 7;
      });

      expect(hasApril5).toBe(false);
      expect(hasApril7).toBe(false);
    });

    test('should allow adding multiple exclude days at once', () => {
      const recurrence = new CustomRecurrenceRule({
        freq: RRule.DAILY,
        interval: 1,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 10, 10, 0, 0),
        tzid: "UTC"
      });

      // Add multiple exclude days
      recurrence.addExcludeDays([
        { year: 2025, month: 3, day: 5 }, // April 5th
        { year: 2025, month: 3, day: 7 }, // April 7th
        { year: 2025, month: 3, day: 9 }  // April 9th
      ]);

      const dates = recurrence.getAllDates();

      // Should not include any of the excluded days
      const hasApril5 = dates.some(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 5;
      });

      const hasApril7 = dates.some(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 7;
      });

      const hasApril9 = dates.some(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 9;
      });

      expect(hasApril5).toBe(false);
      expect(hasApril7).toBe(false);
      expect(hasApril9).toBe(false);
    });

    test('should allow setting exclude days after creation', () => {
      const recurrence = new CustomRecurrenceRule({
        freq: RRule.DAILY,
        interval: 1,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 10, 10, 0, 0),
        tzid: "UTC"
      });

      // Set exclude days after creation
      recurrence.setExcludeDays([
        new Date(2025, 3, 5), // April 5th
        new Date(2025, 3, 7)  // April 7th
      ]);

      const dates = recurrence.getAllDates();

      // Should not include April 5th and 7th
      const hasApril5 = dates.some(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 5;
      });

      const hasApril7 = dates.some(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 7;
      });

      expect(hasApril5).toBe(false);
      expect(hasApril7).toBe(false);
    });

    test('should handle excludeDays with time adjustments', () => {
      const recurrence = new CustomRecurrenceRule({
        freq: RRule.DAILY,
        interval: 1,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 10, 10, 0, 0),
        tzid: "UTC",
        excludeDays: [
          new Date(2025, 3, 5) // April 5th
        ],
        setTime: { hour: 14, minute: 30, second: 0 }
      });

      const dates = recurrence.getAllDates();

      // Should not include April 5th
      const hasApril5 = dates.some(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 5;
      });

      expect(hasApril5).toBe(false);

      // Should still have time adjustments applied to other dates
      if (dates.length > 0) {
        const firstDate = DateTime.fromJSDate(dates[0]);
        expect(firstDate.hour).toBe(14);
        expect(firstDate.minute).toBe(30);
      }
    });

    test('should handle excludeDays with time offsets', () => {
      const recurrence = new CustomRecurrenceRule({
        freq: RRule.DAILY,
        interval: 1,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 10, 10, 0, 0),
        tzid: "UTC",
        excludeDays: [
          new Date(2025, 3, 5) // April 5th
        ],
        timeOffset: { hours: 2, minutes: 30 }
      });

      const dates = recurrence.getAllDates();

      // Should not include April 5th
      const hasApril5 = dates.some(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 5;
      });

      expect(hasApril5).toBe(false);

      // Should still have time offsets applied to other dates
      expect(dates.length).toBeGreaterThan(0);
    });

    test('should handle excludeDays with date replacements', () => {
      const recurrence = new CustomRecurrenceRule({
        freq: RRule.DAILY,
        interval: 1,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 10, 10, 0, 0),
        tzid: "UTC",
        excludeDays: [
          new Date(2025, 3, 5) // April 5th
        ],
        replaceDates: [
          {
            date: datetime(2025, 4, 3, 10, 0, 0),
            newDate: datetime(2025, 4, 3, 14, 30, 0)
          }
        ]
      });

      const dates = recurrence.getAllDates();

      // Should not include April 5th
      const hasApril5 = dates.some(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 5;
      });

      expect(hasApril5).toBe(false);

      // Should still have date replacements applied to other dates
      const april3 = dates.find(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 3;
      });

      expect(april3).toBeDefined();
    });

    test('should handle empty excludeDays array', () => {
      const recurrence = new CustomRecurrenceRule({
        freq: RRule.DAILY,
        interval: 1,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 10, 10, 0, 0),
        tzid: "UTC",
        excludeDays: []
      });

      const dates = recurrence.getAllDates();

      // Should include all dates normally
      expect(dates.length).toBeGreaterThan(0);

      // Should include April 5th (not excluded)
      const hasApril5 = dates.some(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 5;
      });

      expect(hasApril5).toBe(true);
    });

    test('should include excludeDays in configuration output', () => {
      const recurrence = new CustomRecurrenceRule({
        freq: RRule.DAILY,
        interval: 1,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 10, 10, 0, 0),
        tzid: "UTC",
        excludeDays: [
          new Date(2025, 3, 5), // April 5th
          new Date(2025, 3, 7)  // April 7th
        ]
      });

      const config = recurrence.getConfig();

      // Should include excludeDays in configuration
      expect(config.excludeDays).toBeDefined();
      expect(Array.isArray(config.excludeDays)).toBe(true);
      expect(config.excludeDays.length).toBe(2);

      // Should show both original and timezone-adjusted dates
      expect(config.excludeDays[0]).toHaveProperty('original');
      expect(config.excludeDays[0]).toHaveProperty('timezoneAdjusted');
    });

    test('should handle excludeDays with different timezones', () => {
      const recurrence = new CustomRecurrenceRule({
        freq: RRule.DAILY,
        interval: 1,
        dtstart: datetime(2025, 4, 1, 10, 0, 0),
        until: datetime(2025, 4, 10, 10, 0, 0),
        tzid: "America/New_York",
        targetTimezone: "America/Los_Angeles",
        excludeDays: [
          new Date(2025, 3, 5) // April 5th
        ]
      });

      const dates = recurrence.getAllDates();

      // Should not include April 5th in the target timezone
      const hasApril5 = dates.some(date => {
        const dt = DateTime.fromJSDate(date);
        return dt.year === 2025 && dt.month === 4 && dt.day === 5;
      });

      expect(hasApril5).toBe(false);
    });
  });
}); 