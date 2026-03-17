import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS, th } from "date-fns/locale";
import { dateFnsLocalizer as makeLocalizer } from "react-big-calendar";

const locales = {
  "en-US": enUS,
  en: enUS,
  th,
};

export const dateFnsLocalizer = makeLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) =>
    startOfWeek(date, {
      weekStartsOn: 1,
    }),
  getDay,
  locales,
});

