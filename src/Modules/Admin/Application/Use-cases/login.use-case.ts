import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminRepositoryInterface } from '../../Domain/Repositories/admin.repository.interface';
import { UnauthorizedError } from 'src/Modules/Shared/custom-errors.exception';

// Implement cache later and logging (and whatever else is missing)
// ATTENTION: Turn ON verification code again by making it non-nullable here and on database, and then apply it to the jwt and admin logins parts of this code

// Use case for handling user login and generating JWT tokens upon successful authentication
@Injectable()
export class LoginUseCase {

    // Injecting the Admin repository and JWT service using dependency injection for the use case to interact with the data layer and generate JWT tokens
    constructor(
        @Inject('AdminRepositoryInterface')
        private readonly adminRepository: AdminRepositoryInterface,
        private readonly jwtService: JwtService,
    ) {}
  
    // Method to execute the use case, taking an admin email and password as input, validating the credentials against the repository, and returning a Promise that resolves to an object containing the generated JWT access token if authentication is successful
    async execute(adminEmail: string, adminPassword: string): Promise<{ access_token: string }> {

        // Validate the admin credentials by checking if a user with the provided email and password exists in the repository
        const existingUser = await this.adminRepository.findOne(adminEmail, adminPassword);

        // If no user is found with the provided credentials, throws an unauthorized error
        if (!existingUser) {

            throw new UnauthorizedError('Credenciais inválidas. Por favor, verifique seu email e senha.');
        }
        
        // If the credentials are valid, generate a JWT token with the admin's email and password as the payload. The 'sub' claim is commonly used to identify the subject of the token, which in this case is the admin's password (change this later to a more appropriate identifier, such as admin ID or email, for better security practices)
        const payload = { adminEmail: existingUser.adminEmail, sub: existingUser.adminPassword };

        // Return the generated JWT token in the response
        return { access_token: this.jwtService.sign(payload) };
    }
}