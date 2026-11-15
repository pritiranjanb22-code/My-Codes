import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: ApiResponse['meta']
): Response => {
  return res.status(statusCode).json({
    success: true,
    data,
    meta,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  code: string = 'INTERNAL_ERROR',
  details?: any
): Response => {
  return res.status(statusCode).json({
    success: false,
    error: message,
    code,
    details,
  });
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
): Response => {
  const totalPages = Math.ceil(total / limit);
  return sendSuccess(res, data, 200, {
    page,
    limit,
    total,
    totalPages,
  });
};