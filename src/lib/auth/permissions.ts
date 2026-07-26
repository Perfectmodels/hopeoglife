import type { EmployeeRole } from "@/lib/auth/session";

export function canManageStock(role: EmployeeRole): boolean {
  return role === "admin" || role === "manager" || role === "stock" || role === "caissier";
}

export function canAdministerStock(role: EmployeeRole): boolean {
  return role === "admin" || role === "manager" || role === "stock";
}
