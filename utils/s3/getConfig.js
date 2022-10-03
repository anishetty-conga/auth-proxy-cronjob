import AWS from "aws-sdk";
import chalk from "chalk";
import fs from "fs";
import jsYaml from "js-yaml";

import { loopContext } from "../index.js";
import secrets from "../../secrets.js";

const s3 = new AWS.S3({
  accessKeyId: secrets.AWS_ACCESS_KEY_ID,
  secretAccessKey: secrets.AWS_SECRET_ACCESS_KEY,
  region: secrets.AWS_REGION,
});
const params = {
  Bucket: secrets.AWS_BUCKET_NAME,
  Key: secrets.AWS_FILE_KEY,
};

const configJsonFileName = `${secrets.CONFIG_FILE_NAME.split(".")[0]}.json`;

const getConfig = async (scriptStartTime) => {
  try {
    s3.getObject(params, (err, data) => {
      if (err) {
        throw new Error(err);
      } else {
        fs.writeFileSync("config.yaml", data.Body);
        console.log(chalk.green("Imported config.yaml from S3"));
        fs.readdirSync("./").forEach(async (file) => {
          if (file === secrets.CONFIG_FILE_NAME) {
            const appClusterNames = await getJsonFromYaml();
            if (appClusterNames) {
              await loopContext(scriptStartTime, appClusterNames);
            }
          }
        });
      }
    });
  } catch (err) {
    console.log(chalk.bold.red(err));
  }
};

const getJsonFromYaml = async () => {
  try {
    const jsonConfig = await jsYaml.load(
      fs.readFileSync(secrets.CONFIG_FILE_NAME, "utf-8")
    );
    const yamlJson = JSON.stringify(jsonConfig, null, 2);
    fs.writeFileSync(configJsonFileName, yamlJson);
    console.log(chalk.green("Created config.json from config.yaml"));
    const res = await filterAppClusters();
    if (res.length > 0) {
      return res;
    } else {
      throw new Error(
        `No app clusters found from ${secrets.CONFIG_FILE_NAME} file`
      );
    }
  } catch (err) {
    console.log(chalk.bold.red(err));
  }
};

const filterAppClusters = async () => {
  try {
    const jsonConfig = fs.readFileSync(configJsonFileName, "utf-8");
    const config = await JSON.parse(jsonConfig);
    const appCluster = config.clusters
      .filter((cluster) => cluster.name.split("-").join("").includes("app"))
      .map((cluster) => cluster.name)
      .filter((name) =>
        secrets.CLUSTERS_NEEDED.split(" ").some((clusterName) =>
          name.includes(clusterName)
        )
      );
    return appCluster;
  } catch (err) {
    console.log(chalk.bold.red(err));
  }
};

export default getConfig;
