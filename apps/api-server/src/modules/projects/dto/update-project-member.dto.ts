import { IsIn } from 'class-validator';
import { MUTABLE_PROJECT_MEMBER_ROLES, MutableProjectMemberRole } from './add-project-member.dto';

export class UpdateProjectMemberDto {
  @IsIn(MUTABLE_PROJECT_MEMBER_ROLES)
  role!: MutableProjectMemberRole;
}
