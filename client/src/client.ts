/**
 * @file This file contains function to create {@link feCommon.CallHTTPEndpoint} which will use `fetch` API to do the requests.
 */

import * as data from "@ty-ras/data";
import type * as feCommon from "@ty-ras/data-frontend";
import * as errors from "./errors";
import type * as types from "./client.types";
import * as internal from "./internal";

/**
 * This function will create a {@link feCommon.CallHTTPEndpoint} callback which is locked on certain backend (scheme, hostname, etc).
 * It will throw whatever {@link URL} constructors throws if provided with invalid backend information.
 * @param callerArgs The {@link HTTPEndpointCallerArgs}: either base URL string, or structured information about the scheme, hostname, etc of the backend.
 * @returns A {@link feCommon.CallHTTPEndpoint} callback which can be used to create instances of {@link feCommon.APICallFactoryBase}.
 * It will throw {@link errors.InvalidPathnameError} or {@link errors.Non2xxStatusCodeError} if invoked with wrong arguments, and also whatever the {@link URL} constructor might throw on invalid URLs.
 */
export const createCallHTTPEndpoint = (
  callerArgs: types.HTTPEndpointCallerArgs,
): feCommon.CallHTTPEndpoint => {
  // If some garbage provided as args, then this will throw
  const { origin, commonPathPrefix } = internal.validateBaseURL(callerArgs);
  const allowProtoProperty =
    typeof callerArgs == "string"
      ? true
      : callerArgs.allowProtoProperty === true;
  const reviver = data.getJSONParseReviver(allowProtoProperty);
  return async ({ headers, url, method, query, ...args }) => {
    const body = "body" in args ? JSON.stringify(args.body) : undefined;

    const urlObject = constructURLObject(origin, commonPathPrefix, url, query);

    const response = await fetch(
      urlObject,
      getFetchArgs(method, body, headers),
    );

    // Will throw (TODO verify this) on any response which code is not >= 200 and < 300.
    // So just verify that it is one of the OK or No Content.
    const { status, headers: responseHeaders } = response;
    if (status !== 200 && status !== 204) {
      throw new errors.Non2xxStatusCodeError(status);
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

const getURLSearchParams = (query: Record<string, unknown>) =>
  new URLSearchParams(
    Object.entries(query)
      .filter(([, value]) => value !== undefined)
      .flatMap<[string, string]>(([qKey, qValue]) =>
        Array.isArray(qValue)
          ? qValue.map<[string, string]>((value) => [qKey, `${value}`])
          : [[qKey, `${qValue}`]],
      ),
  ).toString();

const getFetchArgs = (
  method: string,
  body: string | undefined,
  headers: Record<string, unknown> | undefined,
): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body }),
  headers: {
    // Notice that we allow overriding these specific headers with values in 'headers' below.
    // This is only because this callback is used in tests, and they require such functionality.
    // In reality, the spread of 'headers' should come first, and only then the headers related to body.
    // Even better, we should delete the reserved header names if body is not specified.
    ...(body === undefined
      ? {}
      : {
          ["Content-Type"]: "application/json", // TODO ;charset=utf8 ?
          // ["Content-Length"]: `${body.byteLength}`,
          // ["Content-Encoding"]: encoding,
        }),
    ...headers,
  },
});

const constructURLObject = (
  origin: string,
  commonPathPrefix: string,
  path: string,
  query: Record<string, unknown> | undefined,
) => {
  const pathname = `${commonPathPrefix}${path}`.replaceAll(
    /\?|#/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  const urlObject = new URL(pathname, origin);

  if (query) {
    urlObject.search = getURLSearchParams(query);
  }

  return urlObject;
};
