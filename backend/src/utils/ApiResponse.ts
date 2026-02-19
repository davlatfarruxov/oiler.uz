export class ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  page?: number;
  limit?: number;
  totalPages?: number;
  totalItems?: number;

  constructor(success: boolean, message: string, data?: T, metadata?: {
    page?: number;
    limit?: number;
    totalPages?: number;
    totalItems?: number;
  }) {
    this.success = success;
    this.message = message;
    if (data !== undefined) {
      this.data = data;
    }
    if (metadata) {
      this.page = metadata.page;
      this.limit = metadata.limit;
      this.totalPages = metadata.totalPages;
      this.totalItems = metadata.totalItems;
    }
  }

  static success<T>(message: string, data?: T, metadata?: {
    page?: number;
    limit?: number;
    totalPages?: number;
    totalItems?: number;
  }): ApiResponse<T> {
    return new ApiResponse(true, message, data, metadata);
  }

  static error(message: string): ApiResponse {
    return new ApiResponse(false, message);
  }
}
