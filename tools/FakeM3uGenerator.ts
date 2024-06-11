import { M3uPlaylist } from "../src/types";
import { writeM3U } from "../src/writer";

export class FakeM3uGenerator {
  generate(num: number, includeHeaders: boolean = false) {
    const channels = this.createFakeChannel(num);

    const playlist: M3uPlaylist = {
      channels,
    };

    if (includeHeaders) {
      playlist.headers = {
        "x-tvg-url": "http://example.com/tvg.xml",
      };
    }

    return writeM3U(playlist);
  }

  private createFakeChannel(count: number) {
    const channels: any = [];
    for (let i = 0; i < count; i++) {
      channels.push({
        name: `Channel ${i}`,
        url: `http://example.com/${i}`,
        tvgName: `Channel ${i}`,
        tvgId: `channel${i}.uk`,
        tvgLogo: `http://example.com/${i}.png`,
        groupTitle: `Group ${i}`,
      });
    }
    return channels;
  }
}
