import { BadRequestException, Injectable, ValidationPipe, type ValidationPipeOptions } from '@nestjs/common';
import { type ValidationError } from 'class-validator';
import { ApiStatus } from '../enums/api-status.enum';

@Injectable()
export class AppValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    const formatErrors = (errors: ValidationError[]): string[] => {
      const result: string[] = [];

      errors.forEach((err) => {
        const constraints = err.constraints;

        // Add direct constraint messages
        if (constraints) {
          Object.values(constraints).forEach((message) => {
            result.push(message);
          });
        }

        // Handle nested validation errors
        if (err.children && err.children.length) {
          const nestedErrors = formatErrors(err.children);
          result.push(...nestedErrors);
        }
      });

      return result;
    };

    const { transform: _, transformOptions: __, ...restOptions } = options || {};

    super({
      whitelist: true,
      forbidNonWhitelisted: false,
      forbidUnknownValues: false,
      transform: options?.transform !== undefined ? options.transform : true,
      transformOptions: {
        enableImplicitConversion: true,
        ...options?.transformOptions,
      },
      exceptionFactory: (errors: ValidationError[]) => {
        const formattedErrors = formatErrors(errors);
        return new BadRequestException({
          status: ApiStatus.ERROR,
          message: 'Data Validation Failed',
          errors: formattedErrors,
        });
      },
      ...restOptions,
    });
  }
}
