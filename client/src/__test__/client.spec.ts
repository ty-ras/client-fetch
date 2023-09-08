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
  callHttpInstance?: typeof callHttp,
) => {
  c.plan(2);
  resetState();
  returnedResponses.push(mockedFetchResponse);
  const result = await (callHttpInstance ?? callHttp)(input);
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

test.serial(
  "Validate that callHttp escapes invalid pathname",
  validateSuccessfulInvocation,
  { method: "GET", url: "/path?query=not-allowed#hash-not-allowed-either" },
  { body: undefined },
  "",
  {
    url: `${fetchInputURL}path%3Fquery=not-allowed%23hash-not-allowed-either`,
    opts: {
      method: "GET",
      headers: {},
    },
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

test.serial(
  "Validate that callHttp by default doesn't deserialize __proto__ properties",
  validateSuccessfulInvocation,
  { method: "GET", url: "/" },
  { body: { testProperty: "yes" } },
  JSON.stringify({ __proto__: "Injected", testProperty: "yes" }),
  { url: fetchInputURL, opts: { method: "GET", headers: {} } },
);

test.serial(
  "Validate that callHttp deserializes __proto__ property when instructed",
  validateSuccessfulInvocation,
  { method: "GET", url: "/" },
  { body: { __proto__: "Injected", testProperty: "yes" } },
  JSON.stringify({ __proto__: "Injected", testProperty: "yes" }),
  { url: "http://example.com/", opts: { method: "GET", headers: {} } },
  spec.createCallHTTPEndpoint({
    scheme: "http",
    host: "example.com",
    allowProtoProperty: true,
  }),
);

type MockedFetchResponses = Array<string | Response>;
type ExpectedFetchInputs = Array<{ url: string; opts: MockRequest }>;
