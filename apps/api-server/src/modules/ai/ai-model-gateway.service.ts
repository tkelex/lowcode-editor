import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessException } from '../../common/errors/business.exception';
import { AppErrorCode } from '../../common/errors/error-codes';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ModelJsonRequest {
  systemPrompt: string;
  userPrompt: string;
  repairPrompt?: string;
}

@Injectable()
export class AiModelGatewayService {
  constructor(private readonly configService: ConfigService) {}

  isConfigured() {
    return Boolean(this.configService.get<string>('AI_PROVIDER_API_KEY'));
  }

  getModelName() {
    return this.configService.get<string>('AI_PROVIDER_MODEL') || 'gpt-4.1-mini';
  }

  async requestJson(input: ModelJsonRequest) {
    if (!this.isConfigured()) {
      throw new BusinessException(
        AppErrorCode.AI_CONFIG_MISSING,
        'AI provider is not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: input.systemPrompt },
      { role: 'user', content: input.userPrompt },
    ];
    if (input.repairPrompt) {
      messages.push({ role: 'user', content: input.repairPrompt });
    }

    const baseUrl = this.configService.get<string>('AI_PROVIDER_BASE_URL') || 'https://api.openai.com/v1';
    const timeoutMs = Number(this.configService.get<string>('AI_PROVIDER_TIMEOUT_MS') || 30000);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          authorization: `Bearer ${this.configService.get<string>('AI_PROVIDER_API_KEY')}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: this.getModelName(),
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages,
        }),
      });

      const data = await response.json().catch(() => null) as any;
      if (!response.ok) {
        throw new BusinessException(
          AppErrorCode.AI_MODEL_REQUEST_FAILED,
          data?.error?.message || `AI model request failed with status ${response.status}`,
          HttpStatus.BAD_GATEWAY,
          { status: response.status },
        );
      }

      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string' || !content.trim()) {
        throw new BusinessException(
          AppErrorCode.AI_MODEL_REQUEST_FAILED,
          'AI model returned empty content',
          HttpStatus.BAD_GATEWAY,
        );
      }

      return JSON.parse(content) as unknown;
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }

      throw new BusinessException(
        AppErrorCode.AI_MODEL_REQUEST_FAILED,
        error instanceof Error ? error.message : 'AI model request failed',
        HttpStatus.BAD_GATEWAY,
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
