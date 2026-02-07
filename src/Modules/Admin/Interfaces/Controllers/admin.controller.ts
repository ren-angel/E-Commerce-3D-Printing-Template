import { Controller, Post, Body } from '@nestjs/common';
import { seconds, Throttle } from '@nestjs/throttler';
import { LoginUseCase } from '../../Application/Use-cases/login.use-case';

// Reminder to put the url code in an environment variable later

// Controller for handling admin-related endpoints, such as login. The URL is intentionally obfuscated to enhance security by making it less discoverable by bots.
@Controller('admin/XEAT-L3AU-NULA-97E3-9B2F')
@Throttle({ default: { limit: 10, ttl: seconds(60) } }) // Overriding the default throttling for this specific controller
export class AdminController {

  constructor(private loginUseCase: LoginUseCase) {}

  // Endpoint for admin login, which accepts an email and password in the request body, and returns a JWT access token if the credentials are valid
  @Post('login')
  async login(@Body() loginDto: { adminEmail: string; adminPassword: string }) {
    
    return this.loginUseCase.execute(loginDto.adminEmail, loginDto.adminPassword);
  }
}