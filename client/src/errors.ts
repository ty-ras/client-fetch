export class InvalidPathnameError extends Error {
  public constructor(public readonly pathname: string) {
    super(`Invalid pathname supplied: "${pathname}".`);
  }
}

export class Non2xxStatusCodeError extends Error {
  public constructor(public readonly statusCode: number) {
    super(`Status code ${statusCode} was returned.`);
  }
}

export const isInvalidPathnameError = (
  error: Error,
): error is InvalidPathnameError => error instanceof InvalidPathnameError;

export const isNon2xxStatusCodeError = (
  error: Error,
): error is Non2xxStatusCodeError => error instanceof Non2xxStatusCodeError;
