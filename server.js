const fs = require('fs');
const path = require('path');

const dir = "src/environments";
const file = "environment.ts";
const prodFile = "environment.prod.ts";

const content = `${process.env.FIREBASE_DETAILS}`;
console.log(content);

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
    fs.writeFileSync(dir + "/" + file, content);
    fs.writeFileSync(dir + "/" + prodFile, content);
    console.log("Created successfully in", process.cwd());
    if (fs.existsSync(dir + "/" + file)) {
      console.log("Env File is created", path.resolve(dir + "/" + file));
      const str = fs.readFileSync(dir + "/" + file).toString();
      console.log(str);
    }
    if (fs.existsSync(dir + "/" + prodFile)) {
      console.log("Env Prod File is created", path.resolve(dir + "/" + prodFile));
      const str = fs.readFileSync(dir + "/" + prodFile).toString();
      console.log(str);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
});
