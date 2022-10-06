import k8s from "@kubernetes/client-node";

import { getPodDetails, curlPods } from "./index.js";
import secrets from "./../secrets.js";

const authProxyCheck = async (tenant, globalPodFails) => {
  const kc = new k8s.KubeConfig();
  kc.loadFromFile(`${process.argv[2]}-${secrets.CONFIG_FILE_NAME}`);

  const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

  const errorPods = [];
  let podResAck = [];

  const podDetails = await getPodDetails(k8sApi, kc, tenant);

  if (podDetails) {
    podResAck = [...podDetails];
    await curlPods(kc, podDetails, errorPods, podResAck, globalPodFails);
  }
};

export default authProxyCheck;
