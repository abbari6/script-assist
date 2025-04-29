import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string; user?: any }>();
    let status = 500;
    let message = 'Internal server error';
    let errorResponse: any = {};

    // Extract requestId and user if present
    const requestId = request.requestId || null;
    const userId = request.user?.id || null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as any).message || message;
        errorResponse = res;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log with context
    this.logger.error(
      `Status ${status} | RequestID: ${requestId || '-'} | User: ${userId || '-'} | ${request.method} ${request.url} | ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Avoid leaking sensitive info
    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      ...(status >= 500 ? {} : errorResponse),
      path: request.url,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }
} 