import { ApiStatus } from '../enums/api-status.enum';

export class ApiResponse<T> {
  status: ApiStatus;
  message: string;
  data?: T;
  errors?: string | string[];

  private constructor(status: ApiStatus, message: string, data?: T, errors?: string | string[]) {
    this.status = status;
    this.message = message;
    if (data && status === ApiStatus.SUCCESS) this.data = data;
    if (errors) this.errors = errors;
  }

  static success<T>(message = 'Operation successful', data?: T): ApiResponse<T> {
    return new ApiResponse<T>(ApiStatus.SUCCESS, message, data, undefined);
  }

  static error<T>(message: string, errors?: string | string[]): ApiResponse<T> {
    return new ApiResponse<T>(ApiStatus.ERROR, message, undefined, errors);
  }
}
