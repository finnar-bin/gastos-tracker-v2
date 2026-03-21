function padDatePart(value: number) {
  return value.toString().padStart(2, "0");
}

function getDaysInMonth(year: number, monthIndex: number) {
  if (monthIndex === 1) {
    const isLeapYear =
      year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return isLeapYear ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(monthIndex + 1) ? 30 : 31;
}

export function getMonthDateRange(year: number, monthIndex: number) {
  const month = padDatePart(monthIndex + 1);
  const lastDay = padDatePart(getDaysInMonth(year, monthIndex));

  return {
    startDate: `${year}-${month}-01`,
    endDate: `${year}-${month}-${lastDay}`,
  };
}

export function getMonthIndexFromDateString(value: string) {
  const month = Number(value.split("-")[1]);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return month - 1;
}
