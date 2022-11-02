import type * as feCommon from "@ty-ras/data-frontend";
import * as errors from "./errors";
import * as input from "./input";

export const createCallHTTPEndpoint = (
  args: input.HTTPEndpointCallerArgs,
): feCommon.CallHTTPEndpoint => {
  // If some garbage provided as schemeHostAndPort, then this will throw
  const { baseURLString, baseURLObject } = input.validateBaseURL(args);
  return async ({ headers, url, method, query, ...args }) => {
    const body = "body" in args ? JSON.stringify(args.body) : undefined;

    const urlObject = new URL(`${baseURLString}${url}`);
    if (
      // This will cover situation when no path name is passed as input and base URL object just magically creates '/' as its pathname
      urlObject.pathname !== baseURLObject.pathname &&
      // This will cover when user tries to glue e.g. query string at the end of URL
      urlObject.pathname != `${baseURLObject.pathname}${url}`
    ) {
      throw new errors.InvalidPathnameError(url);
    }
    if (query) {
      urlObject.search = new URLSearchParams(
        Object.entries(query)
          .filter(([, value]) => value !== undefined)
          .flatMap<[string, string]>(([qKey, qValue]) =>
            Array.isArray(qValue)
              ? qValue.map<[string, string]>((value) => [qKey, `${value}`])
              : [[qKey, `${qValue}`]],
          ),
      ).toString();
    }

    const response = await fetch(urlObject, {
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

    // Will throw (TODO verify this) on any response which code is not >= 200 and < 300.
    // So just verify that it is one of the OK or No Content.
    const { status, headers: responseHeaders } = response;
    if (status !== 200 && status !== 204) {
      throw new errors.Non2xxStatusCodeError(status);
    }

    const bodyString = await response.text();
    const headersObject = Object.fromEntries(responseHeaders.entries());
    return {
      body: bodyString.length > 0 ? JSON.parse(bodyString) : undefined,
      // TODO multiple entries with same header name!
      ...(Object.keys(headersObject).length > 0
        ? { headers: headersObject }
        : {}),
    };
  };
};
