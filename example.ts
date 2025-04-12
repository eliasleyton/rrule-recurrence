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

    // 2025-04-01T15:00:00.000Z
    // 2025-04-03T15:00:00.000Z
    // 2025-04-05T15:00:00.000Z
    // 2025-04-07T16:00:00.000Z
    // 2025-04-09T16:00:00.000Z
    // 2025-04-11T16:00:00.000Z
    // 2025-04-13T14:20:00.000Z
    // 2025-04-15T16:20:00.000Z
    // 2025-04-17T16:00:00.000Z
    // 2025-04-21T16:00:00.000Z
    // 2025-04-23T16:00:00.000Z
    // 2025-04-25T16:00:00.000Z
    // 2025-04-27T16:00:00.000Z
    // 2025-04-29T16:00:00.000Z

} catch (error) {
    console.error(error);
}
