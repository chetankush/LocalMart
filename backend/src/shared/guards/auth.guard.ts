import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.substring(7);

    try {
      // Try both NEXT_PUBLIC_ and non-prefixed versions for compatibility
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase credentials not configured');
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const {
        data: { user: supabaseUser },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !supabaseUser) {
        throw new UnauthorizedException('Invalid token');
      }

      // Get user from database
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [{ email: supabaseUser.email }, { phone: supabaseUser.phone }],
        },
        include: {
          vendor: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Attach user to request
      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }
}

