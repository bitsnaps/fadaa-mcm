// Centralized error handler for API routes
// Maps common Sequelize/MySQL errors to user-friendly messages and HTTP statuses

function mapSequelizeError(err) {
  // Default fallback
  let status = 500;
  let message = 'An unexpected server error occurred.';

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    status = err.name === 'SequelizeUniqueConstraintError' ? 409 : 400;
    // Combine messages if present
    if (Array.isArray(err.errors) && err.errors.length > 0) {
      message = err.errors.map(e => e.message).join('; ');
    } else if (err.message) {
      message = err.message;
    } else {
      message = 'Invalid input provided.';
    }
    return { status, message };
  }

  // MySQL foreign key constraint violation
  // mysql2 error codes: ER_ROW_IS_REFERENCED_2 (1451), ER_NO_REFERENCED_ROW_2 (1452)
  if (err?.parent?.errno === 1451) {
    status = 409;
    message = 'Cannot delete: this record is referenced by other data.';
    return { status, message };
  }
  if (err?.parent?.errno === 1452) {
    status = 400;
    message = 'Invalid reference: related record was not found.';
    return { status, message };
  }

  // MySQL duplicate entry
  if (err?.parent?.errno === 1062) {
    status = 409;
    message = 'Duplicate entry detected.';
    return { status, message };
  }

  // Fallback to generic message
  if (err.message) {
    message = err.message;
  }
  return { status, message };
}

function handleRouteError(c, contextMessage, err, extra = {}) {
  const { status, message } = mapSequelizeError(err);
  console.error(`${contextMessage}:`, err);
  // Include extra context for debugging (not exposing internals to clients)
  return c.json({ success: false, message, ...extra }, status);
}

module.exports = { mapSequelizeError, handleRouteError };

