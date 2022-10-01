import AWS from "aws-sdk";
import chalk from "chalk";
import fs from "fs";
import jsYaml from "js-yaml";

import "dotenv/config";

import { loopContext } from "../index.js";

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const params = {
  Bucket: process.env.AWS_BUCKET_NAME,
  Key: process.env.AWS_FILE_KEY,
};

const configJsonFileName = `${process.env.CONFIG_FILE_NAME.split(".")[0]}.json`;

const getConfig = async (scriptStartTime) => {
  try {
    s3.getObject(params, (err, data) => {
      if (err) {
        throw new Error(err);
      } else {
        fs.writeFileSync("config.yaml", data.Body);
        console.log(chalk.green("Imported config.yaml from S3"));
        fs.readdirSync("./").forEach(async (file) => {
          if (file === process.env.CONFIG_FILE_NAME) {
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
      fs.readFileSync(process.env.CONFIG_FILE_NAME, "utf-8")
    );
    const yamlJson = JSON.stringify(jsonConfig, null, 2);
    fs.writeFileSync(configJsonFileName, yamlJson);
    console.log(chalk.green("Created config.json from config.yaml"));
    const res = await filterAppClusters();
    if (res.length > 0) {
      return res;
    } else {
      throw new Error(
        `No app clusters found from ${process.env.CONFIG_FILE_NAME} file`
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
        process.env.CLUSTERS_NEEDED.split(" ").some((clusterName) =>
          name.includes(clusterName)
        )
      );
    return appCluster;
  } catch (err) {
    console.log(chalk.bold.red(err));
  }
};

export default getConfig;
