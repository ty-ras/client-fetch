import test, { ExecutionContext } from "ava";
import * as spec from "../input";

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
