import { userRoleEnum } from "@/lib/db/schema";

export type SheetRole = (typeof userRoleEnum.enumValues)[number];

export type SheetPermission =
  | "canViewTransactions"
  | "canAddTransaction"
  | "canEditTransaction"
  | "canDeleteTransaction"
  | "canViewSheetSettings"
  | "canEditSheetSettings"
  | "canAddCategory"
  | "canEditCategory"
  | "canDeleteCategory"
  | "canAddPaymentType"
  | "canEditPaymentType"
  | "canDeletePaymentType"
  | "canAddRecurringTransaction"
  | "canEditRecurringTransaction"
  | "canDeleteRecurringTransaction"
  | "canManageUsers"
  | "canDeleteSheet";

export type SheetPermissions = Record<SheetPermission, boolean>;

const VIEWER_PERMISSIONS: SheetPermissions = {
  canViewTransactions: true,
  canAddTransaction: false,
  canEditTransaction: false,
  canDeleteTransaction: false,
  canViewSheetSettings: true,
  canEditSheetSettings: false,
  canAddCategory: false,
  canEditCategory: false,
  canDeleteCategory: false,
  canAddPaymentType: false,
  canEditPaymentType: false,
  canDeletePaymentType: false,
  canAddRecurringTransaction: false,
  canEditRecurringTransaction: false,
  canDeleteRecurringTransaction: false,
  canManageUsers: false,
  canDeleteSheet: false,
};

const EDITOR_PERMISSIONS: SheetPermissions = {
  canViewTransactions: true,
  canAddTransaction: true,
  canEditTransaction: true,
  canDeleteTransaction: true,
  canViewSheetSettings: true,
  canEditSheetSettings: true,
  canAddCategory: true,
  canEditCategory: true,
  canDeleteCategory: true,
  canAddPaymentType: true,
  canEditPaymentType: true,
  canDeletePaymentType: true,
  canAddRecurringTransaction: true,
  canEditRecurringTransaction: true,
  canDeleteRecurringTransaction: true,
  canManageUsers: false,
  canDeleteSheet: false,
};

const ADMIN_PERMISSIONS: SheetPermissions = {
  canViewTransactions: true,
  canAddTransaction: true,
  canEditTransaction: true,
  canDeleteTransaction: true,
  canViewSheetSettings: true,
  canEditSheetSettings: true,
  canAddCategory: true,
  canEditCategory: true,
  canDeleteCategory: true,
  canAddPaymentType: true,
  canEditPaymentType: true,
  canDeletePaymentType: true,
  canAddRecurringTransaction: true,
  canEditRecurringTransaction: true,
  canDeleteRecurringTransaction: true,
  canManageUsers: true,
  canDeleteSheet: true,
};

const NO_ACCESS_PERMISSIONS: SheetPermissions = {
  canViewTransactions: false,
  canAddTransaction: false,
  canEditTransaction: false,
  canDeleteTransaction: false,
  canViewSheetSettings: false,
  canEditSheetSettings: false,
  canAddCategory: false,
  canEditCategory: false,
  canDeleteCategory: false,
  canAddPaymentType: false,
  canEditPaymentType: false,
  canDeletePaymentType: false,
  canAddRecurringTransaction: false,
  canEditRecurringTransaction: false,
  canDeleteRecurringTransaction: false,
  canManageUsers: false,
  canDeleteSheet: false,
};

export const SHEET_ROLE_PERMISSIONS: Record<SheetRole, SheetPermissions> = {
  viewer: VIEWER_PERMISSIONS,
  editor: EDITOR_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
};

export function getSheetPermissions(role: SheetRole | null | undefined) {
  if (!role) {
    return NO_ACCESS_PERMISSIONS;
  }
  return SHEET_ROLE_PERMISSIONS[role];
}

export function hasSheetPermission(
  role: SheetRole | null | undefined,
  permission: SheetPermission,
) {
  return getSheetPermissions(role)[permission];
}
