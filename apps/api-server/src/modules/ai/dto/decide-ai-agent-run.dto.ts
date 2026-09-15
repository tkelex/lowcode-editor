import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ConfirmAiAgentRunDto {
  @IsString()
  @MaxLength(128)
  candidateId!: string;
}

export class RejectAiAgentRunDto extends ConfirmAiAgentRunDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
