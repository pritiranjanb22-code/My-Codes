import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    }
    
    // Log slow requests
    if (duration > 1000) {
      console.warn('Slow request:', logData);
    }
  });
  
  next();
};