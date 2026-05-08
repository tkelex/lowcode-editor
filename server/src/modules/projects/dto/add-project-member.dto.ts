import { IsEmail, IsIn, IsInt, IsOptional } from 'class-validator';

export const MUTABLE_PROJECT_MEMBER_ROLES = ['editor', 'viewer'] as const;
export type MutableProjectMemberRole = (typeof MUTABLE_PROJECT_MEMBER_ROLES)[number];

export class AddProjectMemberDto {
  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsIn(MUTABLE_PROJECT_MEMBER_ROLES)
  role!: MutableProjectMemberRole;
}
