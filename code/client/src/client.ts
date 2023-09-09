/**
 * @file This file contains function to create {@link dataFE.CallHTTPEndpoint} which will use `fetch` API to do the requests.
 */

import * as data from "@ty-ras/data";
import * as dataFE from "@ty-ras/data-frontend";
import type * as types from "./client.types";
import * as internal from "./internal";

/**
 * This function will create a {@link dataFE.CallHTTPEndpoint} callback which is locked on certain backend (scheme, hostname, etc).
 * It will throw whatever {@link URL} constructors throws if provided with invalid backend information.
 * @param callerArgs The {@link HTTPEndpointCallerArgs}: either base URL string, or structured information about the scheme, hostname, etc of the backend.
 * @returns A {@link dataFE.CallHTTPEndpoint} callback which can be used to create instances of {@link dataFE.APICallFactoryBase}.
 * It will throw {@link errors.InvalidPathnameError} or {@link errors.Non2xxStatusCodeError} if invoked with wrong arguments, and also whatever the {@link URL} constructor might throw on invalid URLs.
 */
export const createCallHTTPEndpoint = (
  callerArgs: types.HTTPEndpointCallerArgs,
): dataFE.CallHTTPEndpoint => {
  // If some garbage provided as args, then this will throw
  const { origin, commonPathPrefix } = internal.validateBaseURL(callerArgs);
  const allowProtoProperty =
    typeof callerArgs == "string"
      ? false
      : callerArgs.allowProtoProperty === true;
  const reviver = data.getJSONParseReviver(allowProtoProperty);
  return async ({ headers, url, method, query, ...args }) => {
    const body = "body" in args ? JSON.stringify(args.body) : undefined;

    const urlObject = constructURLObject(origin, commonPathPrefix, url, query);

    const response = await fetch(
      urlObject,
      getFetchArgs(method, body, headers),
    );

    const { status, headers: responseHeaders } = response;
    if (status < 200 || status >= 300) {
      throw new dataFE.Non2xxStatusCodeError(status);
    }

    const bodyString = await response.text();
    const headersObject = Object.fromEntries(responseHeaders.entries());
    return {
      body: bodyString.length > 0 ? JSON.parse(bodyString, reviver) : undefined,
      // TODO multiple entries with same header name!
      ...(Object.keys(headersObject).length > 0
        ? { headers: headersObject }
        : {}),
    };
  };
};

const getFetchArgs = (
  method: string,
  body: string | undefined,
  headers: Record<string, unknown> | undefined,
): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: ENCODER.encode(body) }),
  headers:
    dataFE.getOutgoingHeaders(
      {
        // Notice that we allow overriding these specific headers with values in 'headers' below.
        // This is only because this callback is used in tests, and they require such functionality.
        // In reality, the spread of 'headers' should come first, and only then the headers related to body.
        // Even better, we should delete the reserved header names if body is not specified.
        ...(body === undefined
          ? {}
          : {
              ["Content-Type"]: `application/json; charset=${ENCODER.encoding}`,
            }),
        ...headers,
      },
      true,
    ) ?? {}, // This is not really necessary but the dataFE.getOutgoingHeaders needs more overloads to signal that when input is not undefined, the result won't be either
});

const constructURLObject = (
  origin: string,
  commonPathPrefix: string,
  path: string,
  query: Record<string, unknown> | undefined,
) => {
  const pathname = dataFE.ensurePathname(`${commonPathPrefix}${path}`);
  const urlObject = new URL(pathname, origin);

  if (query) {
    urlObject.search = dataFE.getURLSearchParams(query).toString();
  }

  return urlObject;
};

const ENCODER = new TextEncoder();
