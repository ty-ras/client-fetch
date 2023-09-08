/**
 * @file This file contains tests for file `../internal.ts`.
 */

import test, { ExecutionContext } from "ava";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type * as _ from "../fetch"; // Otherwise TS-Node will not work
import * as spec from "../internal";
import type * as types from "../client.types";

const invokeValidate = (
  c: ExecutionContext,
  opts: types.HTTPEndpointCallerArgs,
  expectedURLString: ReturnType<typeof spec.validateBaseURL>,
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
  {
    commonPathPrefix: "",
    origin: "https://localhost",
  },
);

test(
  "Validate that input validation accepts option parameter with port",
  invokeValidate,
  {
    scheme: "https",
    host: "localhost",
    port: 1234,
  },
  {
    commonPathPrefix: "",
    origin: "https://localhost:1234",
  },
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
  {
    commonPathPrefix: "/prefix",
    origin: "https://localhost:1234",
  },
);

test(
  "Validate that input validation recognizes common path prefix from string parameter",
  invokeValidate,
  "http://localhost/the-prefix",
  {
    commonPathPrefix: "/the-prefix",
    origin: "http://localhost",
  },
);
