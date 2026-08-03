export default {
  app: {
    name: "VibePad",
    identifier: "com.vibepad.app",
    version: "1.0.0",
  },
  build: {
    bun: {
      entrypoint: "src/main/index.ts",
    },
    views: {
      mainview: {
        entrypoint: "dist/index.html",
      },
    },
  },
};
