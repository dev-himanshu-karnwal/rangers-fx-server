import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsEnum,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FieldType } from './field-types.enum';
import { FieldDefinition } from './field-definition.interface';

/**
 * DTO Builder for creating reusable DTOs with validation
 * Follows Builder Pattern for fluent API
 *
 * @example
 * const LoginDto = createDTO('LoginDto')
 *   .email()
 *   .password()
 *   .build();
 */
export class DTOBuilder {
  private fields: FieldDefinition[] = [];
  private className: string;

  constructor(className: string) {
    this.className = className;
  }

  /**
   * Add an email field
   */
  email(name: string = 'email', required: boolean = true, description?: string): this {
    this.fields.push({
      name,
      type: FieldType.EMAIL,
      required,
      description,
    });
    return this;
  }

  /**
   * Add a password field
   */
  password(name: string = 'password', required: boolean = true, minLength: number = 8, description?: string): this {
    this.fields.push({
      name,
      type: FieldType.PASSWORD,
      required,
      validation: { minLength },
      description,
    });
    return this;
  }

  /**
   * Add a string field
   */
  string(
    name: string,
    required: boolean = true,
    options?: { minLength?: number; maxLength?: number; description?: string },
  ): this {
    this.fields.push({
      name,
      type: FieldType.STRING,
      required,
      validation: {
        minLength: options?.minLength,
        maxLength: options?.maxLength,
      },
      description: options?.description,
    });
    return this;
  }

  /**
   * Add a number field
   */
  number(name: string, required: boolean = true, options?: { min?: number; max?: number; description?: string }): this {
    this.fields.push({
      name,
      type: FieldType.NUMBER,
      required,
      validation: {
        min: options?.min,
        max: options?.max,
      },
      description: options?.description,
    });
    return this;
  }

  /**
   * Add a user ID field (integer with min 1)
   */
  userId(name: string = 'userId', required: boolean = true, description?: string): this {
    this.fields.push({
      name,
      type: FieldType.USER_ID,
      required,
      description,
    });
    return this;
  }

  /**
   * Add an enum field
   */
  enum(name: string, enumClass: any, required: boolean = true, description?: string): this {
    this.fields.push({
      name,
      type: FieldType.ENUM,
      required,
      validation: { enumClass },
      description,
    });
    return this;
  }

  /**
   * Add an OTP field
   */
  otp(name: string = 'otp', required: boolean = true, description?: string): this {
    this.fields.push({
      name,
      type: FieldType.OTP,
      required,
      description,
    });
    return this;
  }

  /**
   * Add a token field
   */
  token(name: string = 'token', required: boolean = true, description?: string): this {
    this.fields.push({
      name,
      type: FieldType.TOKEN,
      required,
      description,
    });
    return this;
  }

  /**
   * Add a custom field with full control
   */
  field(fieldDefinition: FieldDefinition): this {
    this.fields.push(fieldDefinition);
    return this;
  }

  /**
   * Build the DTO class with proper decorators
   * This creates a real class that can be used with NestJS validation
   */
  build(): any {
    // Store fields reference before creating class
    const fields = this.fields;

    // Create a class dynamically with properties defined
    const DTOClass = class {
      constructor() {
        // Initialize properties
        fields.forEach((field) => {
          (this as any)[field.name] = undefined;
        });
      }
    };

    // Set class name
    Object.defineProperty(DTOClass, 'name', { value: this.className });

    // Apply decorators to each field
    this.fields.forEach((field) => {
      const propertyKey = field.name;

      // Define property on prototype for TypeScript type inference
      Object.defineProperty(DTOClass.prototype, propertyKey, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: undefined,
      });

      // Apply decorators based on field type
      switch (field.type) {
        case FieldType.EMAIL:
          if (field.required) {
            IsNotEmpty()(DTOClass.prototype, propertyKey);
          } else {
            IsOptional()(DTOClass.prototype, propertyKey);
          }
          IsEmail()(DTOClass.prototype, propertyKey);
          break;

        case FieldType.PASSWORD:
          if (field.required) {
            IsNotEmpty()(DTOClass.prototype, propertyKey);
          } else {
            IsOptional()(DTOClass.prototype, propertyKey);
          }
          IsString()(DTOClass.prototype, propertyKey);
          if (field.validation?.minLength) {
            MinLength(field.validation.minLength, {
              message:
                field.validation.customMessage ||
                `Password must be at least ${field.validation.minLength} characters long`,
            })(DTOClass.prototype, propertyKey);
          }
          break;

        case FieldType.STRING:
          if (field.required) {
            IsNotEmpty()(DTOClass.prototype, propertyKey);
          } else {
            IsOptional()(DTOClass.prototype, propertyKey);
          }
          IsString()(DTOClass.prototype, propertyKey);
          if (field.validation?.minLength) {
            MinLength(field.validation.minLength)(DTOClass.prototype, propertyKey);
          }
          if (field.validation?.maxLength) {
            MaxLength(field.validation.maxLength)(DTOClass.prototype, propertyKey);
          }
          break;

        case FieldType.NUMBER:
          if (field.required) {
            IsNotEmpty()(DTOClass.prototype, propertyKey);
          } else {
            IsOptional()(DTOClass.prototype, propertyKey);
          }
          Type(() => Number)(DTOClass.prototype, propertyKey);
          IsNumber()(DTOClass.prototype, propertyKey);
          if (field.validation?.min !== undefined) {
            Min(field.validation.min)(DTOClass.prototype, propertyKey);
          }
          if (field.validation?.max !== undefined) {
            Max(field.validation.max)(DTOClass.prototype, propertyKey);
          }
          break;

        case FieldType.INTEGER:
        case FieldType.USER_ID:
          if (field.required) {
            IsNotEmpty()(DTOClass.prototype, propertyKey);
          } else {
            IsOptional()(DTOClass.prototype, propertyKey);
          }
          Type(() => Number)(DTOClass.prototype, propertyKey);
          IsInt()(DTOClass.prototype, propertyKey);
          Min(1)(DTOClass.prototype, propertyKey);
          break;

        case FieldType.ENUM:
          if (field.required) {
            IsNotEmpty()(DTOClass.prototype, propertyKey);
          } else {
            IsOptional()(DTOClass.prototype, propertyKey);
          }
          if (field.validation?.enumClass) {
            IsEnum(field.validation.enumClass)(DTOClass.prototype, propertyKey);
          }
          break;

        case FieldType.OTP:
        case FieldType.TOKEN:
          if (field.required) {
            IsNotEmpty()(DTOClass.prototype, propertyKey);
          } else {
            IsOptional()(DTOClass.prototype, propertyKey);
          }
          IsString()(DTOClass.prototype, propertyKey);
          break;

        case FieldType.BOOLEAN:
          if (field.required) {
            IsNotEmpty()(DTOClass.prototype, propertyKey);
          } else {
            IsOptional()(DTOClass.prototype, propertyKey);
          }
          IsBoolean()(DTOClass.prototype, propertyKey);
          break;
      }
    });

    // Add fields metadata for debugging/documentation
    (DTOClass as any).__fields = this.fields;

    return DTOClass;
  }
}

/**
 * Helper function to create a new DTO builder
 *
 * @example
 * export const LoginDto = createDTO('LoginDto')
 *   .email()
 *   .password()
 *   .build();
 */
export function createDTO(className: string): DTOBuilder {
  return new DTOBuilder(className);
}
