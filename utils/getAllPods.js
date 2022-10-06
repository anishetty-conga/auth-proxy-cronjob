import util from "node:util";
import childProcess from "node:child_process";
import chalk from "chalk";

import secrets from "./../secrets.js";

const exec = util.promisify(childProcess.exec);

const getAllPods = async (namespacePrefix, tenant) => {
  const namespace = `${namespacePrefix}-${tenant}`;
  try {
    const { err, stdout, stderr } = await exec(
      `kubectl get pods --kubeconfig=${process.argv[2]}-${secrets.CONFIG_FILE_NAME} -n=${namespace} -o=jsonpath='{.items[*].metadata.name}'`
    );
    if (err) {
      throw new Error(err);
    }
    if (stderr) {
      throw new Error(stderr);
    }
    console.log(stdout);
  } catch (err) {
    console.log(chalk.bold.red(err));
  }
};

export default getAllPods;
