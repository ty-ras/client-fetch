/**
 * @file This file contains tests for file `../errors.ts`.
 */

import test from "ava";
import * as spec from "../errors";

test("Validate that isInvalidPathnameError method works", (c) => {
  c.plan(3);
  c.true(
    spec.isInvalidPathnameError(
      new spec.InvalidPathnameError("/path?query=something"),
    ),
  );
  c.false(spec.isInvalidPathnameError(new spec.Non2xxStatusCodeError(0)));
  c.false(spec.isInvalidPathnameError(new Error()));
});

test("Validate that isNon2xxStatusCodeError method works", (c) => {
  c.plan(3);
  c.true(spec.isNon2xxStatusCodeError(new spec.Non2xxStatusCodeError(999)));
  c.false(
    spec.isNon2xxStatusCodeError(
      new spec.InvalidPathnameError("/path?query=something"),
    ),
  );
  c.false(spec.isNon2xxStatusCodeError(new Error()));
});
