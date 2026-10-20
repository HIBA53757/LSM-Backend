export class AppError extends Error {
	constructor(message = "Internal server error", status = 500) {
		super(message);
		this.name = this.constructor.name;
		this.status = status;
	}

	static from(error) {
		if (error instanceof AppError) {
			return error;
		}

		if (error?.code === 11000) {
			return new ConflictError("A resource with the same value already exists.");
		}

		if (error?.name === "ValidationError") {
			return new ValidationError(error.message);
		}

		if (error?.name === "CastError") {
			return new ValidationError("Invalid resource identifier.");
		}

		return new InternalServerError();
	}
}

export class BadRequestError extends AppError {
	constructor(message = "Bad request") {
		super(message, 400);
	}
}

export class ValidationError extends AppError {
	constructor(message = "Validation failed") {
		super(message, 400);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = "Authentication required") {
		super(message, 401);
	}
}

export class ForbiddenError extends AppError {
	constructor(message = "Forbidden: Insufficient permissions.") {
		super(message, 403);
	}
}

export class NotFoundError extends AppError {
	constructor(message = "Resource not found") {
		super(message, 404);
	}
}

export class ConflictError extends AppError {
	constructor(message = "Resource conflict") {
		super(message, 409);
	}
}

export class InternalServerError extends AppError {
	constructor(message = "Internal server error") {
		super(message, 500);
	}
}
