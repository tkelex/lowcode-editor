import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RevalidateResult {
  attempted: boolean;
  ok: boolean;
  status?: number;
  message?: string;
}

@Injectable()
export class PublishedPageRevalidateService {
  private readonly logger = new Logger(PublishedPageRevalidateService.name);

  constructor(private readonly configService: ConfigService) {}

  async revalidate(publicId: string | null | undefined): Promise<RevalidateResult> {
    const endpoint = this.readEndpoint();
    const secret = this.configService.get<string>('PUBLISHER_REVALIDATE_SECRET')?.trim();

    if (!publicId || !endpoint || !secret) {
      return {
        attempted: false,
        ok: false,
        message: 'Publisher revalidate endpoint or secret is not configured',
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.readTimeoutMs());

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-revalidate-secret': secret,
        },
        body: JSON.stringify({ publicId }),
        signal: controller.signal,
      });

      if (!response.ok) {
        this.logger.warn(`Published page revalidate failed: publicId=${publicId}, status=${response.status}`);
      }

      return {
        attempted: true,
        ok: response.ok,
        status: response.status,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown revalidate error';
      this.logger.warn(`Published page revalidate error: publicId=${publicId}, message=${message}`);

      return {
        attempted: true,
        ok: false,
        message,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private readEndpoint() {
    const explicit = this.configService.get<string>('PUBLISHER_REVALIDATE_URL')?.trim();
    if (explicit) {
      return explicit;
    }

    const siteUrl = this.configService.get<string>('PUBLISHER_SITE_URL')?.trim().replace(/\/+$/, '');
    return siteUrl ? `${siteUrl}/api/revalidate/published-page` : '';
  }

  private readTimeoutMs() {
    const value = Number(this.configService.get<string>('PUBLISHER_REVALIDATE_TIMEOUT_MS'));
    return Number.isInteger(value) && value > 0 ? value : 3000;
  }
}
