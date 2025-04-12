import { processData } from "./index";
import { datetime, RRule } from "rrule";

const config = {
    freq: RRule.DAILY,
    interval: 2,
    dtstart: datetime(2025, 4, 1, 10, 0, 0),
    until: datetime(2025, 4, 30, 10, 0, 0),
    tzid: "America/Santiago",
    excludeDates: [
        datetime(2025, 4, 19, 10, 0, 0)
    ],
    keepLocalTime: true,
    targetTimezone: "America/Santiago",
    timeOffset: { hours: 2 },
    replaceDates: [
        {
            date: datetime(2025, 4, 13, 10, 0, 0),
            newDate: datetime(2025, 4, 13, 14, 20, 0)
        },
        {
            date: datetime(2025, 4, 15, 10, 0, 0),
            newDate: datetime(2025, 4, 15, 16, 20, 0)
        }
    ]
};

try {
    const recurrence100 = processData("1.0.0", config);
    recurrence100.printAllDates();
} catch (error) {
    console.error(error);
}
