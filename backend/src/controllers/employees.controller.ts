import { Request, Response } from 'express';
import { employeesService } from '../services/employees.service';
import { ok, fail } from '../utils/responder';

export async function listEmployees(_req: Request, res: Response) {
  const data = await employeesService.list();
  return ok(res, data);
}

export async function createEmployee(req: Request, res: Response) {
  const payload = req.body;
  const validationError = employeesService.validateCreate(payload);
  if (validationError) return fail(res, validationError, 400);
  const created = await employeesService.create(payload);
  return ok(res, created, 201);
}

export async function deactivateEmployee(req: Request, res: Response) {
  const { id } = req.params;
  const result = await employeesService.deactivate(id);
  if (!result.success) return fail(res, result.error, result.status ?? 400);
  return ok(res, { message: 'Employee deactivated' });
}
