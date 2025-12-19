import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { DomainError, EntityNotFoundError, InvalidEntityError, ConflictError, UnauthorizedError, ForbiddenError, InfrastructureError } from '../Shared/custom-errors.exception';

// Global exception filter to handle all exceptions thrown in the application
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {

  // Method to catch exceptions and format the HTTP response accordingly
  // exception is unknown to allow handling of any type of exception
  // meanwhile host provides methods to access the request and response objects
  catch(exception: unknown, host: ArgumentsHost) {

    const ctx = host.switchToHttp();    // Switch to HTTP context
    const response = ctx.getResponse(); // Get the response object
    const request = ctx.getRequest();   // Get the request object

    // Handle NestJS HttpException separately to extract status and response
    if (exception instanceof HttpException) {

      const status = exception.getStatus();
      const resp = exception.getResponse();

      // Format the response for http errors
      return response.status(status).json({
        statusCode: status,
        path: request.url,
        method: request.method,
        message: resp,
      });
    }

    // Handle custom DomainErrors and map them to appropriate HTTP status codes
    if (exception instanceof DomainError) {
      
      // Map the domain error to an HTTP status code
      const status = mapDomainErrorToStatus(exception);
      
      // Format the response for domain errors
      return response.status(status).json({
        statusCode: status,
        path: request.url,
        method: request.method,
        message: exception.message,
      });
    }

    // For all other unexpected errors, return a generic 500 Internal Server Error response
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      path: request.url,
      method: request.method,
      message: 'Erro interno do servidor. Por favor, tente novamente mais tarde. Se o problema persistir, entre em contato com o suporte.',
    });
  }
}

// Function to map custom DomainErrors to appropriate HTTP status codes
function mapDomainErrorToStatus(err: DomainError) {

  if (err instanceof EntityNotFoundError) return HttpStatus.NOT_FOUND;
  if (err instanceof InvalidEntityError) return HttpStatus.BAD_REQUEST;
  if (err instanceof ConflictError) return HttpStatus.CONFLICT;
  if (err instanceof UnauthorizedError) return HttpStatus.UNAUTHORIZED;
  if (err instanceof ForbiddenError) return HttpStatus.FORBIDDEN;
  if (err instanceof InfrastructureError) return HttpStatus.SERVICE_UNAVAILABLE;

  // Default to 400 Bad Request for other DomainErrors
  return HttpStatus.BAD_REQUEST;
}
