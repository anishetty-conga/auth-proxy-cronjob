import util from "node:util";
import childProcess from "node:child_process";
import chalk from "chalk";

const exec = util.promisify(childProcess.exec);

const currentContext = async () => {
  try {
    const { err, stdout, stderr } = await exec(
      `kubectl config --kubeconfig=config.yaml current-context`
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
