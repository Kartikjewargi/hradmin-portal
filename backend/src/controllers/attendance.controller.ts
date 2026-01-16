import { Request, Response } from 'express';
import { attendanceService } from '../services/attendance.service';
import { ok } from '../utils/responder';

export async function getTodayAttendance(_req: Request, res: Response) {
  const data = await attendanceService.getToday();
  return ok(res, data);
}
