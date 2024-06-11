#!/usr/bin/env -S ts-node --esm

import argparse, { ArgumentParser } from "argparse";
import { FakeM3uGenerator } from "./FakeM3uGenerator.js";

/**
 * Generate a m3u playlist file with the given number of channels and optional headers
 *
 * Usage:
 *   ./generateM3uFile.ts -c 100 -h > tests/fixtures/c100-h.m3u8
 *   ./generateM3uFile.ts --channels 100 --headers > tests/fixtures/c100-h.m3u8
 */
const parser = new ArgumentParser({
  description: "Generate playlist m3u file",
});

parser.add_argument("-c", "--channels", {
  help: "Number of channels to generate",
  required: true,
});
parser.add_argument("-H", "--headers", {
  help: "If it should include headers",
  action: argparse.BooleanOptionalAction,
});
const { channels: numberOfChannels, headers } = parser.parse_args();

const playlistString = new FakeM3uGenerator().generate(
  numberOfChannels,
  headers
);

// @ts-ignore
process.stdout.write(playlistString + "\n");
