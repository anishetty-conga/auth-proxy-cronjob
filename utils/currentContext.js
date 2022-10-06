import util from "node:util";
import childProcess from "node:child_process";
import chalk from "chalk";

import secrets from "../secrets.js";

const exec = util.promisify(childProcess.exec);

const currentContext = async () => {
  try {
    const { err, stdout, stderr } = await exec(
      `kubectl config --kubeconfig=${process.argv[2]}-${secrets.CONFIG_FILE_NAME} current-context`
    );
    if (err) {
      throw new Error(err);
    }
    if (stderr) {
      throw new Error(stderr);
    }
    console.log(chalk.bold.green(`Current context is: ${stdout}`));
  } catch (err) {
    console.log(chalk.bold.red(err));
  }
};

export default currentContext;
