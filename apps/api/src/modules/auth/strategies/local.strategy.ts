import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import type { AuthenticatedUser } from '@trafi/types';

/**
 * Local Passport strategy for email/password authentication
 *
 * Used on the login endpoint to validate credentials
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  /**
   * Validate user credentials
   * This is called automatically by Passport LocalAuthGuard
   *
   * NOTE: This strategy is kept for potential future use cases (e.g., different auth flows).
   * The main login endpoint currently uses direct Zod validation + AuthService.login()
   * to avoid double execution and keep the flow simpler.
   */
  async validate(email: string, password: string): Promise<AuthenticatedUser> {
    // This calls the full login flow including token generation
    // Use with caution - if used with LocalAuthGuard on an endpoint that also
    // calls authService.login(), tokens will be generated twice.
    const response = await this.authService.login(email, password);

    if (!response) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return response.user;
  }
}
