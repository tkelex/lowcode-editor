import { IsInt, Min } from 'class-validator';

export class RollbackPageDto {
  @IsInt()
  @Min(1)
  versionId!: number;
}
