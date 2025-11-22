import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../response/api.response';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data: any) => {
        // If response is already an ApiResponse instance, return it directly
        if (data instanceof ApiResponse) {
          return data;
        }

        // Wrap in ApiResponse for standard responses
        return ApiResponse.success(undefined, data);
      }),
    );
  }
}
