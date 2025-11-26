# Query Parameters Helper

A reusable solution for handling query parameters in GET all APIs. Supports pagination, sorting, and dynamic filtering.

## Features

- **Pagination**: `page` and `pageSize` with defaults (1 and 10)
- **Sorting**: Multiple field sorting in format `"field1:asc,field2:desc"` (default: `createdAt:desc`)
- **Filtering**: Any additional query parameters are automatically treated as filters
- **TypeORM Integration**: Converts query params to TypeORM-compatible options

## Usage

### Basic Usage

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { QueryParamsDto, QueryParamsHelper } from 'src/common/query';
import { ApiResponse } from 'src/common/response/api.response';

@Controller('bots')
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Get()
  async getAllBots(
    @Query() query: QueryParamsDto,
  ): Promise<ApiResponse<{ meta: { total: number; page: number; pageSize: number }; data: BotResponseDto[] }>> {
    return this.botsService.getAllBots(query);
  }
}
```

### In Service

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryParamsDto, QueryParamsHelper } from 'src/common/query';

@Injectable()
export class BotsService {
  constructor(
    @InjectRepository(BotActivation)
    private readonly botRepository: Repository<BotActivation>,
  ) {}

  async getAllBots(query: QueryParamsDto) {
    // Parse query parameters
    const parsed = QueryParamsHelper.parse(query);

    // Build TypeORM find options
    const findOptions = QueryParamsHelper.buildFindOptions(parsed);

    // Execute query
    const [data, total] = await this.botRepository.findAndCount(findOptions);

    // Return paginated result
    return ApiResponse.success('Bots retrieved successfully', {
      ...QueryParamsHelper.toPaginatedResult(
        data.map((item) => BotResponseDto.fromEntity(item)),
        total,
        parsed,
      ),
      // Returns: { meta: { total, page, pageSize }, data: [...] }
    });
  }
}
```

### With Additional Where Conditions

```typescript
async getUserBots(userId: number, query: QueryParamsDto) {
  const parsed = QueryParamsHelper.parse(query);

  // Merge filters with additional where conditions
  const findOptions = QueryParamsHelper.buildFindOptions(parsed, {
    userId, // Additional condition
  });

  const [data, total] = await this.botRepository.findAndCount(findOptions);

  return ApiResponse.success('Bots retrieved successfully', {
    ...QueryParamsHelper.toPaginatedResult(
      data.map((item) => BotResponseDto.fromEntity(item)),
      total,
      parsed,
    ),
    // Returns: { meta: { total, page, pageSize }, data: [...] }
  });
}
```

### Extending for Specific Filters

If you want type-safe filter fields, extend the DTO:

```typescript
import { IsOptional, IsString, IsDateString } from 'class-validator';
import { QueryParamsDto } from 'src/common/query';

export class BotQueryDto extends QueryParamsDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
```

Then use it in your controller:

```typescript
@Get()
async getAllBots(@Query() query: BotQueryDto) {
  return this.botsService.getAllBots(query);
}
```

## Query Parameters

### Pagination

- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 10)

### Sorting

- `sort`: Sort string in format `"field:direction,field2:direction"` (default: `"createdAt:desc"`)
  - Directions: `asc` or `desc`
  - Example: `"incomeReceived:asc,status:asc"`

### Filters

Any other query parameters are treated as filters:

- `status`: Filter by status
- `search`: Search term
- `startDate`: Start date filter
- `endDate`: End date filter
- Any other field you need

## Example API Calls

```
GET /bots?page=1&pageSize=10&sort=incomeReceived:asc,status:asc&status=active&search=Bot&startDate=2025-11-25&endDate=2025-11-28
```

This will:

- Return page 1 with 10 items per page
- Sort by `incomeReceived` ascending, then by `status` ascending
- Filter by `status=active`
- Filter by `search=Bot`
- Filter by date range
