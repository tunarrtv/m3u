import { M3uChannel, M3uHeaders, M3uPlaylist } from "./types";

const channelAttributeMap = {
  "tvg-id": "tvgId",
  "tvg-name": "tvgName",
  "tvg-language": "tvgLanguage",
  "tvg-logo": "tvgLogo",
  "tvg-url": "tvgUrl",
  "tvg-rec": "tvgRec",
  "group-title": "groupTitle",
  timeshift: "timeshift",
  catchup: "catchup",
  "catchup-days": "catchupDays",
  "catchup-source": "catchupSource",
} as const;

const headerAttributeMap = {
  "x-tvg-url": "xTvgUrl",
  "url-tvg": "urlTvg",
} as const;

enum CurrentSection {
  Header = 0,
  Channel = 1,
  Http = 2,
}

const COMMENT = "#";
const EXT = "EXT";
const M3U = "M3U";
const INF = "INF:";

export function parseM3U(m3uFileContents: string): M3uPlaylist {
  const channels: M3uChannel[] = [];
  let headers: M3uHeaders = {};
  const directives: Record<string, string> = {};

  let currentPosition = 0;
  let currentChannel: M3uChannel | null = null;
  let currentSection: CurrentSection | null = null;

  while (currentPosition < m3uFileContents.length) {
    while (
      m3uFileContents.charAt(currentPosition) === " " ||
      m3uFileContents.charAt(currentPosition) === "\t"
    ) {
      currentPosition++;
    }

    let eol = m3uFileContents.indexOf("\n", currentPosition + 1);

    if (eol === -1) {
      eol = m3uFileContents.length;
    }

    let line = m3uFileContents.slice(currentPosition, eol);

    // Precaution
    if (line.length === 0) {
      continue;
    }

    let firstChar = line.charAt(0);
    while (
      firstChar === "\n" ||
      firstChar === "\r" ||
      firstChar === "\t" ||
      firstChar === " "
    ) {
      line = line.slice(1);
      firstChar = line.charAt(0);
    }

    if (firstChar === COMMENT) {
      // Comment
      // String slice is O(1) in V8 (https://mrale.ph/blog/2016/11/23/making-less-dart-faster.html)
      if (line.slice(1, 4) === EXT) {
        if (line.slice(4, 8) === INF) {
          currentSection = CurrentSection.Channel;
          const channel = parseChannelDirective(line);
          if (channel) {
            currentChannel = channel;
          }
          currentPosition = eol + 1;
          continue;
        } else if (line.slice(4, 7) === M3U) {
          currentSection = CurrentSection.Header;
          const [kv, unknown] = parseKeyVal(
            line,
            8,
            line.length,
            headerAttributeMap
          );
          headers = { ...kv, ...unknown };
        } else if (
          // Directives
          currentSection === CurrentSection.Header &&
          line.slice(4, 6) === "-X"
        ) {
          const sep = line.lastIndexOf(":");
          if (sep !== -1) {
            directives[line.slice(5, sep)] = line.slice(sep + 1);
          } else {
            directives[line.slice(5)] = "";
          }
        } else {
          // Regular comment.
          currentPosition = eol + 1;
          continue;
        }
      }
    }

    if (currentSection === CurrentSection.Channel && currentChannel) {
      if (line.charAt(0) === "#") {
        // comment or extension...
        if (line.slice(1, 4) === EXT || line.slice(1, 9) === "PLAYLIST") {
        }
      } else {
        // This could be a URL or filepath
        currentChannel.url = line;
        channels.push(currentChannel);
        currentChannel = null;
      }
    }

    currentPosition = eol + 1;
  }

  return {
    channels,
    headers,
    directives,
  };
}

function parseChannelDirective(line: string): M3uChannel | undefined {
  let lineDetails = line.slice(8);

  let currentPosition = 0;
  let channel: M3uChannel | undefined;
  while (currentPosition < lineDetails.length) {
    if (
      lineDetails[currentPosition] === " " ||
      lineDetails[currentPosition] === "\t"
    ) {
      lineDetails = lineDetails.slice(currentPosition);
      currentPosition++;
    } else {
      break;
    }
  }

  // duration
  const nextSpace = lineDetails.indexOf(" ", currentPosition);
  const nextComma = lineDetails.indexOf(",", currentPosition);
  const nextDelim = Math.min(nextSpace, nextComma);
  const durstr = lineDetails.slice(currentPosition, nextDelim);
  const duration = parseInt(durstr);

  if (nextDelim === nextComma) {
    currentPosition = nextComma + 1;
    channel = {
      duration: isNaN(duration) ? -1 : duration,
    };
  } else {
    const [keyval, unknown, pos] = parseKeyVal(
      lineDetails,
      nextSpace + 1,
      lineDetails.length,
      channelAttributeMap
    );

    currentPosition = pos + 1;

    channel = {
      duration: isNaN(duration) ? -1 : duration,
      ...keyval,
    };

    if (unknown) {
      channel.extras = unknown;
    }
  }

  while (
    lineDetails[currentPosition] === " " ||
    lineDetails[currentPosition] === "\t"
  ) {
    currentPosition++;
  }

  channel.name = lineDetails.slice(currentPosition);

  return channel;
}

function parseKeyVal<OutKeyType extends string = string>(
  line: string,
  start: number,
  end: number = line.length,
  keyTranslationMap: Record<string, OutKeyType> = {}
): [Record<OutKeyType, string>, Record<string, string> | undefined, number] {
  let pos = start;
  end ??= line.length;
  const keyval: Record<OutKeyType, string> = {} as Record<OutKeyType, string>;
  // Hack so we dont need to check Object.keys to find and length and preserve
  // length == 0 => undefined behavior from original impl
  let unknownLength = 0;
  const unknown: Record<string, string> = {};
  while (pos < end) {
    if (line.charAt(pos) === " ") {
      pos++;
      continue;
    }

    const sep = line.indexOf("=", pos);
    if (sep === -1) {
      break;
    }

    const key = line.slice(pos, sep);
    if (line.charAt(sep + 1) === '"') {
      const end = line.indexOf('"', sep + 2);
      if (end > -1) {
        const value = line.slice(sep + 2, end);
        const translated = keyTranslationMap[key];
        if (translated) {
          keyval[keyTranslationMap[key]] = value;
        } else {
          unknownLength++;
          unknown[key] = value;
        }
      }

      pos = end + 1;
      continue;
    }

    pos++;
  }

  return [keyval, unknownLength === 0 ? undefined : unknown, pos] as const;
}
