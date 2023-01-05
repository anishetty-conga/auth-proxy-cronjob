import { IncomingWebhook } from "ms-teams-webhook";

import secrets from "../../secrets.js";

let teamsWebhookUrl;
if (process?.argv[2] === "auth_proxy") {
  teamsWebhookUrl = secrets.TEAMS_WEBHOOK_AUTH_PROXY;
}

const webhook = new IncomingWebhook(teamsWebhookUrl);

const sendAuthProxyMessage = async (startTime = "Not avilable") => {
  try {
    await webhook.send({
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      themeColor: "50c878",
      summary: "Auth proxy check​",
      title: `Restarted auth proxy pods of monitoring namespace in below mentioned clusters`,
      sections: [
        {
          activityTitle: "Auth proxy restart script info​",
          facts: [
            { name: "Start time", value: startTime },
            { name: "End time", value: new Date().toLocaleTimeString() },
            {
              name: "Checked on",
              value: secrets.CLUSTERS[process.argv[2]].join(" "),
            },
          ],
        },
      ],
    });
    console.log("Sent teams message");
  } catch (err) {
    console.log(err);
  }
};

export default sendAuthProxyMessage;
