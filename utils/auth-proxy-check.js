import k8s from "@kubernetes/client-node";
import chalk from "chalk";

import { getPodDetails, curlPods } from "./index.js";

const authProxyCheck = async (tenant, globalPodFails) => {
  const kc = new k8s.KubeConfig();
  kc.loadFromFile("./config.yaml");

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
