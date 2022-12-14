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
            {
              name: "Checked on",
              value: secrets.CLUSTERS[process.argv[2]].join(" "),
            },
          ],
        },

        {
          activityTitle:
            errorPodsDisplay.length === 0
              ? "No pods are failing auth proxy check <at>authProxyGroup</at>"
              : "Failing pods authProxyGroup​",
          facts: [...errorPodsDisplay],
        },
      ],

      // mentions: [
      //   {
      //     id: 0,
      //     mentionText: "authProxyGroup",
      //     mentioned: {
      //       application: null,
      //       device: null,
      //       user: null,
      //       conversation: null,
      //       tag: {
      //         id: "M2E0MWFlNTMtZmIzNS00NDMxLWJlN2ItYTBiM2UxYWVlM2MwIyM4OTNhYjlhZC0zYzZkLTQwNzctOWE5Mi0yM2M5YmEwZjkwYmIjI3RtS0NiQVZUOQ==",
      //         displayName: "authProxyGroup",
      //       },
      //     },
      //   },
      // ],
      //mentions
    });
    console.log("Sent teams message");
  } catch (err) {
    console.log(err);
  }
};

export default sendTeamsNotification;
