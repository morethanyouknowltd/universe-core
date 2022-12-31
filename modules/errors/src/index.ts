export class NotFoundError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class ConflictError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

export class BadRequestError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'BadRequestError'
  }
}

export class InternalServerError extends Error {
  constructor(message?: string) {
    super(message)
    this.name = 'InternalServerError'
  }
}

export function assert(
  condition: boolean,
  message?: string
): condition is true {
  if (!condition) {
    throw new Error(message ?? 'Assertion failed')
  }
  return condition
}

export function assertIsDefined<T>(
  value: T | undefined,
  message?: string
): value is T {
  return assert(typeof value !== undefined, message ?? 'Value is undefined')
}

export class ApiError extends Error {}

export function isApiError<E extends Error>(error: E) {
  return error instanceof ApiError
}

/** Use this if you want your assertion to be publically viewable in user-facing code */
export function apiAssert(
  condition: boolean,
  message?: string
): condition is true {
  if (!condition) {
    throw new ApiError(message ?? 'Assertion failed')
  }
  return condition
}
