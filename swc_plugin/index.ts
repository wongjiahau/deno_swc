import { prepare } from "../deps.ts";
import { ParseOptions } from "../types/options.ts";

const filenameBase = "deno_swc";

const PLUGIN_URL_BASE =
  "https://github.com/divy-work/deno_swc/releases/latest/download";

const isDev = Deno.env.get("DEV");

if (isDev) {
  let filenameSuffix = ".so";
  let filenamePrefix = "lib";

  if (Deno.build.os === "windows") {
    filenameSuffix = ".dll";
    filenamePrefix = "";
  }
  if (Deno.build.os === "darwin") {
    filenameSuffix = ".dylib";
  }

  const filename =
    `./target/debug/${filenamePrefix}${filenameBase}${filenameSuffix}`;

  // This will be checked against open resources after Plugin.close()
  // in runTestClose() below.
  const resourcesPre = Deno.resources();

  const rid = Deno.openPlugin(filename);
} else {
  const pluginId = await prepare({
    name: "deno_swc",
    printLog: true,
    checkCache: Boolean(Deno.env.get("CACHE")) || true,
    urls: {
      darwin: `${PLUGIN_URL_BASE}/lib${filenameBase}.dylib`,
      windows: `${PLUGIN_URL_BASE}/${filenameBase}.dll`,
      linux: `${PLUGIN_URL_BASE}/lib${filenameBase}.so`,
    },
  });
}

// @ts-ignore
const core = Deno.core as {
  ops: () => { [key: string]: number };
  setAsyncHandler(rid: number, handler: (response: Uint8Array) => void): void;
  dispatch(
    rid: number,
    msg: any,
    buf?: ArrayBufferView,
  ): Uint8Array | undefined;
};

const {
  parse,
  parse_ts
} = core.ops();

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

export function swc_parse(opt: ParseOptions) {
  const response = core.dispatch(parse, textEncoder.encode(JSON.stringify(opt)));
  return JSON.parse(textDecoder.decode(response));
}

export function swc_parse_ts(opt: ParseOptions) {
  const response = core.dispatch(parse_ts, textEncoder.encode(JSON.stringify(opt)));
  return JSON.parse(textDecoder.decode(response));
}

console.log(swc_parse_ts({ src: "const speed: number = 1;"}));
