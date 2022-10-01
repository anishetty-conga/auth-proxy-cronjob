import util from "node:util";
import childProcess from "node:child_process";
import chalk from "chalk";

const exec = util.promisify(childProcess.exec);

const switchContext = async (contextName) => {
  try {
    const { err, stdout, stderr } = await exec(
      `kubectl config --kubeconfig=config.yaml use-context ${contextName}`
    );
    if (err) {
      throw new Error(err);
    }
    if (stderr) {
      throw new Error(stderr);
    }
    console.log(chalk.green(stdout));
    if (stdout) {
      return true;
    }
  } catch (err) {
    console.log(chalk.bold.red(err));
  }
};

export default switchContext;
