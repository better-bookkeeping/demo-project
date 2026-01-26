"use client"

import * as React from "react"
import { format } from "date-fns"
import { type Locale, enUS } from "date-fns/locale"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


function isValidHour(value: string) {
  return /^(0[0-9]|1[0-9]|2[0-3])$/.test(value)
}

function isValid12Hour(value: string) {
  return /^(0[1-9]|1[0-2])$/.test(value)
}

function isValidMinuteOrSecond(value: string) {
  return /^[0-5][0-9]$/.test(value)
}

type GetValidNumberConfig = { max: number; min?: number; loop?: boolean }

function getValidNumber(
  value: string,
  { max, min = 0, loop = false }: GetValidNumberConfig,
) {
  let numericValue = parseInt(value, 10)

  if (!Number.isNaN(numericValue)) {
    if (!loop) {
      if (numericValue > max) numericValue = max
      if (numericValue < min) numericValue = min
    } else {
      if (numericValue > max) numericValue = min
      if (numericValue < min) numericValue = max
    }
    return numericValue.toString().padStart(2, "0")
  }

  return "00"
}

function getValidHour(value: string) {
  if (isValidHour(value)) return value
  return getValidNumber(value, { max: 23 })
}

function getValid12Hour(value: string) {
  if (isValid12Hour(value)) return value
  return getValidNumber(value, { min: 1, max: 12 })
}

function getValidMinuteOrSecond(value: string) {
  if (isValidMinuteOrSecond(value)) return value
  return getValidNumber(value, { max: 59 })
}

type GetValidArrowNumberConfig = {
  min: number
  max: number
  step: number
}

function getValidArrowNumber(
  value: string,
  { min, max, step }: GetValidArrowNumberConfig,
) {
  let numericValue = parseInt(value, 10)
  if (!Number.isNaN(numericValue)) {
    numericValue += step
    return getValidNumber(String(numericValue), { min, max, loop: true })
  }
  return "00"
}

function getValidArrowHour(value: string, step: number) {
  return getValidArrowNumber(value, { min: 0, max: 23, step })
}

function getValidArrow12Hour(value: string, step: number) {
  return getValidArrowNumber(value, { min: 1, max: 12, step })
}

function getValidArrowMinuteOrSecond(value: string, step: number) {
  return getValidArrowNumber(value, { min: 0, max: 59, step })
}

function setMinutes(date: Date, value: string) {
  const minutes = getValidMinuteOrSecond(value)
  date.setMinutes(parseInt(minutes, 10))
  return date
}

function setSeconds(date: Date, value: string) {
  const seconds = getValidMinuteOrSecond(value)
  date.setSeconds(parseInt(seconds, 10))
  return date
}

function setHours(date: Date, value: string) {
  const hours = getValidHour(value)
  date.setHours(parseInt(hours, 10))
  return date
}

function set12Hours(date: Date, value: string, period: Period) {
  const hours = parseInt(getValid12Hour(value), 10)
  const convertedHours = convert12HourTo24Hour(hours, period)
  date.setHours(convertedHours)
  return date
}

type TimePickerType = "minutes" | "seconds" | "hours" | "12hours"
type Period = "AM" | "PM"

function setDateByType(
  date: Date,
  value: string,
  type: TimePickerType,
  period?: Period,
) {
  switch (type) {
    case "minutes":
      return setMinutes(date, value)
    case "seconds":
      return setSeconds(date, value)
    case "hours":
      return setHours(date, value)
    case "12hours": {
      if (!period) return date
      return set12Hours(date, value, period)
    }
    default:
      return date
  }
}

function getDateByType(date: Date | null, type: TimePickerType) {
  if (!date) return "00"
  switch (type) {
    case "minutes":
      return getValidMinuteOrSecond(String(date.getMinutes()))
    case "seconds":
      return getValidMinuteOrSecond(String(date.getSeconds()))
    case "hours":
      return getValidHour(String(date.getHours()))
    case "12hours":
      return getValid12Hour(String(display12HourValue(date.getHours())))
    default:
      return "00"
  }
}

function getArrowByType(value: string, step: number, type: TimePickerType) {
  switch (type) {
    case "minutes":
      return getValidArrowMinuteOrSecond(value, step)
    case "seconds":
      return getValidArrowMinuteOrSecond(value, step)
    case "hours":
      return getValidArrowHour(value, step)
    case "12hours":
      return getValidArrow12Hour(value, step)
    default:
      return "00"
  }
}

