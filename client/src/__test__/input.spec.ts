/**
 * @file This file contains tests for input argument validation of {@link spec.createCallHTTPEndpoint}.
 */

import test, { ExecutionContext } from "ava";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type * as _ from "../fetch"; // Otherwise TS-Node will not work
import * as spec from "../client";

const invokeValidate = (
  c: ExecutionContext,
  opts: spec.HTTPEndpointCallerOptions,
  expectedURLString: string,
) => {
  c.plan(1);
  const baseURLString = spec.validateBaseURL(opts);
  c.deepEqual(baseURLString, expectedURLString);
};

test(
  "Validate that input validation accepts option parameter",
  invokeValidate,
  {
    scheme: "https",
    host: "localhost",
  },
  "https://localhost",
);

test(
  "Validate that input validation accepts option parameter with port",
  invokeValidate,
  {
    scheme: "https",
    host: "localhost",
    port: 1234,
  },
  "https://localhost:1234",
);

test(
  "Validate that input validation accepts option parameter with port and pathname",
  invokeValidate,
  {
    scheme: "https",
    host: "localhost",
    port: 1234,
    path: "/prefix",
  },
  "https://localhost:1234/prefix",
);
