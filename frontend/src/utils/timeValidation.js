/**
 * Time Slot Validation and Calculation Utilities
 * 
 * Rules:
 * 1. Restricted Ordering Hours: 10:30 PM to 9:00 AM
 *    Orders can only be placed between 9:00 AM (09:00) and 10:30 PM (22:30).
 * 2. Minimum Order Lead Time: 45 Minutes
 *    The selected order time must always be at least 45 minutes ahead of the current time when ordering for today.
 */

// 9:00 AM in seconds (9 * 3600)
export const OPENING_SECONDS = 9 * 3600; // 32400

// 10:30 PM in seconds (22 * 3600 + 30 * 60)
export const CLOSING_SECONDS = 22 * 3600 + 30 * 60; // 81000

// 45 minutes in seconds
export const LEAD_TIME_SECONDS = 45 * 60; // 2700

/**
 * Convert 12-hour time components to total seconds from midnight (0 to 86399)
 */
export const toTotalSeconds = (hour, minute = 0, second = 0, period = 'AM') => {
  let h = parseInt(hour, 10);
  const m = parseInt(minute, 10) || 0;
  const s = parseInt(second, 10) || 0;

  if (period === 'AM') {
    h = h === 12 ? 0 : h;
  } else {
    h = h === 12 ? 12 : h + 12;
  }

  return h * 3600 + m * 60 + s;
};

/**
 * Convert total seconds from midnight to 12-hour components
 */
export const fromTotalSeconds = (totalSec) => {
  const clamped = Math.max(0, Math.min(86399, Math.floor(totalSec)));
  const h24 = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;

  const period = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;

  return {
    hour: h12,
    minute: m,
    second: s,
    period,
  };
};

/**
 * Format 12-hour components into a 12-hour time string "HH:MM AM/PM" (no seconds)
 */
export const formatTimeString = (hour, minute = 0, secondOrPeriod = 'AM', possiblePeriod = null) => {
  const pad = (num) => String(num).padStart(2, '0');
  const period = typeof secondOrPeriod === 'string'
    ? secondOrPeriod
    : (possiblePeriod || 'AM');
  return `${pad(hour)}:${pad(minute)} ${period}`;
};

/**
 * Parse time string into { hour, minute, second, period }
 */
export const parseTimeString = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;

  // Matches "02:45:00 PM" or "2:45 PM" or "14:30"
  const match12 = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (match12) {
    return {
      hour: parseInt(match12[1], 10),
      minute: parseInt(match12[2], 10),
      second: match12[3] ? parseInt(match12[3], 10) : 0,
      period: match12[4].toUpperCase(),
    };
  }

  const match24 = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    const h24 = parseInt(match24[1], 10);
    const m = parseInt(match24[2], 10);
    const s = match24[3] ? parseInt(match24[3], 10) : 0;
    return fromTotalSeconds(h24 * 3600 + m * 60 + s);
  }

  return null;
};

/**
 * Get current local date in YYYY-MM-DD format
 */
export const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Check whether deliveryDate matches today
 */
export const isDateToday = (dateStr) => {
  if (!dateStr) return true;
  return dateStr === getTodayDateString();
};

/**
 * Check whether deliveryDate is in the past
 */
export const isDateInPast = (dateStr) => {
  if (!dateStr) return false;
  return dateStr < getTodayDateString();
};

/**
 * Validate delivery date
 */
export const validateDeliveryDate = (dateStr) => {
  if (!dateStr) {
    return {
      isValid: false,
      error: "Please select today's date or a future date.",
      code: 'DATE_REQUIRED',
    };
  }
  if (isDateInPast(dateStr)) {
    return {
      isValid: false,
      error: "Please select today's date or a future date.",
      code: 'PAST_DATE',
    };
  }
  return {
    isValid: true,
    error: null,
    code: 'VALID',
  };
};

/**
 * Validate selected time slot
 * Returns { isValid: boolean, error: string | null }
 */
export const validateTimeSlot = (hour, minute, second, period, deliveryDate) => {
  // 1. Check Date Validity
  const dateVal = validateDeliveryDate(deliveryDate);
  if (!dateVal.isValid) {
    return {
      isValid: false,
      error: dateVal.error,
      code: dateVal.code,
    };
  }

  const totalSeconds = toTotalSeconds(hour, minute, second, period);

  // 2. Check Operating Window (9:00 AM - 10:30 PM)
  if (totalSeconds < OPENING_SECONDS || totalSeconds > CLOSING_SECONDS) {
    return {
      isValid: false,
      error: 'Orders can only be placed between 9:00 AM and 10:30 PM.',
      code: 'OUTSIDE_OPERATING_HOURS',
    };
  }

  // 3. Check 45-Minute Minimum Lead Time (if ordering for today)
  if (isDateToday(deliveryDate)) {
    const now = new Date();
    const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const minRequiredSeconds = currentSeconds + LEAD_TIME_SECONDS;

    if (totalSeconds < minRequiredSeconds) {
      return {
        isValid: false,
        error: 'Please select a time at least 45 minutes from now.',
        code: 'INSUFFICIENT_LEAD_TIME',
        minRequiredSeconds,
      };
    }
  }

  return {
    isValid: true,
    error: null,
    code: 'VALID',
  };
};

/**
 * Get earliest valid delivery time components for a given date
 */
export const getEarliestValidTime = (deliveryDate) => {
  const now = new Date();
  const isToday = isDateToday(deliveryDate);

  if (!isToday) {
    // Tomorrow or later: start at 10:00 AM
    return {
      hour: 10,
      minute: 0,
      second: 0,
      period: 'AM',
    };
  }

  // Today: current time + 45 mins
  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  let targetSeconds = currentSeconds + LEAD_TIME_SECONDS;

  // If before opening (9:00 AM), clamp to 9:00 AM
  if (targetSeconds < OPENING_SECONDS) {
    targetSeconds = OPENING_SECONDS;
  }

  // If after closing (10:30 PM), clamp to closing or indicate closed
  if (targetSeconds > CLOSING_SECONDS) {
    targetSeconds = CLOSING_SECONDS;
  }

  return fromTotalSeconds(targetSeconds);
};

/**
 * Determine if a specific hour in a period is outside operating hours
 */
export const isHourOutsideOperating = (hour, period) => {
  if (period === 'AM') {
    // 1 AM to 8 AM and 12 AM are strictly closed (before 9 AM)
    return hour === 12 || (hour >= 1 && hour <= 8);
  }
  if (period === 'PM') {
    // 11 PM is strictly closed (after 10:30 PM)
    return hour === 11;
  }
  return false;
};
