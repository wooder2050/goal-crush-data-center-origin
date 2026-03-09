import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuthUser {
  userId: string;
  koreanNickname: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
  isAdmin: boolean;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('인증이 필요합니다');
    }

    const supabase = createClient(
      this.config.get('NEXT_PUBLIC_SUPABASE_URL', ''),
      this.config.get('NEXT_PUBLIC_SUPABASE_ANON_KEY', ''),
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('유효하지 않은 인증 토큰입니다');
    }

    let dbUser = await this.prisma.user.findUnique({
      where: { user_id: user.id },
      select: {
        user_id: true,
        korean_nickname: true,
        display_name: true,
        profile_image_url: true,
        is_admin: true,
      },
    });

    if (!dbUser) {
      dbUser = await this.prisma.user.create({
        data: {
          user_id: user.id,
          korean_nickname:
            user.user_metadata?.korean_nickname || user.email?.split('@')[0] || 'User',
          display_name: user.user_metadata?.display_name,
          profile_image_url: user.user_metadata?.avatar_url,
        },
        select: {
          user_id: true,
          korean_nickname: true,
          display_name: true,
          profile_image_url: true,
          is_admin: true,
        },
      });
    }

    request.user = {
      userId: dbUser.user_id,
      koreanNickname: dbUser.korean_nickname,
      displayName: dbUser.display_name,
      profileImageUrl: dbUser.profile_image_url,
      isAdmin: dbUser.is_admin || false,
    } as AuthUser;

    return true;
  }

  private extractToken(request: { headers: Record<string, string> }): string | null {
    const auth = request.headers['authorization'];
    if (!auth) return null;
    const match = auth.match(/^bearer\s+(.+)$/i);
    return match ? match[1] : null;
  }
}

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      request.user = null;
      return true;
    }

    try {
      const supabase = createClient(
        this.config.get('NEXT_PUBLIC_SUPABASE_URL', ''),
        this.config.get('NEXT_PUBLIC_SUPABASE_ANON_KEY', ''),
      );

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        request.user = null;
        return true;
      }

      let dbUser = await this.prisma.user.findUnique({
        where: { user_id: user.id },
        select: {
          user_id: true,
          korean_nickname: true,
          display_name: true,
          profile_image_url: true,
          is_admin: true,
        },
      });

      if (!dbUser) {
        dbUser = await this.prisma.user.create({
          data: {
            user_id: user.id,
            korean_nickname:
              user.user_metadata?.korean_nickname || user.email?.split('@')[0] || 'User',
            display_name: user.user_metadata?.display_name,
            profile_image_url: user.user_metadata?.avatar_url,
          },
          select: {
            user_id: true,
            korean_nickname: true,
            display_name: true,
            profile_image_url: true,
            is_admin: true,
          },
        });
      }

      request.user = {
        userId: dbUser.user_id,
        koreanNickname: dbUser.korean_nickname,
        displayName: dbUser.display_name,
        profileImageUrl: dbUser.profile_image_url,
        isAdmin: dbUser.is_admin || false,
      } as AuthUser;
    } catch {
      request.user = null;
    }

    return true;
  }

  private extractToken(request: { headers: Record<string, string> }): string | null {
    const auth = request.headers['authorization'];
    if (!auth) return null;
    const match = auth.match(/^bearer\s+(.+)$/i);
    return match ? match[1] : null;
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('인증이 필요합니다');
    }

    const supabase = createClient(
      this.config.get('NEXT_PUBLIC_SUPABASE_URL', ''),
      this.config.get('NEXT_PUBLIC_SUPABASE_ANON_KEY', ''),
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('유효하지 않은 인증 토큰입니다');
    }

    // 개발 환경에서는 모든 로그인 사용자를 관리자로 처리
    if (this.config.get('NODE_ENV', 'development') === 'development') {
      request.user = {
        userId: user.id,
        koreanNickname: null,
        displayName: null,
        profileImageUrl: null,
        isAdmin: true,
      } as AuthUser;
      return true;
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { user_id: user.id },
      select: {
        user_id: true,
        korean_nickname: true,
        display_name: true,
        profile_image_url: true,
        is_admin: true,
      },
    });

    if (!dbUser?.is_admin) {
      throw new UnauthorizedException('관리자 권한이 필요합니다');
    }

    request.user = {
      userId: dbUser.user_id,
      koreanNickname: dbUser.korean_nickname,
      displayName: dbUser.display_name,
      profileImageUrl: dbUser.profile_image_url,
      isAdmin: true,
    } as AuthUser;

    return true;
  }

  private extractToken(request: { headers: Record<string, string> }): string | null {
    const auth = request.headers['authorization'];
    if (!auth) return null;
    const match = auth.match(/^bearer\s+(.+)$/i);
    return match ? match[1] : null;
  }
}
