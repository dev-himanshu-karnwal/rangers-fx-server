import { Injectable, ValidationPipe, type ValidationPipeOptions } from '@nestjs/common';

/**
 * Validation pipe specifically for query parameters.
 * Allows additional properties for dynamic filtering while still validating
 * the defined properties in the DTO.
 */
@Injectable()
export class QueryValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    const finalOptions: ValidationPipeOptions = {
      whitelist: true,
      forbidNonWhitelisted: false, // Allow additional properties for dynamic filters
      forbidUnknownValues: false,
      skipMissingProperties: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      ...options,
    };

    super(finalOptions);
  }
}
