import chalk from "chalk";
import { v4 as uuidv4 } from "uuid";

import util from "node:util";
import childProcess from "node:child_process";
import "dotenv/config";

const exec = util.promisify(childProcess.exec);

const curlPods = async (
  kc,
  podDetails,
  errorPods,
  podResAck,
  globalPodFails
) => {
  console.log(
    chalk.bgBlue.bold(
      `\nRunning auth proxy check on ${podDetails?.length} pods of both ls-data and ls-pricing namespaces....\n`
    )
  );
  console.log(
    chalk.bgGray("----------------------------------------------------------\n")
  );

  for (let [
    index,
    { podName, nodeName, namespace, id },
  ] of podDetails.entries()) {
    await addCurl(kc, namespace, podName, nodeName);
    await curlPod(
      kc,
      namespace,
      id,
      podName,
      nodeName,
      errorPods,
      index,
      podDetails.length,
      podResAck,
      globalPodFails
    );
  }
};

const curlPod = async (
  kc,
  namespace,
  id,
  podName,
  nodeName,
  errorPods,
  index,
  podDetailsLength,
  podResAck,
  globalPodFails
) => {
  try {
    const res = await exec(
      `kubectl exec -n ${namespace} ${podName} -c ${nodeName} --kubeconfig=config.yaml -- curl -v "http://localhost:8080/" --max-time ${process.env.CURL_TIMEOUT}`
    );
    const { err, stdout, stderr } = res;

    if (stderr) {
      console.log(
        chalk.green.bold.italic.underline(
          `\n${
            index + 1
          }) POD: ${podName} --> NODE: ${nodeName} --> NAMESPACE: ${namespace} --> CLUSTER: ${
            kc.currentContext
          }`
        )
      );
      console.log(chalk.bold(`${stdout}`));
      console.log(chalk.bold(`${stderr}`));
      console.log(
        chalk.bgGray(
          "----------------------------------------------------------\n"
        )
      );
      const ackIndex = podResAck.findIndex((pod) => pod.id === id);
      podResAck.splice(ackIndex, 1);
    }
    if (index + 1 === podDetailsLength && podResAck.length > 0) {
      errorPods = [...podResAck];
    }
    showErrorPodsAtEnd(errorPods, index, podDetailsLength);

    if (index + 1 === podDetailsLength && errorPods.length > 0) {
      globalPodFails = [...errorPods];
      return;
    }

    if (errorPods.length === 0 && index + 1 === podDetailsLength) {
      console.log(chalk.green.bold("\nNo pods failing auth proxy check\n"));
      return;
    }
  } catch (err) {
    console.error(
      chalk.bgRed.bold(
        ".............................ERROR..........................."
      )
    );
    console.log(
      chalk.red.bold.italic.underline(
        `\n${
          index + 1
        }) POD: ${podName} --> NODE: ${nodeName} --> NAMESPACE: ${namespace} --> CLUSTER: ${
          kc.currentContext
        }`
      )
    );
    console.log(chalk.red.bold(err));

    errorPods.push({
      nodeName,
      podName,
      namespace,
      id: uuidv4(),
      clusterName: kc.currentContext,
    });
    globalPodFails.push({
      nodeName,
      podName,
      namespace,
      id: uuidv4(),
      clusterName: kc.currentContext,
    });
    showErrorPodsAtEnd(errorPods, index, podDetailsLength);
  }
};

const addCurl = async (kc, namespace, podName, nodeName) => {
  try {
    const { stdout, stderr } = await exec(
      `kubectl exec -n ${namespace} ${podName} -c ${nodeName} --kubeconfig=config.yaml -- apk add curl`
    );
  } catch (err) {}
};

const showErrorPodsAtEnd = (errorPods, index, podDetailsLength) => {
  if (errorPods.length > 0 && index + 1 === podDetailsLength) {
    console.log(chalk.bold.red("\nError occured pods -"));
    for (let [index, { podName }] of errorPods.entries()) {
      console.log(chalk.bold.white(`${index + 1}. ${podName}`));
    }
  }
};

export default curlPods;
