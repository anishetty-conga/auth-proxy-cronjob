import { createSpinner } from "nanospinner";
import { v4 as uuidv4 } from "uuid";

const getPodDetails = async (k8sApi, kc, namespace) => {
  const dataSpinner = createSpinner(
    "Collecting Node information for ls-data-" + namespace
  ).start();

  try {
    const initialDataRes = await k8sApi.listNamespacedPod(
      `ls-data-${namespace}`
    );
    let res = [];
    if (initialDataRes?.body?.items) {
      let dataRes = initialDataRes.body.items.map(({ metadata }) => {
        return {
          nodeName: metadata.labels.app,
          podName: metadata.name,
          namespace: `ls-data-${namespace}`,
          id: uuidv4(),
          clusterName: kc.currentContext,
        };
      });

      dataRes = dataRes.filter(
        ({ nodeName }) => nodeName === "dataintegrationservice-api"
      );
      res = [...dataRes];
      if (res.length > 0) {
        dataSpinner.success({
          text: `Collected Node information for ls-data-${namespace} namespace`,
        });
        const pricingSpinner = createSpinner(
          "Collecting Node information for ls-pricing-" + namespace
        ).start();
        try {
          const initialPricingRes = await k8sApi.listNamespacedPod(
            `ls-pricing-${namespace}`
          );

          if (initialPricingRes?.body?.items) {
            let pricingRes = initialPricingRes.body.items.map(
              ({ metadata }) => {
                return {
                  nodeName: metadata.labels.app,
                  podName: metadata.name,
                  namespace: `ls-pricing-${namespace}`,
                  id: uuidv4(),
                  clusterName: kc.currentContext,
                };
              }
            );
            pricingRes = pricingRes.filter(
              ({ nodeName }) =>
                nodeName === "data-admin-api" ||
                nodeName === "admin-api" ||
                nodeName === "cart-web" ||
                nodeName === "pricing-scheduler"
            );
            if (pricingRes.length > 0) {
              res = [...res, ...pricingRes];
              pricingSpinner.success({
                text: `Collected Node information for ls-pricing-${namespace} namespace`,
              });
              return res;
            } else {
              pricingSpinner.warn({
                text: `No pods found for ls-pricing-${namespace} namespace`,
              });
              if (res.length > 0) {
                return res;
              }
            }
          } else {
            pricingSpinner.warn({
              text: `No pods found for ls-pricing-${namespace} namespace`,
            });
            if (res.length > 0) {
              return res;
            }
          }
        } catch (err) {
          pricingSpinner.error({
            text:
              err?.message ||
              `Unable to fetch pod details for ls-pricing-${namespace}. Please try again with diffrent context or namespace`,
          });
          if (res.length > 0) {
            return res;
          }
        }
      } else {
        dataSpinner.error({
          text: "Your tenant name is incorrect or not found",
        });
        return;
      }
    } else {
      dataSpinner.error({
        text: `Unable to fetch pod details for ls-data-${namespace}. Please try again with diffrent context or namespace`,
      });
    }
  } catch (err) {
    dataSpinner.error({
      text:
        err?.message ||
        `Unable to fetch pod details for ls-data-${namespace}. Please try again with diffrent context or namespace`,
    });
  }
};

export default getPodDetails;
