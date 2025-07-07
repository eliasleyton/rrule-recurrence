import { processData } from "./index";
import { datetime, RRule } from "rrule";
import { RecurrenceOptions } from "./plugins/1.1.0/RecurrenceSchema";

const config: RecurrenceOptions = {
    freq: RRule.DAILY,
    interval: 1,
    dtstart: datetime(2025, 1, 18, 10, 0, 0),
    until: datetime(2025, 10, 30, 10, 0, 0),
    tzid: "America/Santiago",
    excludeDays: [
        new Date(2025, 0, 1),   // 1 de enero - la librería maneja la zona horaria automáticamente
        new Date(2025, 4, 1),   // 1 de mayo
        new Date(2025, 8, 18),  // 18 de septiembre
        new Date(2025, 8, 19),  // 19 de septiembre
    ],
    keepLocalTime: true,
    targetTimezone: "America/Santiago",
    timeOffset: { hours: 0 },
    replaceDates: [],
};

try {
    const recurrence100 = processData("1.1.0", config);
    recurrence100.printAllDates();
} catch (error) {
    console.error(error);
}
