import { IncomingWebhook } from "ms-teams-webhook";

import "dotenv/config";

const webhook = new IncomingWebhook(process.env.TEAMS_WEBHOOK);

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
      themeColor: "FF0000",
      summary: "Pods failing Auth proxy check​",
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
            { name: "Checked on", value: process.env.CLUSTERS_NEEDED },
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
