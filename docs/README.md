# Documentation

## Architecture Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete architecture guide covering:
  - System overview and principles
  - Directory structure and module patterns
  - Request flow and authentication flow
  - Design patterns and best practices
  - How to add new modules
  - Development guidelines

## Quick Start for New Developers

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system structure
2. Review the module structure pattern (self-contained modules)
3. Follow the "Adding New Modules" section when creating features
4. Adhere to the best practices and naming conventions

## Key Points

- **Modular Architecture**: Each feature is a self-contained module
- **Strict Structure**: Follow the standard module structure pattern
- **Separation of Concerns**: Controllers → Services → Repositories → Database
- **Dependency Injection**: All dependencies injected via NestJS DI
- **Global Components**: Exception filters, interceptors, and validation pipes
