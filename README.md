# Typesafe REST API Specification - Typesafe Client With `fetch`

[![CI Pipeline](https://github.com/ty-ras/client-fetch/actions/workflows/ci.yml/badge.svg)](https://github.com/ty-ras/client-fetch/actions/workflows/ci.yml)
[![CD Pipeline](https://github.com/ty-ras/client-fetch/actions/workflows/cd.yml/badge.svg)](https://github.com/ty-ras/client-fetch/actions/workflows/cd.yml)

The Typesafe REST API Specification is a family of libraries used to enable seamless development of Backend and/or Frontend which communicate via HTTP protocol.
The protocol specification is checked both at compile-time and run-time to verify that communication indeed adhers to the protocol.
This all is done in such way that it does not make development tedious or boring, but instead robust and fun!

This particular repository contains library which implements typesafe HTTP invocation API of [`@ty-ras/data-frontent`](https://github.com/ty-ras/data) using [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).
- [`@ty-ras/client-fetch`](./code/client) contains code for creating callbacks implementing `CallHTTPEndpoint` using the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).