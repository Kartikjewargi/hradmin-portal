import { employeesAdapter } from '../adapters/employees.adapter';

function validateCreate(payload: any): string | null {
  if (!payload?.name) return 'name is required';
  if (!payload?.email) return 'email is required';
  return null;
}

async function list() {
  return employeesAdapter.list();
}

async function create(payload: any) {
  return employeesAdapter.create(payload);
}

async function deactivate(id: string) {
  if (!id) return { success: false as const, error: 'id is required' };
  return employeesAdapter.deactivate(id);
}

export const employeesService = {
  list,
  create,
  deactivate,
  validateCreate,
};
