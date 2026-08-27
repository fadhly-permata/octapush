export type EnvSchema = 'logic_dev' | 'data_dev' | 'logic_prod' | 'data_prod';

export type Env = 'DEV' | 'PROD';

export type ObjectPrefix = string;

export type IsoTimestamp = string;

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type Nullable<T> = T | null;
