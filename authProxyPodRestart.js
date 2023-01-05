import k8s from "@kubernetes/client-node";
import AWS from "aws-sdk";
import fs from "fs";
import chalk from "chalk";
import util from "node:util";
import childProcess from "node:child_process";

import secrets from "./secrets.js";
import { switchContext } from "./utils/index.js";
import sendAuthProxyMessage from "./utils/teams/sendAuthProxyMessage.js";

const s3 = new AWS.S3({
  accessKeyId: secrets.AWS_ACCESS_KEY_ID,
  secretAccessKey: secrets.AWS_SECRET_ACCESS_KEY,
  region: secrets.AWS_REGION,
});
const params = {
  Bucket: secrets.AWS_BUCKET_NAME,
  Key: secrets.AWS_FILE_KEY,
};
const exec = util.promisify(childProcess.exec);

const scriptStartTime = new Date().toLocaleTimeString();

const sleep = (ms = 2000) => new Promise((resolve) => setTimeout(resolve, ms));

const authPoxyPodRestart = async () => {
  try {
    s3.getObject(params, async (err, data) => {
      if (err) {
        throw new Error(err);
      } else {
        fs.writeFileSync(
          `${process.argv[2]}-${secrets.CONFIG_FILE_NAME}`,
          data.Body
        );
        console.log(
          chalk.green(
            `Imported ${process.argv[2]}-${secrets.CONFIG_FILE_NAME} from S3`
          )
        );
        if (secrets.CLUSTERS[process.argv[2]]?.length > 0) {
          for (let clusterName of secrets.CLUSTERS[process.argv[2]]) {
            await switchContext(clusterName);
            try {
              const res = await exec(
                `kubectl get pods -n=${
                  clusterName === "uss-env-manager-iks-app-700"
                    ? "env-manager"
                    : "monitoring"
                } --kubeconfig=${process.argv[2]}-${
                  secrets.CONFIG_FILE_NAME
                } -o=jsonpath='{.items[*].metadata.name}`
              );
              const { err, stdout, stderr } = res;
              if (err) {
                throw new Error(err);
              }
              if (stderr) {
                throw new Error(stderr);
              }
              const pods = stdout
                .split(" ")
                .filter((pod) => pod.includes("auth-proxy"));
              console.log(pods);
              for (let podName of pods) {
                const kc = new k8s.KubeConfig();
                kc.loadFromFile(
                  `${process.argv[2]}-${secrets.CONFIG_FILE_NAME}`
                );
                const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
                try {
                  const res = await k8sApi.deleteNamespacedPod(
                    podName,
                    clusterName === "uss-env-manager-iks-app-700"
                      ? "env-manager"
                      : "monitoring"
                  );
                  if (res?.response?.statusCode === 200) {
                    console.log(chalk.green.bold(`Deleted pod ${podName}\n`));
                  } else {
                    console.log(
                      chalk.red.bold(`Error deleting pod ${podName}\n`)
                    );
                  }
                } catch (err) {
                  console.log(
                    chalk.red.bold(
                      `${err.message}\n` || `Error deleting pod ${podName}\n`
                    )
                  );
                }

                await sleep(1 * 60 * 1000);
              }
            } catch (err) {
              console.log(chalk.bold.red(err));
            }
          }
          await sendAuthProxyMessage(scriptStartTime);
        }
      }
    });
  } catch (err) {
    console.log(chalk.bold.red(err));
  }
};

authPoxyPodRestart();
