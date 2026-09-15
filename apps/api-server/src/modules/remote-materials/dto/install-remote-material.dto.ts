import { IsObject, IsString, MaxLength } from 'class-validator';

export class InstallRemoteMaterialDto {
  @IsString()
  @MaxLength(2048)
  manifestUrl!: string;

  @IsObject()
  manifest!: Record<string, unknown>;
}
