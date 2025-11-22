# Rangers FX Server - Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [Directory Structure](#directory-structure)
4. [Module Architecture](#module-architecture)
5. [Request Flow](#request-flow)
6. [Authentication & Authorization Flow](#authentication--authorization-flow)
7. [Data Flow](#data-flow)
8. [Design Patterns](#design-patterns)
9. [Error Handling](#error-handling)
10. [Validation Flow](#validation-flow)
11. [Module Dependencies](#module-dependencies)
12. [Best Practices](#best-practices)
13. [Adding New Modules](#adding-new-modules)

---

## Overview

Rangers FX Server is a **NestJS-based RESTful API** built following **modular architecture** principles. The application follows a **self-contained module pattern** where each feature module contains all its related components (entities, repositories, services, DTOs, enums, constants) within its own directory structure.

### Technology Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT (JSON Web Tokens) with Passport.js
- **Validation**: class-validator & class-transformer
- **Email**: Nodemailer
- **Language**: TypeScript

---

## Architecture Principles

### 1. **Modular Architecture**

Each feature is encapsulated in its own module with all related components. Modules are self-contained and follow a strict directory structure.

### 2. **Separation of Concerns**

- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic
- **Repositories**: Data access layer (when needed)
- **Entities**: Database models
- **DTOs**: Data transfer objects for validation

### 3. **Dependency Injection**

All dependencies are injected through NestJS's DI container, ensuring loose coupling and testability.

### 4. **Single Responsibility Principle**

Each class/service has one clear responsibility and reason to change.

### 5. **DRY (Don't Repeat Yourself)**

Common functionality is extracted into shared modules (Config, Email) or common utilities.

### 6. **Configuration Management**

All configuration is centralized in `ConfigModule` using environment variables.

---

## Directory Structure

```
src/
├── main.ts                    # Application entry point
├── app.module.ts             # Root module
├── app.controller.ts          # Root controller
├── app.service.ts             # Root service
│
├── config/                   # Configuration module
│   ├── config.module.ts
│   └── config.service.ts
│
├── common/                    # Shared/common functionality
│   ├── decorators/            # Custom decorators (@CurrentUser, @Public)
│   ├── guards/                # Route guards (JWT authentication)
│   ├── filters/               # Exception filters
│   ├── interceptors/          # Response interceptors
│   ├── pipes/                 # Validation pipes
│   ├── response/              # Standardized response formats
│   ├── dto/                   # DTO Builder Pattern utilities
│   │   ├── dto-builder.ts     # Builder class and createDTO function
│   │   ├── decorators.ts      # Reusable decorator helpers
│   │   ├── field-types.enum.ts # Field type definitions
│   │   └── field-definition.interface.ts # Field definition interfaces
│   └── enums/                 # Shared enums
│
├── core/                      # Core/shared services
│   └── services/
│       └── email/             # Email service module
│
└── modules/                   # Feature modules (self-contained)
    ├── user/                  # User management module
    │   ├── entities/          # User entity
    │   ├── repositories/      # User repository (if needed)
    │   ├── enums/             # User-specific enums
    │   ├── constants/         # User-specific constants
    │   ├── dto/               # User DTOs
    │   ├── user.service.ts    # User business logic
    │   ├── user.controller.ts # User endpoints
    │   └── user.module.ts     # User module definition
    │
    └── auth/                  # Authentication module
        ├── interfaces/        # TypeScript interfaces
        ├── constants/         # Auth-specific constants
        ├── strategies/        # Passport strategies
        ├── guards/            # Auth guards (if module-specific)
        ├── dto/               # Auth DTOs
        ├── auth.service.ts    # Auth business logic
        ├── auth.controller.ts # Auth endpoints
        └── auth.module.ts     # Auth module definition
```

---

## Module Architecture

### Standard Module Structure

Every feature module **MUST** follow this structure:

```
modules/{feature-name}/
├── entities/              # Database entities (TypeORM)
│   ├── {feature}.entity.ts
│   └── index.ts
│
├── repositories/         # Custom repositories (optional)
│   ├── {feature}.repository.ts
│   └── index.ts
│
├── enums/                # Feature-specific enums
│   ├── {feature}.enum.ts
│   └── index.ts
│
├── constants/            # Feature-specific constants
│   ├── {feature}.constants.ts
│   └── index.ts
│
├── dto/                  # Data Transfer Objects
│   ├── create-{feature}.dto.ts
│   ├── update-{feature}.dto.ts
│   ├── {feature}-response.dto.ts
│   └── index.ts
│
├── interfaces/           # TypeScript interfaces (if needed)
│   ├── {feature}-interface.ts
│   └── index.ts
│
├── {feature}.service.ts  # Business logic
├── {feature}.controller.ts # API endpoints
└── {feature}.module.ts   # Module definition
```

### Module Rules

1. **Self-Containment**: All module-related code must be within the module directory
2. **Index Files**: Each subdirectory should have an `index.ts` for clean imports
3. **No Cross-Module Imports**: Modules should only import from:
   - Common modules (config, email, etc.)
   - Other modules through their exported services
   - Shared/common utilities
4. **Exports**: Only export what other modules need (typically services)

---

## Request Flow

### Standard HTTP Request Flow

```
1. HTTP Request
   ↓
2. Global Middleware (CORS)
   ↓
3. Route Matching
   ↓
4. Guards (Authentication/Authorization)
   ↓
5. Interceptors (Request transformation)
   ↓
6. Pipes (Validation & Transformation)
   ↓
7. Controller Handler
   ↓
8. Service (Business Logic)
   ↓
9. Repository/Entity (Data Access)
   ↓
10. Database
   ↓
11. Service (Response processing)
   ↓
12. Interceptors (Response transformation)
   ↓
13. Exception Filters (Error handling)
   ↓
14. HTTP Response
```

### Global Components

**Applied in `main.ts`:**

1. **Global Exception Filter** (`ApiExceptionFilter`)
   - Catches all exceptions
   - Formats error responses consistently
   - Logs errors

2. **Global Response Interceptor** (`ApiResponseInterceptor`)
   - Wraps all successful responses in standard format
   - Ensures consistent API response structure

3. **Global Validation Pipe** (`AppValidationPipe`)
   - Validates all incoming DTOs
   - Transforms data according to DTO definitions
   - Returns validation errors in consistent format

---

## Authentication & Authorization Flow

### JWT Authentication Flow

```
1. User Registration/Login
   ↓
2. AuthService validates credentials
   ↓
3. JWT token generated (contains user ID)
   ↓
4. Token returned to client
   ↓
5. Client includes token in Authorization header
   ↓
6. JwtAuthGuard intercepts request
   ↓
7. JwtStrategy validates token
   ↓
8. User entity loaded from database
   ↓
9. User attached to request object (request.user)
   ↓
10. Controller handler executes
```

### Authentication Components

- **JwtStrategy** (`auth/strategies/jwt.strategy.ts`)
  - Validates JWT tokens
  - Extracts user from database
  - Attaches user to request

- **JwtAuthGuard** (`common/guards/jwt-auth.guard.ts`)
  - Applied globally or per-route
  - Protects routes requiring authentication

- **@Public() Decorator** (`common/decorators/public.decorator.ts`)
  - Marks routes as public (bypasses authentication)

- **@CurrentUser() Decorator** (`common/decorators/current-user.decorator.ts`)
  - Extracts authenticated user from request
  - Type-safe user access in controllers

---

## Data Flow

### Creating a Resource (Example: User)

```
1. Client sends POST /users with CreateUserDto
   ↓
2. UserController.create() receives request
   ↓
3. ValidationPipe validates CreateUserDto
   ↓
4. UserService.create() called
   ↓
5. UserService:
   - Validates business rules
   - Hashes password
   - Creates User entity
   - Saves to database via Repository
   - Sends welcome email (async)
   - Returns UserResponseDto
   ↓
6. ResponseInterceptor wraps response
   ↓
7. Client receives standardized response
```

### Reading a Resource

```
1. Client sends GET /users/:id
   ↓
2. JwtAuthGuard validates token
   ↓
3. UserController.findOne() receives request
   ↓
4. UserService.findOne() called
   ↓
5. Repository queries database
   ↓
6. Entity mapped to UserResponseDto
   ↓
7. Response returned to client
```

---

## Design Patterns

### 1. **Repository Pattern**

- Custom repositories extend TypeORM Repository
- Encapsulates database queries
- Provides reusable query methods
- Example: `UserRepository.findByEmail()`

### 2. **Service Layer Pattern**

- Services contain business logic
- Controllers are thin (delegate to services)
- Services can call other services
- Example: `AuthService` uses `UserService`

### 3. **DTO Pattern**

- Separate DTOs for input/output
- Input DTOs: Validation rules
- Output DTOs: Data transformation (exclude sensitive fields)
- Example: `CreateUserDto` → `UserResponseDto`

### 7. **DTO Builder Pattern**

- Reusable DTO creation using fluent builder API
- Centralized validation rules to ensure consistency
- Reduces code duplication across DTOs
- Located in `common/dto/dto-builder.ts`
- Example:
  ```typescript
  export const LoginDto = createDTO('LoginDto').email().password().build();
  export type LoginDto = InstanceType<typeof LoginDto>;
  ```

### 4. **Dependency Injection**

- All dependencies injected via constructor
- Enables testing and loose coupling
- Managed by NestJS DI container

### 5. **Module Pattern**

- Each feature is a module
- Modules export services
- Modules import dependencies
- Clear module boundaries

### 6. **Strategy Pattern**

- Used for authentication strategies
- Example: `JwtStrategy` implements Passport strategy

---

## Error Handling

### Error Flow

```
1. Exception thrown in Service/Controller
   ↓
2. Caught by Global Exception Filter
   ↓
3. ApiExceptionFilter processes exception
   ↓
4. Exception mapped to HTTP status code
   ↓
5. Error logged
   ↓
6. Standardized error response returned
```

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2025-11-22T12:00:00.000Z",
  "path": "/api/users"
}
```

### Exception Types

- **ValidationException**: DTO validation failures (400)
- **UnauthorizedException**: Authentication failures (401)
- **NotFoundException**: Resource not found (404)
- **ConflictException**: Resource conflicts (409)
- **BadRequestException**: Invalid requests (400)

---

## Validation Flow

### DTO Validation

```
1. Request received with body
   ↓
2. Global ValidationPipe activated
   ↓
3. DTO class instantiated
   ↓
4. class-validator decorators checked
   ↓
5. Validation errors collected
   ↓
6. If valid: Transformed object passed to controller
   ↓
7. If invalid: ValidationException thrown (400)
```

### Validation Decorators

The application uses a **DTO Builder Pattern** for creating reusable DTOs with consistent validation. All DTOs are created using the `createDTO()` builder function from `common/dto`.

#### Builder Pattern Usage

```typescript
import { createDTO } from '../../../common/dto';

// Simple DTO
export const LoginDto = createDTO('LoginDto').email().password().build();
export type LoginDto = InstanceType<typeof LoginDto>;

// Complex DTO with multiple fields
export const SignupInitiateDto = createDTO('SignupInitiateDto')
  .string('fullName', true, { minLength: 2 })
  .email()
  .string('referralCode', false)
  .build();
export type SignupInitiateDto = InstanceType<typeof SignupInitiateDto>;
```

#### Available Builder Methods

- `.email(name?, required?)` - Email field with validation
- `.password(name?, required?, minLength?)` - Password field (default minLength: 8)
- `.string(name, required?, options?)` - String field with optional minLength/maxLength
- `.number(name, required?, options?)` - Number field with optional min/max
- `.userId(name?, required?)` - User ID field (integer, min: 1)
- `.enum(name, enumClass, required?)` - Enum field validation
- `.otp(name?, required?)` - OTP string field
- `.token(name?, required?)` - Token string field

#### Benefits

- **DRY Principle**: No repeated validation decorators
- **Consistency**: Same validation rules across all DTOs
- **Maintainability**: Update validation in one place
- **Type Safety**: Full TypeScript support with `InstanceType<typeof Dto>`
- **Readability**: Cleaner, more semantic code

For more details, see `src/common/dto/README.md`.

---

## Module Dependencies

### Dependency Graph

```
AppModule
├── ConfigModule (global)
├── EmailModule (shared service)
├── TypeOrmModule (database)
├── UserModule
│   ├── ConfigModule
│   ├── EmailModule
│   └── TypeOrmModule.forFeature([User])
└── AuthModule
    ├── UserModule (imports UserService)
    ├── ConfigModule
    ├── EmailModule
    └── TypeOrmModule.forFeature([User])
```

### Dependency Rules

1. **No Circular Dependencies**: Modules cannot import each other directly
2. **Shared Services**: Use shared modules (Email, Config) for common functionality
3. **Service Exports**: Only export services that other modules need
4. **Entity Sharing**: Entities can be imported from other modules if needed

---

## Best Practices

### 1. **Module Organization**

- ✅ Keep all module code in module directory
- ✅ Use index files for clean imports
- ✅ Export only what's needed
- ❌ Don't import entities or repositories directly (use services)

### 2. **Service Layer**

- ✅ Keep controllers thin
- ✅ Put business logic in services
- ✅ Use async/await for async operations
- ✅ Handle errors appropriately
- ✅ Log important operations

### 3. **DTOs**

- ✅ Use separate DTOs for create/update/response
- ✅ Use DTO Builder Pattern (`createDTO()`) for all input DTOs
- ✅ Export both class and type: `export const Dto = createDTO(...).build(); export type Dto = InstanceType<typeof Dto>;`
- ✅ Exclude sensitive fields in response DTOs
- ✅ Use class-transformer for transformations
- ✅ Keep DTOs focused and single-purpose
- ❌ Don't use manual decorators - use builder pattern instead

### 4. **Constants**

- ✅ Define constants in constants files
- ✅ Use constants instead of magic numbers/strings
- ✅ Group related constants together

### 5. **Error Handling**

- ✅ Use appropriate exception types
- ✅ Provide meaningful error messages
- ✅ Log errors with context
- ✅ Don't expose internal errors to clients

### 6. **Security**

- ✅ Always hash passwords (bcrypt)
- ✅ Use JWT for authentication
- ✅ Validate all inputs
- ✅ Use environment variables for secrets
- ✅ Protect sensitive routes with guards

### 7. **Code Quality**

- ✅ Write descriptive comments
- ✅ Use TypeScript types strictly
- ✅ Follow naming conventions
- ✅ Keep functions small and focused

---

## Adding New Modules

### Step-by-Step Guide

#### 1. Create Module Directory Structure

```bash
mkdir -p src/modules/{feature-name}/{entities,repositories,enums,constants,dto,interfaces}
```

#### 2. Create Entity

```typescript
// entities/{feature}.entity.ts
@Entity('table_name')
export class Feature {
  @PrimaryGeneratedColumn()
  id: number;

  // ... other fields
}
```

#### 3. Create DTOs

**Input DTOs (using Builder Pattern):**

```typescript
// dto/create-{feature}.dto.ts
import { createDTO } from '../../../common/dto';

export const CreateFeatureDto = createDTO('CreateFeatureDto')
  .string('name', true, { minLength: 2 })
  .email('email', true)
  .build();
export type CreateFeatureDto = InstanceType<typeof CreateFeatureDto>;

// dto/update-{feature}.dto.ts
export const UpdateFeatureDto = createDTO('UpdateFeatureDto')
  .string('name', false, { minLength: 2 })
  .email('email', false)
  .build();
export type UpdateFeatureDto = InstanceType<typeof UpdateFeatureDto>;
```

**Response DTOs (manual class definition):**

```typescript
// dto/{feature}-response.dto.ts
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class FeatureResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  email: string;

  constructor(partial: Partial<FeatureResponseDto>) {
    Object.assign(this, partial);
  }
}
```

#### 4. Create Service

```typescript
// {feature}.service.ts
@Injectable()
export class FeatureService {
  constructor(
    @InjectRepository(Feature)
    private readonly repository: Repository<Feature>,
  ) {}

  async create(dto: CreateFeatureDto): Promise<FeatureResponseDto> {
    // Business logic
  }
}
```

#### 5. Create Controller

```typescript
// {feature}.controller.ts
@Controller('features')
export class FeatureController {
  constructor(private readonly service: FeatureService) {}

  @Post()
  async create(@Body() dto: CreateFeatureDto) {
    return this.service.create(dto);
  }
}
```

#### 6. Create Module

```typescript
// {feature}.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([Feature]),
    ConfigModule, // If needed
    EmailModule, // If needed
  ],
  controllers: [FeatureController],
  providers: [FeatureService],
  exports: [FeatureService], // If other modules need it
})
export class FeatureModule {}
```

#### 7. Register in AppModule

```typescript
// app.module.ts
@Module({
  imports: [
    // ... existing imports
    FeatureModule,
  ],
})
export class AppModule {}
```

### Checklist

- [ ] Created directory structure
- [ ] Created entity with proper decorators
- [ ] Created input DTOs using builder pattern (`createDTO()`) with validation
- [ ] Created response DTOs with `@Exclude()` and `@Expose()` decorators
- [ ] Exported both class and type for input DTOs (`export const Dto = ...; export type Dto = InstanceType<typeof Dto>;`)
- [ ] Created service with business logic
- [ ] Created controller with endpoints
- [ ] Created module definition
- [ ] Registered module in AppModule
- [ ] Added constants if needed
- [ ] Added enums if needed
- [ ] Created index files
- [ ] Tested endpoints

---

## Key Files Reference

### Entry Points

- `main.ts` - Application bootstrap, global configurations
- `app.module.ts` - Root module, imports all feature modules

### Configuration

- `config/config.service.ts` - Centralized configuration from environment variables

### Common Components

- `common/guards/jwt-auth.guard.ts` - JWT authentication guard
- `common/filters/api-exception.filter.ts` - Global exception handling
- `common/interceptors/api-response.interceptor.ts` - Response formatting
- `common/pipes/app-validation.pipe.ts` - DTO validation
- `common/dto/dto-builder.ts` - DTO Builder Pattern for creating reusable DTOs
- `common/dto/decorators.ts` - Reusable validation decorator helpers

### Shared Services

- `core/services/email/email.module.ts` - Email service module

---

## Development Guidelines

### Naming Conventions

- **Modules**: `{feature}.module.ts`
- **Services**: `{feature}.service.ts`
- **Controllers**: `{feature}.controller.ts`
- **Entities**: `{feature}.entity.ts`
- **DTOs**: `{action}-{feature}.dto.ts` (e.g., `create-user.dto.ts`, `login.dto.ts`)
- **Enums**: `{feature}.enum.ts`
- **Constants**: `{feature}.constants.ts`

### DTO Creation Guidelines

- **Input DTOs**: Always use `createDTO()` builder pattern
- **Response DTOs**: Use manual class definition with `@Exclude()` and `@Expose()`
- **Type Export**: Always export both class and type: `export const Dto = ...; export type Dto = InstanceType<typeof Dto>;`
- **Builder Methods**: Use semantic method names (`.email()`, `.password()`, `.string()`, etc.)
- **Optional Fields**: Pass `false` as the `required` parameter (e.g., `.string('name', false)`)

### Import Order

1. NestJS imports
2. Third-party imports
3. Local module imports (entities, DTOs, etc.)
4. Shared/common imports

### Code Organization

- One class per file
- Export from index files
- Use barrel exports for clean imports
- Group related functionality together

---

## Conclusion

This architecture ensures:

- **Maintainability**: Clear structure and separation of concerns
- **Scalability**: Easy to add new features as modules
- **Testability**: Dependency injection enables easy testing
- **Consistency**: Standardized patterns across all modules
- **Security**: Built-in authentication and validation

Follow these patterns strictly to maintain code quality and consistency across the codebase.
