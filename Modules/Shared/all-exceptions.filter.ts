import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

// Global exception filter to catch all unhandled exceptions and format the response
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {

  // Method to catch any exception, gets the arguments being passed to the handler and formats the HTTP response accordingly 
  catch(exception: unknown, host: ArgumentsHost) {
    
    const ctx = host.switchToHttp();    // Switches from the generic ArgumentsHost to the HTTP context
    const response = ctx.getResponse(); // Gets the response object to send the HTTP response
    const request = ctx.getRequest();   // Gets the request object to access request details like URL and method

    // Determines the HTTP status code and message based on whether the exception is an instance of HttpException or a generic error
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Sets the message to be sent in the response, using the exception's response if it's an HttpException, otherwise a generic message
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Erro interno do servidor. Por favor, tente novamente mais tarde. Se o problema persistir, entre em contato com o suporte.';

    // Sends the formatted JSON response with status code, request path, method, and message
    response.status(status).json({
      statusCode: status,
      path: request.url,
      method: request.method,
      message,
    });
  }
}
