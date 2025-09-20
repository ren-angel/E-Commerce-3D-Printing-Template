import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

// JWT authentication guard to protect routes and ensure valid JWT tokens are present in requests
@Injectable()
export class JwtAuthGuard implements CanActivate {

    // Injecting JwtService for token verification and Reflector for accessing metadata
    constructor(private jwtService: JwtService, private reflector: Reflector) {}

    // canActivate method, which takes the execution context (for request/response details), and returns a boolean indicating whether the request is allowed to proceed
    canActivate(context: ExecutionContext): boolean {

        // Extracting the request object from the execution context
        const request = context.switchToHttp().getRequest<Request>();

        // Extracting the JWT token from the Authorization header (Bearer token)
        const token = request.headers.authorization?.split(' ')[1];

        // If no token is present, then deny access
        if (!token) return false;

        // Verifying the token using JwtService; if valid, attach the decoded payload to the request object and allow access, otherwise deny access
        try {

            const decoded = this.jwtService.verify(token);

            request['user'] = decoded;
            
            return true;
        } catch {

            return false;
        }
    }
}