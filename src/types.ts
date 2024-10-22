export type M3uHeaders = {
  [key: string]: string | undefined;
  xTvgUrl?: string;
  urlTvg?: string;
};

// TODO: Add known
export type M3uDirectives = Record<string, string>;

export type M3uPlaylist = {
  channels: M3uChannel[];
  headers?: M3uHeaders;
  directives?: M3uDirectives;
};

export type M3uChannel = {
  tvgId?: string;
  tvgName?: string;
  tvgLanguage?: string;
  tvgLogo?: string;
  tvgUrl?: string;
  tvgRec?: string;
  tvgChno?: string;
  groupTitle?: string;
  url?: string;
  name?: string;
  timeshift?: string;
  catchup?: string;
  duration?: number;
  catchupDays?: string;
  catchupSource?: string;
  extras?: Record<string, string | undefined>;
};
