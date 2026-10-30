'use client';

import { useEffect } from 'react';
import {
  CLOCK_IT_CHANGED_EVENT,
  CLOCK_IT_KEYS,
  getClockItDefinition,
} from '../../lib/dropdowns/clockItRegistry';

function sendScheduleToNativeStaff() {
  const reminderTimes = getClockItDefinition(CLOCK_IT_KEYS.staffReminderTimes)?.values || [];
  const summationTimes = getClockItDefinition(CLOCK_IT_KEYS.summationReminderTime)?.values || [];
  window.ChaoticaNativeReminders?.update({
    reminderTimes,
    summationTime: summationTimes[0] || '00:01',
  });
}

export default function NativeReminderBridge() {
  useEffect(() => {
    sendScheduleToNativeStaff();
    window.addEventListener(CLOCK_IT_CHANGED_EVENT, sendScheduleToNativeStaff);
    window.addEventListener('truthinstyle-cloud-state-hydrated', sendScheduleToNativeStaff);
    window.addEventListener('storage', sendScheduleToNativeStaff);
    return () => {
      window.removeEventListener(CLOCK_IT_CHANGED_EVENT, sendScheduleToNativeStaff);
      window.removeEventListener('truthinstyle-cloud-state-hydrated', sendScheduleToNativeStaff);
      window.removeEventListener('storage', sendScheduleToNativeStaff);
    };
  }, []);
  return null;
}
