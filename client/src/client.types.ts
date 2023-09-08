/**
 * @file This file contains type definitions related to using TyRAS HTTP client callback with `fetch` API.
 */

/**
 * This type is the argument of {@link createCallHTTPEndpoint}.
 * It can be either string, which is then interpreted as full URL.
 * Alternatively, it can be a structured object {@link HTTPEndpointCallerArgs}.
 */
export type HTTPEndpointCallerArgs = string | HTTPEndpointCallerOptions;

/**
 * This type is the structured version of URL string passed to {@link createCallHTTPEndpoint}.
 */
export interface HTTPEndpointCallerOptions {
  /**
   * Which scheme should be used for URL.
   * Typically either `http` or `https`.
   */
  scheme: string;
  /**
   * The host name of the backend HTTP endpoints.
   */
  host: string;
  /**
   * The optional port to use.
   */
  port?: number;

  /**
   * The optional path prefix for backend HTTP endpoints.
   * If provided, typically should include the last `/` character - the given URL paths will be concatenated directly after this without putting any logic in concatenation.
   */
  path?: string;

  /**
   * If set to `true`, will NOT strip the `__proto__` properties of the result.
   */
  allowProtoProperty?: boolean;
}
