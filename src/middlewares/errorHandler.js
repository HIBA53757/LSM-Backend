import { AppError } from "../utils/errors.js";

function errorHandler(error, req, res, next) {
    const normalizedError = AppError.from(error);
    console.error(error);

    return res.status(normalizedError.status).json({
        success: false,
        message: normalizedError.message,
    });
}
export default errorHandler