import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Common decorator combinations for reusable DTO fields
 */

/**
 * Email field decorator (required)
 */
export function EmailField() {
  return function (target: any, propertyKey: string) {
    IsNotEmpty()(target, propertyKey);
    IsEmail()(target, propertyKey);
  };
}

/**
 * Email field decorator (optional)
 */
export function OptionalEmailField() {
  return function (target: any, propertyKey: string) {
    IsOptional()(target, propertyKey);
    IsEmail()(target, propertyKey);
  };
}

/**
 * Password field decorator (required)
 */
export function PasswordField(minLength: number = 8, customMessage?: string) {
  return function (target: any, propertyKey: string) {
    IsNotEmpty()(target, propertyKey);
    IsString()(target, propertyKey);
    MinLength(minLength, {
      message: customMessage || `Password must be at least ${minLength} characters long`,
    })(target, propertyKey);
  };
}

/**
 * String field decorator (required)
 */
export function StringField(minLength?: number, maxLength?: number) {
  return function (target: any, propertyKey: string) {
    IsNotEmpty()(target, propertyKey);
    IsString()(target, propertyKey);
    if (minLength) {
      MinLength(minLength)(target, propertyKey);
    }
    if (maxLength) {
      MaxLength(maxLength)(target, propertyKey);
    }
  };
}

/**
 * String field decorator (optional)
 */
export function OptionalStringField(minLength?: number, maxLength?: number) {
  return function (target: any, propertyKey: string) {
    IsOptional()(target, propertyKey);
    IsString()(target, propertyKey);
    if (minLength) {
      MinLength(minLength)(target, propertyKey);
    }
    if (maxLength) {
      MaxLength(maxLength)(target, propertyKey);
    }
  };
}

/**
 * User ID field decorator (required, integer, min 1)
 */
export function UserIdField() {
  return function (target: any, propertyKey: string) {
    IsNotEmpty()(target, propertyKey);
    Type(() => Number)(target, propertyKey);
    IsInt()(target, propertyKey);
    Min(1)(target, propertyKey);
  };
}

/**
 * Number field decorator (required)
 */
export function NumberField(min?: number, max?: number) {
  return function (target: any, propertyKey: string) {
    IsNotEmpty()(target, propertyKey);
    Type(() => Number)(target, propertyKey);
    IsNumber()(target, propertyKey);
    if (min !== undefined) {
      Min(min)(target, propertyKey);
    }
    if (max !== undefined) {
      Max(max)(target, propertyKey);
    }
  };
}

/**
 * Enum field decorator (required)
 */
export function EnumField(enumClass: any) {
  return function (target: any, propertyKey: string) {
    IsNotEmpty()(target, propertyKey);
    IsEnum(enumClass)(target, propertyKey);
  };
}

/**
 * Enum field decorator (optional)
 */
export function OptionalEnumField(enumClass: any) {
  return function (target: any, propertyKey: string) {
    IsOptional()(target, propertyKey);
    IsEnum(enumClass)(target, propertyKey);
  };
}

/**
 * OTP field decorator (required)
 */
export function OtpField() {
  return function (target: any, propertyKey: string) {
    IsNotEmpty()(target, propertyKey);
    IsString()(target, propertyKey);
  };
}

/**
 * Token field decorator (required)
 */
export function TokenField() {
  return function (target: any, propertyKey: string) {
    IsNotEmpty()(target, propertyKey);
    IsString()(target, propertyKey);
  };
}