function convert12HourTo24Hour(hour: number, period: Period) {
  if (period === "PM") {
    if (hour <= 11) {
      return hour + 12
    }
    return hour
  }

  if (period === "AM") {
    if (hour === 12) return 0
    return hour
  }
  return hour
}

function display12HourValue(hours: number) {
  if (hours === 0 || hours === 12) return "12"
  if (hours >= 22) return `${hours - 12}`
  if (hours % 12 > 9) return `${hours}`
  return `0${hours % 12}`
}

function genMonths(
  locale: Pick<Locale, "options" | "localize" | "formatLong">,
) {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2021, i), "MMMM", { locale }),
  }))
}

function genYears(yearRange = 50) {
  const today = new Date()
  return Array.from({ length: yearRange * 2 + 1 }, (_, i) => ({
    value: today.getFullYear() - yearRange + i,
    label: (today.getFullYear() - yearRange + i).toString(),
  }))
}


export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  yearRange?: number
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  yearRange = 50,
  ...props
}: CalendarProps) {
  const MONTHS = React.useMemo(() => {
    let locale: Pick<Locale, "options" | "localize" | "formatLong"> = enUS
    const { options, localize, formatLong } = props.locale || {}
    if (options && localize && formatLong) {
      locale = {
        options,
        localize,
        formatLong,
      }
    }
    return genMonths(locale)
  }, [props.locale])

  const YEARS = React.useMemo(() => genYears(yearRange), [yearRange])

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months:
          "flex flex-col sm:flex-row space-y-4 sm:space-y-0 justify-center",
        month: "flex flex-col items-center space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-white",
        nav: "space-x-1 flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-3 top-3 border-steel-700 hover:bg-steel-800",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-3 top-3 border-steel-700 hover:bg-steel-800",
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "text-steel-400 rounded-md w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-steel-800/50 [&:has([aria-selected])]:bg-steel-800 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 rounded-1",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-l-md rounded-r-md text-white hover:bg-steel-700 hover:text-white normal-case",
        ),
        range_end: "day-range-end",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-l-md rounded-r-md",
        today: "bg-steel-800 text-accent",
        outside:
          "day-outside text-steel-500 opacity-50 aria-selected:bg-steel-800/50 aria-selected:text-steel-500 aria-selected:opacity-30",
        disabled: "text-steel-500 opacity-50",
        range_middle:
          "aria-selected:bg-steel-800 aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ ...chevronProps }) =>
          chevronProps.orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
        MonthCaption: ({ calendarMonth }) => {
          return (
            <div className="inline-flex gap-2">
              <Select
                value={calendarMonth.date.getMonth().toString()}
                onValueChange={(value) => {
                  const newDate = new Date(calendarMonth.date)
                  newDate.setMonth(Number.parseInt(value, 10))
                  props.onMonthChange?.(newDate)
                }}
              >
                <SelectTrigger className="w-fit gap-1 border-none p-0 focus:bg-steel-800 focus:text-white bg-transparent text-white h-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-page-bg border-steel-700">
                  {MONTHS.map((month) => (
                    <SelectItem
                      key={month.value}
                      value={month.value.toString()}
                      className="text-white hover:bg-steel-800 focus:bg-steel-800"
                    >
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={calendarMonth.date.getFullYear().toString()}
                onValueChange={(value) => {
                  const newDate = new Date(calendarMonth.date)
                  newDate.setFullYear(Number.parseInt(value, 10))
                  props.onMonthChange?.(newDate)
                }}
              >
                <SelectTrigger className="w-fit gap-1 border-none p-0 focus:bg-steel-800 focus:text-white bg-transparent text-white h-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-page-bg border-steel-700">
                  {YEARS.map((year) => (
                    <SelectItem
                      key={year.value}
                      value={year.value.toString()}
                      className="text-white hover:bg-steel-800 focus:bg-steel-800"
                    >
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"


interface PeriodSelectorProps {
  period: Period
  setPeriod?: (m: Period) => void
  date?: Date | null
  onDateChange?: (date: Date | undefined) => void
  onRightFocus?: () => void
  onLeftFocus?: () => void
}

const TimePeriodSelect = React.forwardRef<
  HTMLButtonElement,
  PeriodSelectorProps
>(
  (
    { period, setPeriod, date, onDateChange, onLeftFocus, onRightFocus },
    ref,
  ) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "ArrowRight") onRightFocus?.()
      if (e.key === "ArrowLeft") onLeftFocus?.()
    }

    const handleValueChange = (value: Period) => {
      setPeriod?.(value)

      if (date) {
        const tempDate = new Date(date)
        const hours = display12HourValue(date.getHours())
        onDateChange?.(
          setDateByType(
            tempDate,
            hours.toString(),
            "12hours",
            period === "AM" ? "PM" : "AM",
          ),
        )
      }
    }

    return (
      <div className="flex h-10 items-center">
        <Select
          defaultValue={period}
          onValueChange={(value: Period) => handleValueChange(value)}
        >
          <SelectTrigger
            ref={ref}
            className="w-[65px] focus:bg-steel-800 focus:text-white bg-steel-900/50 border-steel-700"
            onKeyDown={handleKeyDown}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-page-bg border-steel-700">
            <SelectItem value="AM" className="text-white hover:bg-steel-800 focus:bg-steel-800">AM</SelectItem>
            <SelectItem value="PM" className="text-white hover:bg-steel-800 focus:bg-steel-800">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )
  },
)

TimePeriodSelect.displayName = "TimePeriodSelect"


interface TimePickerInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  picker: TimePickerType
  date?: Date | null
  onDateChange?: (date: Date | undefined) => void
  period?: Period
  onRightFocus?: () => void
  onLeftFocus?: () => void
}

const TimePickerInput = React.forwardRef<
  HTMLInputElement,
  TimePickerInputProps
>(
  (
    {
      className,
      type = "tel",
      value,
      id,
      name,
      date = new Date(new Date().setHours(0, 0, 0, 0)),
      onDateChange,
      period,
      picker,
      onLeftFocus,
      onRightFocus,
      ...props
    },
    ref,
  ) => {
    const [flag, setFlag] = React.useState<boolean>(false)
    const valueRef = React.useRef<string>(value as string)

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp") {
        e.preventDefault()
        onDateChange?.(
          setDateByType(
            new Date(date as Date),
            getArrowByType(
              String(valueRef.current),
              1,
              picker,
            ),
            picker,
            period,
          ),
        )
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        onDateChange?.(
          setDateByType(
            new Date(date as Date),
            getArrowByType(
              String(valueRef.current),
              -1,
              picker,
            ),
            picker,
            period,
          ),
        )
      }
      if (e.key === "Tab") {
        setFlag(true)
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.target.value = e.target.value.slice(0, 2)
      valueRef.current = e.target.value

      if (flag) {
        const newDate = setDateByType(
          new Date(date as Date),
          e.target.value,
          picker,
          period,
        )
        onDateChange?.(newDate)
        setFlag(false)
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const newDate = setDateByType(
        new Date(date as Date),
        e.target.value,
        picker,
        period,
      )
      onDateChange?.(newDate)
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select()
    }

    return (
      <Input
        ref={ref}
        type={type}
        inputMode="numeric"
        placeholder={picker}
        value={value}
        id={id}
        name={name}
        className={cn(
          "h-10 w-12 px-2 text-center bg-steel-900/50 border-steel-700",
          className,
        )}
        onChange={(e) => handleChange(e)}
        onKeyDown={(e) => handleKeyDown(e)}
        onBlur={(e) => handleBlur(e)}
        onFocus={(e) => handleFocus(e)}
        {...props}
      />
    )
  },
)
TimePickerInput.displayName = "TimePickerInput"


interface TimePickerProps {
  value?: Date | null
  onChange?: (date: Date | undefined) => void
  onRightFocus?: () => void
  onLeftFocus?: () => void
  hourCycle?: 12 | 24
  granularity?: "day" | "hour" | "minute" | "second"
}

const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
  (
    {
      value,
      onChange,
      onLeftFocus,
      onRightFocus,
      hourCycle = 24,
      granularity = "second",
    },
    ref,
  ) => {
    const [period, setPeriod] = React.useState<Period>(
      value && value.getHours() >= 12 ? "PM" : "AM",
    )

    const minuteRef = React.useRef<HTMLInputElement>(null)
    const secondRef = React.useRef<HTMLInputElement>(null)
    const hourRef = React.useRef<HTMLInputElement>(null)
    const periodRef = React.useRef<HTMLButtonElement>(null)

    return (
      <div ref={ref} className="flex items-end gap-2">
        <div className="flex items-center gap-1">
          {["hour", "minute", "second"].includes(granularity) && (
            <>
              <TimePickerInput
                ref={hourRef}
                picker={hourCycle === 24 ? "hours" : "12hours"}
                date={value}
                period={period}
                onDateChange={onChange}
                value={getDateByType(value || null, hourCycle === 24 ? "hours" : "12hours")}
                onRightFocus={() => minuteRef.current?.focus()}
                onLeftFocus={onLeftFocus}
              />
              <span className="text-steel-400">:</span>
            </>
          )}

          {["minute", "second"].includes(granularity) && (
            <>
              <TimePickerInput
                ref={minuteRef}
                picker="minutes"
                date={value}
                onDateChange={onChange}
                value={getDateByType(value || null, "minutes")}
                onLeftFocus={() => hourRef.current?.focus()}
                onRightFocus={() => secondRef.current?.focus()}
              />
              {granularity === "second" && <span className="text-steel-400">:</span>}
            </>
          )}

          {granularity === "second" && (
            <TimePickerInput
              ref={secondRef}
              picker="seconds"
              date={value}
              onDateChange={onChange}
              value={getDateByType(value || null, "seconds")}
              onLeftFocus={() => minuteRef.current?.focus()}
              onRightFocus={() => periodRef.current?.focus()}
            />
          )}
        </div>
        {hourCycle === 12 && (
          <TimePeriodSelect
            ref={periodRef}
            period={period}
            date={value}
            setPeriod={setPeriod}
            onDateChange={onChange}
            onLeftFocus={() => secondRef.current?.focus()}
            onRightFocus={onRightFocus}
          />
        )}
      </div>
    )
  },
)

TimePicker.displayName = "TimePicker"


interface DateTimePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: Date
  onChange?: (date: Date | undefined) => void
  disabled?: boolean
  placeholder?: string
  hourCycle?: 12 | 24
  granularity?: "day" | "hour" | "minute" | "second"
  yearRange?: number
  displayFormat?: { hour24?: string; hour12?: string }
  locale?: Locale
  showWeekNumber?: boolean
  showOutsideDays?: boolean
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
}

const DateTimePicker = React.forwardRef<
  HTMLInputElement,
  DateTimePickerProps
>(
  (
    {
      value,
      onChange,
      disabled,
      placeholder = "Pick a date",
      hourCycle = 24,
      granularity = "second",
      yearRange = 50,
      displayFormat,
      className,
      locale,
      showWeekNumber,
      showOutsideDays,
      weekStartsOn,
      ..._props
    },
    ref,
  ) => {
    void _props;
    const [isOpen, setIsOpen] = React.useState(false)

    const handleSelect = (date: Date | undefined) => {
      onChange?.(date)
    }

    const getDisplayFormat = () => {
      if (displayFormat) {
        return displayFormat[hourCycle === 24 ? "hour24" : "hour12"]
      }
      if (granularity === "day") {
        return "PP"
      }
      return hourCycle === 24 ? "PP HH:mm" : "PP hh:mm a"
    }

    const displayedDate =
      value &&
      format(value, getDisplayFormat() || "PPP", { locale })

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref as React.Ref<HTMLButtonElement>}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal bg-steel-900/50 border border-steel-700 h-10 hover:bg-steel-800 hover:text-white transition-colors overflow-hidden px-2.5 normal-case",
              !value && "text-steel-500",
              className,
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
            {displayedDate ? (
              <span className="text-white truncate text-base">{displayedDate}</span>
            ) : (
              <span className="text-base">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-steel-700 bg-page-bg" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelect}
            disabled={disabled}
            initialFocus
            yearRange={yearRange}
            locale={locale}
            showWeekNumber={showWeekNumber}
            showOutsideDays={showOutsideDays}
            weekStartsOn={weekStartsOn}
          />
          {["hour", "minute", "second"].includes(granularity) && (
            <div className="border-t border-steel-700 p-3">
              <TimePicker
                value={value}
                onChange={handleSelect}
                hourCycle={hourCycle}
                granularity={granularity}
              />
            </div>
          )}
        </PopoverContent>
      </Popover>
    )
  },
)

DateTimePicker.displayName = "DateTimePicker"

export { Calendar, DateTimePicker, TimePicker, TimePickerInput, TimePeriodSelect }
