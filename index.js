#! /usr/bin/env node

import k8s from "@kubernetes/client-node";

import { getConfig } from "./utils/index.js";

const scriptStartTime = new Date().toLocaleTimeString();

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const main = async () => {
  await getConfig(scriptStartTime);
};

main();
