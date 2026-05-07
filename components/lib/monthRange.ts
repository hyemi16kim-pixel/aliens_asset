export const MONTH_START_DAY_KEY = "alien_month_start_day";

export const getSavedMonthStartDay = () => {
  if (typeof window === "undefined") return 1;

  const saved = Number(localStorage.getItem(MONTH_START_DAY_KEY));
  if (!Number.isFinite(saved)) return 1;

  return Math.min(Math.max(saved, 1), 31);
};

export const toLocalDateKey = (value: Date | string) => {
  const date = new Date(value);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const clampDay = (year: number, monthIndex: number, day: number) => {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, lastDay);
};

export const getBaseMonthByStartDay = (today: Date, startDay: number) => {
  const year = today.getFullYear();
  const monthIndex = today.getMonth();

  if (today.getDate() < startDay) {
    return new Date(year, monthIndex - 1, 1);
  }

  return new Date(year, monthIndex, 1);
};

export const getCustomMonthRange = (baseMonth: Date, startDay: number) => {
  const year = baseMonth.getFullYear();
  const monthIndex = baseMonth.getMonth();

  const start = new Date(
    year,
    monthIndex,
    clampDay(year, monthIndex, startDay),
    0,
    0,
    0,
    0
  );

  const nextBase = new Date(year, monthIndex + 1, 1);
  const endYear = nextBase.getFullYear();
  const endMonthIndex = nextBase.getMonth();

  const end = new Date(
    endYear,
    endMonthIndex,
    clampDay(endYear, endMonthIndex, startDay) - 1,
    23,
    59,
    59,
    999
  );

  return { start, end };
};

export const isDateInRange = (value: string | Date, start: Date, end: Date) => {
  const date = new Date(value);
  return date >= start && date <= end;
};

export const formatMonthRangeLabel = (start: Date, end: Date) => {
  const format = (date: Date) => {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${mm}/${dd}`;
  };

  return `${format(start)}~${format(end)}`;
};