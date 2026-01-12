import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard for local (username/password) authentication
 * Used on the login endpoint
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
