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

const getConfig = async (scriptStartTime) => {
  try {
    s3.getObject(params, async (err, data) => {
      if (err) {
        throw new Error(err);
      } else {
        fs.writeFileSync(
          `${process.argv[2]}-${secrets.CONFIG_FILE_NAME}`,
          data.Body
        );
        console.log(
          chalk.green(
            `Imported ${process.argv[2]}-${secrets.CONFIG_FILE_NAME} from S3`
          )
        );

        if (secrets.CLUSTERS[process.argv[2]]?.length > 0) {
          await loopContext(scriptStartTime, secrets.CLUSTERS[process.argv[2]]);
        }
      }
    });
  } catch (err) {
    console.log(chalk.bold.red(err));
  }
};

export default getConfig;
