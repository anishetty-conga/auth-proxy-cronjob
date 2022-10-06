import { IncomingWebhook } from "ms-teams-webhook";

import secrets from "../../secrets.js";

let teamsWebhookUrl;
if (!process?.argv[2]) {
  teamsWebhookUrl = secrets.TEAMS_WEBHOOK;
} else if (process?.argv[2] === "dev") {
  teamsWebhookUrl = secrets.TEAMS_WEBHOOK_DEV;
} else if (process?.argv[2] === "preprod") {
  teamsWebhookUrl = secrets.TEAMS_WEBHOOK_PREPROD;
} else if (process?.argv[2] === "prod") {
  teamsWebhookUrl = secrets.TEAMS_WEBHOOK_PROD;
} else {
  teamsWebhookUrl = secrets.TEAMS_WEBHOOK;
}

const webhook = new IncomingWebhook(teamsWebhookUrl);

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
            { name: "Checked on", value: secrets.CLUSTERS[process.argv[2]] },
          ],
        },

        {
          activityTitle:
            errorPodsDisplay.length === 0
              ? "No pods are failing auth proxy check @authProxyGroup"
              : "Failing pods @authProxyGroup​",
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
