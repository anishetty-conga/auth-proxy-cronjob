import {
  switchContext,
  getAllNamespacedTenants,
  authProxyCheck,
  sendTeamsNotification,
} from "./index.js";

let globalPodFails = [];

const loopContext = async (scriptStartTime, appCluster) => {
  for (let name of appCluster) {
    console.log(`Switching to ${name} context`);
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
  } else {
    await sendTeamsNotification(scriptStartTime, globalPodFails);
  }
};

export default loopContext;
