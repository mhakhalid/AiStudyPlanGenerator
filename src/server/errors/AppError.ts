export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = "INTERNAL_ERROR"
  ) {
    super(message);
    this.name = "AppError";
    // Restore prototype chain for instanceof checks across transpilation boundaries
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
