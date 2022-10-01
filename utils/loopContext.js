import {
  switchContext,
  getAllNamespacedTenants,
  authProxyCheck,
  sendTeamsNotification,
} from "./index.js";

let globalPodFails = [];

const loopContext = async (scriptStartTime, appCluster) => {
  //   await switchContext("eu-app-eks-prod-0001");
  for (let name of appCluster) {
    const switchContextRes = await switchContext(name);
    if (switchContextRes) {
      const getAllNamespacedTenantsRes = await getAllNamespacedTenants();
      if (getAllNamespacedTenantsRes) {
        for (let tenant of getAllNamespacedTenantsRes) {
          await authProxyCheck(tenant, globalPodFails);
        }
      }
    }
  }
  if (globalPodFails.length > 0) {
    await sendTeamsNotification(scriptStartTime, globalPodFails);
  }
};

export default loopContext;
