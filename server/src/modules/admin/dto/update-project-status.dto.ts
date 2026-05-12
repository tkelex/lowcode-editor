import { IsIn } from 'class-validator';

export const ADMIN_PROJECT_STATUS_VALUES = ['active', 'disabled'] as const;
export type AdminProjectStatus = (typeof ADMIN_PROJECT_STATUS_VALUES)[number];

export class UpdateProjectStatusDto {
  @IsIn(ADMIN_PROJECT_STATUS_VALUES)
  status!: AdminProjectStatus;
}
