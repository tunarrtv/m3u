import path from "path";
import fs from "fs/promises";
import { FakeM3uGenerator } from "./FakeM3uGenerator";

const channelCounts = [0, 1, 100, 500, 1000, 10_000, 100_000, 1_000_000];

const generator = new FakeM3uGenerator();

const outFiles: string[] = [];
for (const count of channelCounts) {
  const filename = `c${count}_h.m3u8`;
  outFiles.push(filename);
  const outPath = path.resolve(process.cwd(), "./tests/fixtures");
  const filepath = path.join(outPath, filename);
  console.log(`Writing m3u8 to ${filepath}`);
  await fs.writeFile(filepath, generator.generate(count, true));
}

const allFilesExport = `
const files = [${outFiles.map((file) => `"${file}"`)}];
export { files };
`;

await fs.writeFile(
  path.resolve(process.cwd(), "./tests/fixtures/files.ts"),
  allFilesExport.trim()
);
