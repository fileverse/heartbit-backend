import { ConfigService } from '@nestjs/config';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  private apiKey: string;
  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('auth.apiKey');
  }

  async isValidRequest(apiKey) {
    if (apiKey !== this.apiKey) {
      throw new UnauthorizedException();
    }
    return apiKey === this.apiKey;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKeyFromHeader(request);
    if (!apiKey) {
      throw new UnauthorizedException();
    }
    try {
      await this.isValidRequest(apiKey);
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractApiKeyFromHeader(request: Request): string | undefined {
    const [key] = request.headers['x-api-key'];
    return key;
  }
}
