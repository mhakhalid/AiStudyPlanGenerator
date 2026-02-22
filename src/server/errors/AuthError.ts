import { AppError } from "./AppError";

export class AuthError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "AuthError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
