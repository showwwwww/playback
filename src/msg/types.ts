import type { ChannelMeta } from '@/channel';

export interface Meta extends ChannelMeta {
  changePlayback: {
    parameters: { playbackRate: number };
    response: void;
  };
  getURI: {
    parameters: {};
    response: { href: string; hostname: string };
  };
}
