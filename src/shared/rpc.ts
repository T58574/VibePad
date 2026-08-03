export type AppRPC = {
  requests: {
    readFile: (params: { path: string }) => Promise<{ content: string; encoding: string; lineEnding: 'CRLF' | 'LF' }>;
    writeFile: (params: { path: string; content: string }) => Promise<boolean>;
    getInitialFile: () => Promise<string | null>;
    runShell: (params: { cmd: string }) => Promise<string>;
    pipeAntigravity: (params: { prompt: string; selection: string }) => Promise<string>;
  };
  messages: {};
};
