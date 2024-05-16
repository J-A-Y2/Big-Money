import {
  DateTimeFormatter,
  ZoneId,
  ZonedDateTime,
  convert,
} from '@js-joda/core'
import '@js-joda/timezone'
import { IHandleDateTime } from '@common/interfaces/IHandleDateTime'

export class HandleDateTime implements IHandleDateTime {
  private readonly DATE_FORMATTER = DateTimeFormatter.ofPattern('yyyy-MM-dd')

  private getNowZonedTime(): ZonedDateTime {
    return ZonedDateTime.now(ZoneId.of('Asia/Seoul'))
  }

  getYear(date: Date) {
    return ZonedDateTime.parse(date.toISOString()).year()
  }

  getMonth(date: Date) {
    return ZonedDateTime.parse(date.toISOString()).monthValue()
  }

  getMonthDate(year: number, month: number) {
    return ZonedDateTime.of(
      year,
      month + 1,
      1,
      0,
      0,
      0,
      0,
      ZoneId.of('Asia/Seoul'),
    )
  }

  getEndOfMonth(date: Date): Date {
    const zonedDateTime = ZonedDateTime.parse(date.toISOString())
    const lastDayOfMonth = zonedDateTime.withDayOfMonth(
      zonedDateTime.month().maxLength(),
    )
    return convert(
      lastDayOfMonth
        .withHour(23)
        .withMinute(59)
        .withSecond(59)
        .withNano(999999999),
    ).toDate()
  }

  getRemainingDays(today: Date, endOfMonth: Date): number {
    const todayZonedDateTime = ZonedDateTime.parse(today.toISOString())
    const endOfMonthZonedDateTime = ZonedDateTime.parse(
      endOfMonth.toISOString(),
    )
    const remainingDays =
      (endOfMonthZonedDateTime.toInstant().toEpochMilli() -
        todayZonedDateTime.toInstant().toEpochMilli()) /
      (1000 * 60 * 60 * 24)
    return Math.ceil(remainingDays)
  }

  getYearMonth(monthString: string) {
    const [year, month] = monthString.split('-').map(Number)
    return ZonedDateTime.of(year, month, 1, 0, 0, 0, 0, ZoneId.of('Asia/Seoul'))
  }

  getToday = () => this.getNowZonedTime().format(this.DATE_FORMATTER)

  getYesterday = () =>
    this.getNowZonedTime().minusDays(1).format(this.DATE_FORMATTER)

  getAWeekAgo = () =>
    this.getNowZonedTime().minusWeeks(1).format(this.DATE_FORMATTER)

  getAMonthAgo = () =>
    this.getNowZonedTime().minusMonths(1).format(this.DATE_FORMATTER)

  getFewSecondsLater = (seconds: number) =>
    convert(this.getNowZonedTime().plusSeconds(seconds)).toDate()

  getFewHoursLater = (hours: number) =>
    convert(this.getNowZonedTime().plusHours(hours)).toDate()

  getFewDaysLater = (days: number) =>
    convert(this.getNowZonedTime().plusDays(days)).toDate()

  getDateString = (date: Date) =>
    ZonedDateTime.parse(date.toISOString()).format(this.DATE_FORMATTER)

  getADayAgoFromDate = (date: Date) =>
    ZonedDateTime.parse(date.toISOString())
      .minusDays(1)
      .format(this.DATE_FORMATTER)

  convertZonedDateTimeToDate(zonedDateTime: ZonedDateTime): Date {
    const zonedDateTimeInSeoul = zonedDateTime.withZoneSameInstant(
      ZoneId.of('Asia/Seoul'),
    )
    const date = convert(zonedDateTimeInSeoul).toDate()
    return date
  }
}
