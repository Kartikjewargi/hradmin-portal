import { attendanceAdapter } from '../adapters/attendance.adapter';

async function getToday() {
  // Normalize into buckets: present / absent / late / not_punched
  return attendanceAdapter.getToday();
}

export const attendanceService = {
  getToday,
};
