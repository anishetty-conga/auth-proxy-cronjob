import util from "node:util";
import childProcess from "node:child_process";
import chalk from "chalk";

import secrets from "../secrets.js";

const exec = util.promisify(childProcess.exec);

const getAllNamespacedTenants = async () => {
  try {
    const { err, stdout, stderr } = await exec(
      `kubectl get ns --kubeconfig=${process.argv[2]}-${secrets.CONFIG_FILE_NAME} -o=jsonpath='{.items[*].metadata.name}'`
    );
    if (err) {
      throw new Error(err);
    }
    if (stderr) {
      throw new Error(stderr);
    }
    const tenants = await filterNameSpaceAndTenants(stdout);
    return tenants;
  } catch (err) {
    console.log(chalk.bold.red(err));
  }
};

const filterNameSpaceAndTenants = async (rawNamespaces) => {
  try {
    const namespaces = rawNamespaces.split(" ");

    const filteredNamespaces = namespaces.filter((namespace) =>
      secrets.NAMESPACE_NEEDED_PREFIX.split(" ").some((namespaceName) =>
        namespace.includes(namespaceName)
      )
    );

    const allTenanats = new Set();

    secrets.NAMESPACE_NEEDED_PREFIX.split(" ").forEach((namespacePrefix) => {
      filteredNamespaces.forEach((namespace) => {
        if (namespace.includes(namespacePrefix)) {
          allTenanats.add(namespace.split(`${namespacePrefix}-`)[1]);
        }
      });
    });

    return Array.from(allTenanats);
  } catch (err) {
    console.log(chalk.bold.red(err));
  }
};

export default getAllNamespacedTenants;
