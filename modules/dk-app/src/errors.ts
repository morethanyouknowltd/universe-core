export class ClientSafeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ClientSafeError'
  }
}

export class NotFoundError extends ClientSafeError {
  constructor(message?: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends ClientSafeError {
  constructor(message?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class ConflictError extends ClientSafeError {
  constructor(message?: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

export class BadRequestError extends ClientSafeError {
  constructor(message?: string) {
    super(message)
    this.name = 'BadRequestError'
  }
}

export class InternalServerError extends ClientSafeError {
  constructor(message?: string) {
    super(message)
    this.name = 'InternalServerError'
  }
}
