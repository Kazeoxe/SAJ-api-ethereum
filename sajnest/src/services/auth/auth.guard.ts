import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  
  constructor(private httpService: HttpService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.error('No token provided in request');
      throw new UnauthorizedException('No token provided');
    }

    try {
      this.logger.debug(`Validating token with Java service for ${request.method} ${request.url}`);
      const response = await firstValueFrom(
        this.httpService.get('http://localhost:8080/api/v1/validate-token', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      );
      interface DecodedToken {
        userId: string;
      }
      const decodedToken = jwtDecode<DecodedToken>(token); 
      const userId = decodedToken.userId;
      console.log('Decoded token:', decodedToken);
      this.logger.debug('Token validation response:', response.data);

      request.user = { ...response.data, userId };
      
      return true;
    } catch (error: any) {
      this.logger.error('Token validation failed:', error.response?.data || error.message);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    console.log('Type:', request.headers.authorization);
;
    return type === 'Bearer' ? token : undefined;
  }
}
// export class AuthGuard implements CanActivate {
//   private readonly logger = new Logger(AuthGuard.name);

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const request = context.switchToHttp().getRequest();
//     //this.logger.debug('Mock auth guard activated');
    
//     // Simulate authenticated user
//     request.user = {
//       userId: "1",  // Test ID
//       username: "size4567@gmail.com"
//     };

//     //this.logger.debug('Added mock user to request:', request.user);
//     return true;
//   }
// }