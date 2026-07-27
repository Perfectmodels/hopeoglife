import type { EmployeeRole } from "@/lib/auth/session";

export function canManageStock(role: EmployeeRole): boolean {
  return role === "admin" || role === "manager" || role === "stock" || role === "caissier";
}

export function canAdministerStock(role: EmployeeRole): boolean {
  return role === "admin" || role === "manager" || role === "stock";
}

export function canOperatePos(role: EmployeeRole): boolean {
  return role === "admin" || role === "manager" || role === "serveur" || role === "caissier";
}

export function canTransferOrders(role: EmployeeRole): boolean {
  return role === "admin" || role === "manager" || role === "serveur";
}

export function canHandlePayments(role: EmployeeRole): boolean {
  return role === "admin" || role === "manager" || role === "caissier";
}

export function canManageReservations(role: EmployeeRole): boolean {
  return role === "admin" || role === "manager" || role === "serveur";
}

export function canOperateCash(role: EmployeeRole): boolean {
  return role === "admin" || role === "manager" || role === "caissier";
}
