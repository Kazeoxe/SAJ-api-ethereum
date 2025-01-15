import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    try {
      const request = ctx.switchToHttp().getRequest();
      return request.user;
    } catch (error) {
      console.error('Error in User decorator:', error);
      return null;
    }
  },
);