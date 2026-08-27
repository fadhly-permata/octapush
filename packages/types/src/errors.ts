export type ErrorCode =
  | 'ERR_AUT_000'
  | 'ERR_SEC_001'
  | 'ERR_PRJ_005'
  | 'ERR_PRM_006'
  | 'ERR_RLS_007'
  | 'ERR_DAL_002'
  | 'ERR_AIC_003'
  | 'ERR_WFE_004'
  | 'ERR_SQL_008'
  | 'ERR_QTA_009'
  | 'ERR_MIG_010'
  | 'ERR_MIG_017'
  | 'ERR_DST_011'
  | 'ERR_XSS_012'
  | 'ERR_ABU_013'
  | 'ERR_RTM_014'
  | 'ERR_I18N_015'
  | 'ERR_MKT_016';

export interface AppErrorParams {
  code: ErrorCode;
  message?: string;
  cause?: unknown;
  context?: Record<string, unknown>;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly cause?: unknown;
  public readonly context?: Record<string, unknown>;

  constructor(params: AppErrorParams) {
    super(params.message ?? params.code);
    this.name = 'AppError';
    this.code = params.code;
    this.cause = params.cause;
    this.context = params.context;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
