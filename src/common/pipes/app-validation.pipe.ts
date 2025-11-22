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

    // Extract options that we want to control explicitly
    const { transform: _, transformOptions: __, exceptionFactory: ___, ...restOptions } = options || {};

    // Build final options - ensure transform is ALWAYS true
    const finalOptions: ValidationPipeOptions = {
      // Core validation settings from user options or defaults
      whitelist: options?.whitelist ?? true,
      forbidNonWhitelisted: options?.forbidNonWhitelisted ?? false,
      forbidUnknownValues: options?.forbidUnknownValues ?? false,
      skipMissingProperties: options?.skipMissingProperties ?? false,

      // CRITICAL: transform MUST be true for validation to work - never allow it to be false
      transform: true,

      // Transform options - always enable implicit conversion
      transformOptions: {
        enableImplicitConversion: true,
        ...options?.transformOptions,
      },

      // Custom exception factory - always use our custom one
      exceptionFactory: (errors: ValidationError[]) => {
        const formattedErrors = formatErrors(errors);
        // Log validation errors for debugging
        console.log('Validation failed:', formattedErrors);
        return new BadRequestException({
          status: ApiStatus.ERROR,
          message: 'Data Validation Failed',
          errors: formattedErrors,
        });
      },

      // Apply any other user options
      ...restOptions,
    };

    super(finalOptions);
  }
}
