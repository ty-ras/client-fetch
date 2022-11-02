export type HTTPEndpointCallerArgs = string | HTTPEndpointCallerOptions;

export interface HTTPEndpointCallerOptions {
  scheme: string;
  host: string;
  port?: number;
  // Including first forward-slash
  path?: string;
}

export const validateBaseURL = (args: HTTPEndpointCallerArgs) => {
  const baseURLString =
    typeof args === "string"
      ? args
      : `${args.scheme}://${args.host}${"port" in args ? `:${args.port}` : ""}${
          args.path ?? ""
        }`;

  return {
    baseURLString,
    // Validate by trying to construct URL object
    baseURLObject: new URL(baseURLString),
  };
};
