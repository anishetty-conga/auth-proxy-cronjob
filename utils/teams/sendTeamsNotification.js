import { IncomingWebhook } from "ms-teams-webhook";

import secrets from "../../secrets.js";

const webhook = new IncomingWebhook(secrets.TEAMS_WEBHOOK);

const sendTeamsNotification = async (
  startTime = "Not avilable",
  errorPods = []
) => {
  const errorPodsDisplay = [];

  let slNo = 1;
  errorPods.forEach((errorPod) =>
    errorPodsDisplay.push({
      name: slNo++,
      value: `POD: ${errorPod.podName}  ...............  NODE: ${errorPod.nodeName}  ...............   NAMESPACE: ${errorPod.namespace}  ...............  CLUSTER: ${errorPod.clusterName}\n`,
    })
  );

  try {
    await webhook.send({
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      themeColor: errorPods.length > 0 ? "FF0000" : "50c878",
      summary: "Auth proxy check​",
      title: `${
        errorPods.length === 0
          ? "All pods are working as expected"
          : errorPods.length === 1
          ? "1 pod is not respoding to auth proxy check"
          : `${errorPods.length}  pods are not responding to auth proxy check.`
      }`,
      sections: [
        {
          activityTitle: "Auth proxy script info​",
          facts: [
            { name: "Start time", value: startTime },
            { name: "End time", value: new Date().toLocaleTimeString() },
            { name: "Checked on", value: secrets.CLUSTERS_NEEDED },
          ],
        },

        {
          activityTitle:
            errorPodsDisplay.length === 0
              ? "No pods are failing auth proxy check"
              : "Failing pods​",
          facts: [...errorPodsDisplay],
        },
      ],
    });
    console.log("Sent teams message");
  } catch (err) {
    console.log(err);
  }
};

export default sendTeamsNotification;
