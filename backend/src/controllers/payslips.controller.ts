import { Request, Response } from 'express';
import { payslipsService } from '../services/payslips.service';
import { ok, fail } from '../utils/responder';

export async function listPayslips(_req: Request, res: Response) {
  const data = await payslipsService.list();
  return ok(res, data);
}

export async function downloadPayslip(req: Request, res: Response) {
  const { id } = req.params;
  const result = await payslipsService.download(id);
  if (!result.success || !result.buffer) return fail(res, result.error ?? 'Unable to download', result.status ?? 400);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=payslip-${id}.pdf`);
  return res.status(200).send(result.buffer);
}

export async function approvePayslip(req: Request, res: Response) {
  const { id } = req.params;
  const result = await payslipsService.updateStatus(id, 'approved');
  if (!result.success) return fail(res, result.error, result.status ?? 400);
  return ok(res, { message: 'Payslip approved' });
}

export async function rejectPayslip(req: Request, res: Response) {
  const { id } = req.params;
  const result = await payslipsService.updateStatus(id, 'rejected');
  if (!result.success) return fail(res, result.error, result.status ?? 400);
  return ok(res, { message: 'Payslip rejected' });
}
