# DTO Builder Pattern

This module provides reusable DTO building utilities to reduce code duplication and ensure consistent validation across the application.

## Two Approaches

### 1. Decorator Helpers (Recommended)

Use pre-built decorator functions for common field types. This is the simplest and most type-safe approach.

#### Example

```typescript
import { EmailField, PasswordField, StringField, OptionalStringField } from '../../../common/dto';

export class LoginDto {
  @EmailField()
  email: string;

  @PasswordField() // Default minLength: 8
  password: string;
}

export class SignupInitiateDto {
  @StringField(2) // minLength: 2
  fullName: string;

  @EmailField()
  email: string;

  @OptionalStringField()
  referralCode?: string;
}
```

#### Available Decorators

**Required Fields:**

- `@EmailField()` - Email validation
- `@PasswordField(minLength?: number, customMessage?: string)` - Password with min length (default: 8)
- `@StringField(minLength?: number, maxLength?: number)` - String with optional length constraints
- `@UserIdField()` - Integer user ID (min: 1)
- `@NumberField(min?: number, max?: number)` - Number with optional range
- `@EnumField(enumClass)` - Enum validation
- `@OtpField()` - OTP string
- `@TokenField()` - Token string

**Optional Fields:**

- `@OptionalEmailField()` - Optional email
- `@OptionalStringField(minLength?: number, maxLength?: number)` - Optional string
- `@OptionalEnumField(enumClass)` - Optional enum

### 2. Builder Pattern (Advanced)

For more complex scenarios or programmatic DTO generation, use the builder pattern.

#### Example

```typescript
import { createDTO } from '../../../common/dto';

export const LoginDto = createDTO('LoginDto').email().password().build();

export const SignupInitiateDto = createDTO('SignupInitiateDto')
  .string('fullName', true, { minLength: 2 })
  .email()
  .string('referralCode', false)
  .build();
```

## Benefits

1. **DRY Principle**: No repeated validation decorators
2. **Consistency**: Same validation rules across all DTOs
3. **Maintainability**: Update validation in one place
4. **Type Safety**: Full TypeScript support
5. **Readability**: Cleaner, more semantic code

## Migration Guide

### Before

```typescript
export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}
```

### After

```typescript
import { EmailField, PasswordField } from '../../../common/dto';

export class LoginDto {
  @EmailField()
  email: string;

  @PasswordField()
  password: string;
}
```

## Adding New Field Types

To add a new reusable field type:

1. Add the field type to `field-types.enum.ts`
2. Create a decorator function in `decorators.ts`
3. Update the builder in `dto-builder.ts` if using builder pattern
4. Export from `index.ts`

Example:

```typescript
// decorators.ts
export function PhoneField() {
  return function (target: any, propertyKey: string) {
    IsNotEmpty()(target, propertyKey);
    IsString()(target, propertyKey);
    Matches(/^\+?[1-9]\d{1,14}$/)(target, propertyKey);
  };
}
```
