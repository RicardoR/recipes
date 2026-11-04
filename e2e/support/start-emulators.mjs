#!/usr/bin/env node
/**
 * Wrapper around `firebase emulators:start` used by the e2e `webServer` (issue #56).
 *
 * When Playwright stops the web server, firebase-tools exits without taking the Firestore JVM
 * emulator with it, so the next run fails with "Could not start Database/Cloud Firestore Emulator,
 * port taken". Freeing the emulator ports before starting (and once firebase exits) keeps
 * consecutive `yarn e2e` runs reproducible.
 */
import { execFileSync, spawn } from 'node:child_process';
import process from 'node:process';

const EMULATOR_PORTS = [9099, 8080, 9199];
const FIREBASE_CLI = process.platform === 'win32' ? 'firebase.cmd' : './node_modules/.bin/firebase';

function pidsOn(port) {
  try {
    const output = execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], {
      encoding: 'utf8',
    });
    return output
      .split('\n')
      .map((line) => Number.parseInt(line.trim(), 10))
      .filter(Number.isInteger);
  } catch {
    // lsof exits with code 1 when nothing is listening on the port.
    return [];
  }
}

function freePorts() {
  for (const port of EMULATOR_PORTS) {
    for (const pid of pidsOn(port)) {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {
        // The process is already gone.
      }
    }
  }
}

freePorts();

const child = spawn(
  FIREBASE_CLI,
  ['emulators:start', '--project', 'demo-recipes', '--only', 'auth,firestore,storage,ui'],
  { stdio: 'inherit' },
);

let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (stopping) {
      return;
    }
    stopping = true;
    child.kill(signal);
  });
}

child.on('exit', (code, signal) => {
  freePorts();
  process.exit(signal ? 0 : (code ?? 0));
});

child.on('error', (error) => {
  console.error(`Could not start the Firebase emulators: ${error.message}`);
  freePorts();
  process.exit(1);
});
