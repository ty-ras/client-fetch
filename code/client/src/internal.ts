/**
 * @file This file exports internal functionality, so that they can be used in tests, but not by library consumers.
 */

import type * as types from "./client.types";

/**
 * This is exported for the tests only - it is not exported via index.ts
 * @param args The {@link HTTPEndpointCallerArgs}.
 * @returns The constructed URL string.
 */
export const validateBaseURL = (args: types.HTTPEndpointCallerArgs) => {
  const baseURLString =
    typeof args === "string"
      ? args
      : `${args.scheme}://${args.host}${"port" in args ? `:${args.port}` : ""}${
          args.path ?? ""
        }`;

  // Validate by trying to construct URL object
  const baseURL = new URL(baseURLString);
  return {
    origin: baseURL.origin,
    commonPathPrefix: baseURL.pathname.length > 1 ? baseURL.pathname : "",
  };
};
