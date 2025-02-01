import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ROLES_KEY } from 'src/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.get<string[]>(ROLES_KEY, context.getHandler()) ||
      this.reflector.get<string[]>(ROLES_KEY, context.getClass());
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return false;
    }

    const token = authHeader.split(' ')[1];
    const user = this.jwtService.decode(token) as { role: string };

    if (!user || !user.role) {
      return false;
    }

    return requiredRoles ? requiredRoles.includes(user.role) : true;
  }
}
