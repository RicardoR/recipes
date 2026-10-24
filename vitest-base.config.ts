import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    // The Angular unit-test builder defaults to `isolate: false` (Karma-like), which shares the
    // module registry across spec files. With that, a `vi.mock(...)` in one spec does not apply if
    // another spec already evaluated the mocked module (e.g. `firebase/auth` via AuthService),
    // so module mocking becomes execution-order dependent. Restoring Vitest's default isolation
    // keeps `vi.mock` deterministic for every spec file.
    isolate: true,
  },
});
