declare module 'twitch-m3u8' {
  export function getStream(channelName: string): Promise<{ url: string }[]>;
  const twitch: {
    getStream(channelName: string): Promise<{ url: string }[]>;
  };
  export default twitch;
}
