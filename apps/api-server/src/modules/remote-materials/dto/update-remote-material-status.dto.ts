import { IsIn } from 'class-validator';

export class UpdateRemoteMaterialStatusDto {
  @IsIn(['enabled', 'disabled'])
  status!: 'enabled' | 'disabled';
}
