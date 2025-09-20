import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// JWT strategy for validating and extracting user information from JWT tokens
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    // Injecting ConfigService to access environment variables, particularly the SECRET_KEY for JWT validation
    // In this case, do not use private or protected access modifiers because the configService property is used in the super() call
    constructor(readonly configService: ConfigService) {

        // Configuring the JWT strategy with options for extracting the token from the Authorization header and setting the secret key
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get('SECRET_KEY'),
        });
    }

    // Validate method to extract and return user information from the JWT payload
    async validate(payload: any) {
        
        return { userEmail: payload.email };
    }
}