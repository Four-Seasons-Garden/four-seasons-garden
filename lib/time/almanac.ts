import { Solar } from "lunar-typescript";

export function formatZonedClock(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function zonedParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    calendar: "gregory",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    weekday: read("weekday"),
    hour: Number(read("hour")),
    minute: Number(read("minute")),
    second: Number(read("second")),
  };
}

export function formatMonthName(month: number) {
  const date = new Date(Date.UTC(2020, month - 1, 1));
  return new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(date);
}

/* Gregorian date plus the Chinese lunar date, zodiac, and four pillars. */
export function buildAlmanac(date: Date | null, timezone: string) {
  if (!date) return null;

  const parts = zonedParts(date, timezone);
  const lunar = Solar
    .fromYmdHms(parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.second)
    .getLunar();
  const pillars = [
    `${lunar.getYearInGanZhiExact()}年`,
    `${lunar.getMonthInGanZhiExact()}月`,
    `${lunar.getDayInGanZhiExact()}日`,
    `${lunar.getTimeInGanZhi()}时`,
  ];

  return {
    gregorian: {
      year: `${parts.year}`,
      month: formatMonthName(parts.month),
      day: `${parts.day}`,
      weekday: parts.weekday,
    },
    lunarDate: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    zodiac: lunar.getYearShengXiaoExact(),
    pillars,
    timePillar: `${lunar.getTimeInGanZhi()}时`,
    jieQi: lunar.getJieQi() || "—",
  };
}

/* Minutes past local midnight in the given timezone. */
export function zonedMinutes(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

/* Minutes past midnight from an ISO-ish "…T HH:MM" string. */
export function localTimeMinutes(value: string) {
  const time = value.split("T")[1] ?? value;
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}
