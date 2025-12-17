// Custom error class for domain-specific errors. Domain errors are errors that occur due to business logic violations or invalid operations within the application's domain.
export class DomainError extends Error {

    // Constructor to initialize the DomainError with a specific message
    constructor(message: string) {
        super(message); // Call the parent class (Error) constructor with the message
        this.name = this.constructor.name; // Set the error name to the class name
    }
}

// Custom error class for validation errors, extending the DomainError class
// These errors are commonly used for CRUD operations when the provided data does not meet the required criteria
export class EntityNotFoundError extends DomainError {} // Error for when an entity is not found
export class InvalidEntityError extends DomainError {} // Error for when an entity is invalid, aka validation errors
export class ConflictError extends DomainError {} // Error for when there is a conflict, e.g., duplicate entries
