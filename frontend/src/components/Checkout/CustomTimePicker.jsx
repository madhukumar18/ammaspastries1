import React, { useState, useEffect, useMemo } from 'react';
import { Clock, AlertTriangle, CheckCircle2, Zap, Sun, Moon } from 'lucide-react';
import {
  toTotalSeconds,
  fromTotalSeconds,
  formatTimeString,
  parseTimeString,
  validateTimeSlot,
  getEarliestValidTime,
  isDateToday,
  isHourOutsideOperating,
  OPENING_SECONDS,
  CLOSING_SECONDS,
  LEAD_TIME_SECONDS,
} from '../../utils/timeValidation';

const CustomTimePicker = ({
  deliveryDate,
  value,
  onChange,
  onValidationChange,
}) => {
  // Initialize state from existing value or earliest valid time
  const initialTime = useMemo(() => {
    const parsed = parseTimeString(value);
    if (parsed) return parsed;
    return getEarliestValidTime(deliveryDate);
  }, [deliveryDate]);

  const [hour, setHour] = useState(initialTime.hour);
  const [minute, setMinute] = useState(initialTime.minute);
  const [period, setPeriod] = useState(initialTime.period);

  // Sync if value changes externally
  useEffect(() => {
    const parsed = parseTimeString(value);
    if (parsed) {
      setHour(parsed.hour);
      setMinute(parsed.minute);
      setPeriod(parsed.period);
    }
  }, [value]);

  // Current formatted time string (Hour:Minute AM/PM)
  const formattedTime = useMemo(() => {
    return formatTimeString(hour, minute, 0, period);
  }, [hour, minute, period]);

  // Validate whenever hour, minute, period, or deliveryDate changes
  const validation = useMemo(() => {
    return validateTimeSlot(hour, minute, 0, period, deliveryDate);
  }, [hour, minute, period, deliveryDate]);

  // Notify parent on change
  useEffect(() => {
    if (onChange) {
      onChange(formattedTime, validation.isValid, validation.error);
    }
    if (onValidationChange) {
      onValidationChange(validation.isValid, validation.error);
    }
  }, [formattedTime, validation.isValid, validation.error, onChange, onValidationChange]);

  // Handle setting earliest valid time
  const handleSetEarliest = () => {
    const earliest = getEarliestValidTime(deliveryDate);
    setHour(earliest.hour);
    setMinute(earliest.minute);
    setSecond(earliest.second);
    setPeriod(earliest.period);
  };

  // Helper for quick time jumps
  const handleQuickPreset = (targetH, targetM, targetPeriod) => {
    setHour(targetH);
    setMinute(targetM);
    setSecond(0);
    setPeriod(targetPeriod);
  };

  const isToday = isDateToday(deliveryDate);

  // Check if today is completely past closing time (10:30 PM) or after last lead time (9:45 PM)
  const isTodayClosed = useMemo(() => {
    if (!isToday) return false;
    const now = new Date();
    const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    return (currentSeconds + LEAD_TIME_SECONDS) > CLOSING_SECONDS;
  }, [isToday]);

  const earliestTimeTodayStr = useMemo(() => {
    if (!isToday) return null;
    const earliest = getEarliestValidTime(deliveryDate);
    return formatTimeString(earliest.hour, earliest.minute, earliest.second, earliest.period);
  }, [isToday, deliveryDate]);

  return (
    <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/30 rounded-2xl p-4 sm:p-5 border border-amber-200/80 shadow-xs space-y-4">
      
      {/* Header & Digital Clock Preview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700" />
            <span className="text-xs sm:text-sm font-serif font-bold text-chocolate">
              Custom Delivery Time Picker
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Operating delivery hours: <strong className="text-amber-900">9:00 AM – 10:30 PM</strong> (Min. 45 min preparation lead time)
          </p>
        </div>

        {/* Big Digital Clock Display */}
        <div className="inline-flex items-center gap-1.5 self-start sm:self-auto bg-white border-2 border-amber-300 px-3 py-1.5 rounded-xl shadow-xs">
          <span className="text-sm sm:text-base font-mono font-extrabold text-chocolate tracking-wider">
            {formattedTime}
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            period === 'AM' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
          }`}>
            {period}
          </span>
        </div>
      </div>

      {/* Main Selectors: Hour, Minute, AM/PM */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        
        {/* 1. Hour Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Hour (1 - 12)
          </label>
          <div className="relative">
            <select
              value={hour}
              onChange={(e) => setHour(parseInt(e.target.value, 10))}
              className={`w-full text-xs font-bold p-2.5 rounded-xl border bg-white focus:outline-none transition-all ${
                isHourOutsideOperating(hour, period)
                  ? 'border-rose-300 text-rose-700 bg-rose-50/50'
                  : 'border-slate-200 text-chocolate focus:border-amber-500'
              }`}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => {
                const outside = isHourOutsideOperating(h, period);
                return (
                  <option
                    key={h}
                    value={h}
                    disabled={outside}
                    className={outside ? 'text-slate-300 bg-slate-50 italic' : 'text-slate-800 font-semibold'}
                  >
                    {String(h).padStart(2, '0')} {outside ? '(Closed)' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* 2. Minute Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Minute (00 - 59)
          </label>
          <select
            value={minute}
            onChange={(e) => setMinute(parseInt(e.target.value, 10))}
            className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white text-chocolate focus:outline-none focus:border-amber-500"
          >
            {Array.from({ length: 60 }, (_, i) => (
              <option key={i} value={i} className="text-slate-800 font-semibold">
                {String(i).padStart(2, '0')} min
              </option>
            ))}
          </select>
        </div>

        {/* 3. AM / PM Toggle */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Period (AM / PM)
          </label>
          <div className="grid grid-cols-2 bg-white border border-slate-200 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setPeriod('AM')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === 'AM'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-chocolate hover:bg-slate-50'
              }`}
            >
              <Sun className="w-3 h-3" />
              <span>AM</span>
            </button>
            <button
              type="button"
              onClick={() => setPeriod('PM')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === 'PM'
                  ? 'bg-chocolate text-white shadow-xs'
                  : 'text-slate-500 hover:text-chocolate hover:bg-slate-50'
              }`}
            >
              <Moon className="w-3 h-3" />
              <span>PM</span>
            </button>
          </div>
        </div>

      </div>

      {/* Quick Preset Badges */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Quick Select:
        </span>
        <button
          type="button"
          onClick={handleSetEarliest}
          disabled={isTodayClosed}
          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap className="w-3 h-3 text-amber-600" />
          <span>Earliest Available (+45m)</span>
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset(11, 0, 'AM')}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
        >
          11:00 AM
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset(2, 0, 'PM')}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
        >
          02:00 PM
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset(5, 0, 'PM')}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
        >
          05:00 PM
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset(8, 0, 'PM')}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
        >
          08:00 PM
        </button>
      </div>

      {/* Validation Banner / Alert */}
      {isTodayClosed ? (
        <div className="p-3 bg-amber-100/90 border border-amber-300 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Online delivery slots for today are now closed.</strong>
            <p className="text-[11px] text-amber-800 mt-0.5">
              Deliveries operate between 9:00 AM and 10:30 PM with a 45-minute preparation lead time. Please select tomorrow's date to schedule your order.
            </p>
          </div>
        </div>
      ) : !validation.isValid ? (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs animate-shake">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-rose-700">
              {validation.error}
            </span>
            {validation.code === 'PAST_DATE' && (
              <p className="text-[11px] text-rose-600">
                You cannot select a past delivery date. Please choose today or an upcoming date.
              </p>
            )}
            {validation.code === 'INSUFFICIENT_LEAD_TIME' && earliestTimeTodayStr && (
              <p className="text-[11px] text-rose-600">
                Earliest available delivery slot today is <strong className="font-bold underline">{earliestTimeTodayStr}</strong>.
              </p>
            )}
            {validation.code === 'OUTSIDE_OPERATING_HOURS' && (
              <p className="text-[11px] text-rose-600">
                Our master bakers and dispatch team operate strictly between 9:00 AM and 10:30 PM.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Confirmed Delivery Slot: <strong className="font-bold text-emerald-900">{formattedTime}</strong>
            </span>
          </div>
          <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            Valid Slot
          </span>
        </div>
      )}

    </div>
  );
};

export default CustomTimePicker;
