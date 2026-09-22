import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, AlertTriangle, CheckCircle2, Zap, Sun, Moon, Check } from 'lucide-react';
import {
  toTotalSeconds,
  fromTotalSeconds,
  formatTimeString,
  parseTimeString,
  validateTimeSlot,
  getEarliestValidTime,
  isDateToday,
  isDateInPast,
  validateDeliveryDate,
  getTodayDateString,
  isHourOutsideOperating,
  OPENING_SECONDS,
  CLOSING_SECONDS,
  LEAD_TIME_SECONDS,
} from '../../utils/timeValidation';

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (e) {
    return dateStr;
  }
};

const ScheduleDeliveryPicker = ({
  deliveryDate,
  onDateChange,
  timeSlot,
  onTimeChange,
  isTimeSlotValid,
  timeSlotError,
}) => {
  const [activeCard, setActiveCard] = useState('date'); // 'date' | 'time'
  const dateInputRef = useRef(null);

  // Parse time components
  const initialTime = useMemo(() => {
    const parsed = parseTimeString(timeSlot);
    if (parsed) return parsed;
    return getEarliestValidTime(deliveryDate);
  }, [timeSlot, deliveryDate]);

  const [hour, setHour] = useState(initialTime.hour);
  const [minute, setMinute] = useState(initialTime.minute);
  const [period, setPeriod] = useState(initialTime.period);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Sync if timeSlot changes externally
  useEffect(() => {
    const parsed = parseTimeString(timeSlot);
    if (parsed) {
      setHour(parsed.hour);
      setMinute(parsed.minute);
      setPeriod(parsed.period);
    }
  }, [timeSlot]);

  // Formatted display time (Hour:Minute AM/PM)
  const formattedTime = useMemo(() => {
    return formatTimeString(hour, minute, 0, period);
  }, [hour, minute, period]);

  // Combined validation
  const validation = useMemo(() => {
    return validateTimeSlot(hour, minute, 0, period, deliveryDate);
  }, [hour, minute, period, deliveryDate]);

  // Check date validation
  const dateValidation = useMemo(() => {
    return validateDeliveryDate(deliveryDate);
  }, [deliveryDate]);

  const isPast = isDateInPast(deliveryDate);
  const isToday = isDateToday(deliveryDate);

  // Emit changes to parent
  useEffect(() => {
    if (onTimeChange) {
      onTimeChange(formattedTime, validation.isValid && dateValidation.isValid, validation.error || dateValidation.error);
    }
  }, [formattedTime, validation.isValid, validation.error, dateValidation.isValid, dateValidation.error, onTimeChange]);

  const handleSetEarliest = () => {
    const earliest = getEarliestValidTime(deliveryDate);
    setHour(earliest.hour);
    setMinute(earliest.minute);
    setSecond(earliest.second || 0);
    setPeriod(earliest.period);
    setIsConfirmed(false);
  };

  const handleQuickPreset = (h, m, p) => {
    setHour(h);
    setMinute(m);
    setSecond(0);
    setPeriod(p);
    setIsConfirmed(false);
  };

  // Quick Date Selectors
  const handleSelectToday = () => {
    const today = getTodayDateString();
    onDateChange(today);
    setActiveCard('time');
    setIsConfirmed(false);
  };

  const handleSelectTomorrow = () => {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    const yr = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const da = String(now.getDate()).padStart(2, '0');
    const tomorrowStr = `${yr}-${mo}-${da}`;
    onDateChange(tomorrowStr);
    setActiveCard('time');
    setIsConfirmed(false);
  };

  const handleCardDateClick = () => {
    setActiveCard('date');
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch (e) {
        dateInputRef.current.focus();
      }
    }
  };

  const handleCardTimeClick = () => {
    setActiveCard('time');
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    if (dateValidation.isValid && validation.isValid) {
      setIsConfirmed(true);
      setActiveCard(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-5 max-w-lg mx-auto sm:max-w-none">
      
      {/* 1. Header with Accent Bar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-2 sm:w-2.5 h-7 sm:h-8 bg-blue-500 rounded-full shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
              Schedule Delivery
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Choose a day and time in the future you want your order to be delivered.
            </p>
          </div>
        </div>

        {isConfirmed && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Confirmed
          </span>
        )}
      </div>

      {/* 2. Interactive Input Cards (Date & Time) */}
      <div className="space-y-3">
        
        {/* Date Card */}
        <div
          onClick={handleCardDateClick}
          className={`relative flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all duration-200 select-none ${
            activeCard === 'date'
              ? 'border-2 border-blue-500 bg-blue-50/10 shadow-xs ring-4 ring-blue-50'
              : isPast
              ? 'border-2 border-rose-400 bg-rose-50/20'
              : 'border border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
            <CalendarIcon className="w-5 h-5 text-slate-700" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">
              Date
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {formatDisplayDate(deliveryDate) || 'Select date'}
              {isToday && (
                <span className="ml-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Today
                </span>
              )}
            </div>
          </div>

          {/* Hidden native date picker triggered programmatically */}
          <input
            ref={dateInputRef}
            type="date"
            min={getTodayDateString()}
            value={deliveryDate}
            onChange={(e) => {
              onDateChange(e.target.value);
              setIsConfirmed(false);
            }}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer pointer-events-auto"
          />
        </div>

        {/* Quick Date Presets */}
        {activeCard === 'date' && (
          <div className="flex flex-wrap items-center gap-2 px-1 pt-1 pb-2">
            <span className="text-[11px] font-medium text-slate-400">Quick day:</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectToday();
              }}
              className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-all ${
                isToday
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectTomorrow();
              }}
              className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (dateInputRef.current) {
                  try { dateInputRef.current.showPicker(); } catch (err) { dateInputRef.current.focus(); }
                }
              }}
              className="text-xs font-semibold px-3 py-1 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-all ml-auto"
            >
              Pick from Calendar &rarr;
            </button>
          </div>
        )}

        {/* Time Card */}
        <div
          onClick={handleCardTimeClick}
          className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all duration-200 select-none ${
            activeCard === 'time'
              ? 'border-2 border-blue-500 bg-blue-50/10 shadow-xs ring-4 ring-blue-50'
              : !validation.isValid
              ? 'border-2 border-rose-400 bg-rose-50/20'
              : 'border border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
            <Clock className="w-5 h-5 text-slate-700" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">
              Time
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {formattedTime}
            </div>
          </div>
        </div>

      </div>

      {/* 3. Clock Custom Time Selectors (Active when Time card is clicked) */}
      {activeCard === 'time' && (
        <div className="pt-2 p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4 animate-fadeIn">
          
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <span className="text-xs font-bold text-slate-700">
              Select Time Components
            </span>
            <span className="text-[11px] text-slate-500">
              Slots: <strong className="text-slate-800">9:00 AM – 10:30 PM</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            {/* Hour */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Hour (1-12)</label>
              <select
                value={hour}
                onChange={(e) => {
                  setHour(parseInt(e.target.value, 10));
                  setIsConfirmed(false);
                }}
                className={`w-full text-xs font-bold p-2.5 rounded-xl border bg-white focus:outline-none ${
                  isHourOutsideOperating(hour, period)
                    ? 'border-rose-300 text-rose-700 bg-rose-50/50'
                    : 'border-slate-200 text-slate-900 focus:border-blue-500'
                }`}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => {
                  const outside = isHourOutsideOperating(h, period);
                  return (
                    <option key={h} value={h} disabled={outside} className={outside ? 'text-slate-300 italic' : 'text-slate-800'}>
                      {String(h).padStart(2, '0')} {outside ? '(Closed)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Minute */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Minute (00-59)</label>
              <select
                value={minute}
                onChange={(e) => {
                  setMinute(parseInt(e.target.value, 10));
                  setIsConfirmed(false);
                }}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-blue-500"
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i} className="text-slate-800">
                    {String(i).padStart(2, '0')} min
                  </option>
                ))}
              </select>
            </div>

            {/* Period Toggle AM / PM */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">AM / PM</label>
              <div className="grid grid-cols-2 bg-white border border-slate-200 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setPeriod('AM');
                    setIsConfirmed(false);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    period === 'AM'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPeriod('PM');
                    setIsConfirmed(false);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    period === 'PM'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Presets:
            </span>
            <button
              type="button"
              onClick={handleSetEarliest}
              className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-colors"
            >
              <Zap className="w-3 h-3 text-blue-600" />
              <span>Earliest (+45m)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(11, 0, 'AM')}
              className="text-[11px] font-medium px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
            >
              11:00 AM
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(2, 0, 'PM')}
              className="text-[11px] font-medium px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
            >
              02:00 PM
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(5, 0, 'PM')}
              className="text-[11px] font-medium px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
            >
              05:00 PM
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset(8, 0, 'PM')}
              className="text-[11px] font-medium px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
            >
              08:00 PM
            </button>
          </div>
        </div>
      )}

      {/* 4. Live Validation Feedback */}
      {isPast ? (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>Please select today's date or a future date.</span>
        </div>
      ) : !validation.isValid ? (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div>{validation.error}</div>
            {validation.code === 'INSUFFICIENT_LEAD_TIME' && (
              <p className="text-[11px] font-normal text-rose-600">
                Minimum order lead time is 45 minutes from current time.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Confirmed: <strong className="font-bold">{formatDisplayDate(deliveryDate)} • {formattedTime}</strong>
            </span>
          </div>
          <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            Valid
          </span>
        </div>
      )}

      {/* 5. Bottom Right Confirm/Reschedule Button (matching UI design) */}
      <div className="flex items-center justify-end pt-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isPast || !validation.isValid}
          className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isConfirmed ? (
            <>
              <Check className="w-4 h-4" />
              <span>Schedule Confirmed</span>
            </>
          ) : (
            <span>Reschedule</span>
          )}
        </button>
      </div>

    </div>
  );
};

export default ScheduleDeliveryPicker;
