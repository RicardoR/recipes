const fs = require('fs');
const path = require('path');

const dir = "src/environments";
const file = "environment.ts";
const prodFile = "environment.prod.ts";
const testFile = "environment.debugMode.ts";
const testEnvironmentFile = "environment.test.ts";

const content_env_prod = `${process.env.FIREBASE_DETAILS}`;
const content_env_test = `${process.env.FIREBASE_DETAILS_TEST}`;
const content_env_test_environment = `export const environment = {
  production: false,
  useEmulators: true,
  debugMode: false,
  firebase: {
    apiKey: 'fake-api-key',
    authDomain: 'localhost',
    projectId: 'demo-recipes',
    storageBucket: 'demo-recipes.appspot.com',
    messagingSenderId: '000000000000',
    appId: '1:000000000000:web:0000000000000000000000',
    measurementId: 'G-0000000000'
  },
};
`;
console.log(content_env_test);

fs.access(dir, fs.constants.F_OK, (err) => {
  if (err) {
    console.log("src doesn't exist, creating now", process.cwd());
    try {
      fs.mkdirSync(dir, { recursive: true });
    }
    catch (error) {
      console.log(`Error while creating ${dir}. Error is ${error}`);
      process.exit(1);
    }
  }
  try {
    fs.writeFileSync(dir + "/" + file, content_env_prod);
    fs.writeFileSync(dir + "/" + prodFile, content_env_prod);
    fs.writeFileSync(dir + "/" + testFile, content_env_test);
    fs.writeFileSync(dir + "/" + testEnvironmentFile, content_env_test_environment);
    console.log("Created successfully in", process.cwd());
    if (fs.existsSync(dir + "/" + file)) {
      console.log("Env File is created", path.resolve(dir + "/" + file));
    }
    if (fs.existsSync(dir + "/" + prodFile)) {
      console.log("Env Prod File is created", path.resolve(dir + "/" + prodFile));
    }
    if (fs.existsSync(dir + "/" + testFile)) {
      console.log("Env debug File is created", path.resolve(dir + "/" + testFile));
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
});
