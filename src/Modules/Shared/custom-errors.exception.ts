// Custom error class for domain-specific errors. Domain errors are errors that occur due to business logic violations or invalid operations within the application's domain.
export class DomainError extends Error {

    // Constructor to initialize the DomainError with a specific message
    constructor(message: string) {
        super(message); // Call the parent class (Error) constructor with the message
        this.name = 'DomainError';
    }
}