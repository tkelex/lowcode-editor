import { IsIn } from 'class-validator';

export const ADMIN_USER_STATUS_VALUES = ['active', 'disabled'] as const;
export type AdminUserStatus = (typeof ADMIN_USER_STATUS_VALUES)[number];

export class UpdateUserStatusDto {
  @IsIn(ADMIN_USER_STATUS_VALUES)
  status!: AdminUserStatus;
}
