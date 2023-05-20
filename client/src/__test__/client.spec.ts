/**
 * @file This file contains tests for file `../client.ts`.
 */

import test, { ExecutionContext } from "ava";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type * as _ from "../fetch"; // Otherwise TS-Node will not work
import * as spec from "../client";
import * as errors from "../errors";
// Notice that using fetch-mock forces downgrade of node-fetch to 2.x series.
// This is because fetch-mock uses 'require' to load node-fetch, and versions 3.x of node-fetch do not support that.
import fetchMock, { type MockRequest } from "fetch-mock";
import * as data from "@ty-ras/data-frontend";

// If we don't do this, fetch-mock will attempt to perform some of its own things onto returned response.
fetchMock.config.Response = Response;

const mockURL = "http://example.com/prefix";
const fetchInputURL = `${mockURL}/`;
const callHttp = spec.createCallHTTPEndpoint(mockURL);

// We have to do this horrible solution because fetch-mock has some internal state, and after adding enough tests, even with test.serial, the library spastically starts to fail.
const recordedCalls: ExpectedFetchInputs = [];
const returnedResponses: MockedFetchResponses = [];
let idx = 0;
fetchMock.mock({
  matcher: () => true,
  response: (url: string, opts: Request) => {
    const response = returnedResponses[idx++];
    recordedCalls.push({ url, opts });
    return typeof response === "string"
      ? new Response(Buffer.from(response))
      : response;
  },
});

const resetState = () => {
  idx = 0;
  recordedCalls.length = 0;
  returnedResponses.length = 0;
};

const validateSuccessfulInvocation = async (
  c: ExecutionContext,
  input: data.HTTPInvocationArguments,
  expectedResult: data.HTTPInvocationResult,
  mockedFetchResponse: MockedFetchResponses[number],
  expectedFetchInput: ExpectedFetchInputs[number],
) => {
  c.plan(2);
  resetState();
  returnedResponses.push(mockedFetchResponse);
  const result = await callHttp(input);
  c.deepEqual(result, expectedResult);
  c.deepEqual(recordedCalls, [expectedFetchInput]);
};

test.serial(
  "Validate that callHttp works correctly for empty response",
  validateSuccessfulInvocation,
  { method: "GET", url: "/" },
  { body: undefined },
  "",
  {
    url: fetchInputURL,
    opts: {
      method: "GET",
      headers: {},
    },
  },
);

test.serial(
  "Validate that callHttp works correctly for JSON response",
  validateSuccessfulInvocation,
  { method: "GET", url: "/" },
  { body: {} },
  "{}",
  {
    url: fetchInputURL,
    opts: {
      method: "GET",
      headers: {},
    },
  },
);

test.serial(
  "Validate that callHttp works correctly for input with query",
  validateSuccessfulInvocation,
  { method: "GET", url: "/", query: { parameter: "parameterValue" } },
  { body: undefined },
  "",
  {
    url: `${fetchInputURL}?parameter=parameterValue`,
    opts: {
      method: "GET",
      headers: {},
    },
  },
);

test.serial(
  "Validate that callHttp works correctly for input with query with arrays",
  validateSuccessfulInvocation,
  {
    method: "GET",
    url: "/",
    query: { parameter: ["parameterValue1", "parameterValue2"] },
  },
  { body: undefined },
  "",
  {
    url: `${fetchInputURL}?parameter=parameterValue1&parameter=parameterValue2`,
    opts: {
      method: "GET",
      headers: {},
    },
  },
);

test.serial(
  "Validate that callHttp works correctly for input with body",
  validateSuccessfulInvocation,
  { method: "POST", url: "/", body: { property: "value" } },
  { body: undefined },
  "",
  {
    url: fetchInputURL,
    opts: {
      method: "POST",
      body: '{"property":"value"}',
      headers: {
        "Content-Type": "application/json",
      },
    },
  },
);

test.serial(
  "Validate that callHttp works correctly for output with headers",
  validateSuccessfulInvocation,
  { method: "GET", url: "/" },
  { body: undefined, headers: { dummyheader: "dummyValue" } },
  new Response(Buffer.from(""), {
    headers: { dummyHeader: "dummyValue" },
  }),
  {
    url: fetchInputURL,
    opts: {
      method: "GET",
      headers: {},
    },
  },
);

test.serial("Validate that callHttp detects invalid pathname", async (c) => {
  c.plan(1);
  await c.throwsAsync(
    async () =>
      await callHttp({ method: "GET", url: "/path?query=not-allowed" }),
    {
      instanceOf: errors.InvalidPathnameError,
    },
  );
});

test.serial(
  "Validate that callHttp detects invalid pathname with hash",
  async (c) => {
    c.plan(1);
    await c.throwsAsync(
      async () =>
        await callHttp({ method: "GET", url: "/path#hash=not-allowed" }),
      {
        instanceOf: errors.InvalidPathnameError,
      },
    );
  },
);

test.serial(
  "Validate that callHttp detects non-200/204 status code",
  async (c) => {
    c.plan(2);
    resetState();
    returnedResponses.push(new Response(undefined, { status: 404 }));
    await c.throwsAsync(
      async () => await callHttp({ method: "GET", url: "/" }),
      {
        instanceOf: errors.Non2xxStatusCodeError,
      },
    );
    c.deepEqual(recordedCalls, [
      {
        url: fetchInputURL,
        opts: {
          method: "GET",
          headers: {},
        },
      },
    ]);
  },
);

type MockedFetchResponses = Array<string | Response>;
type ExpectedFetchInputs = Array<{ url: string; opts: MockRequest }>;
