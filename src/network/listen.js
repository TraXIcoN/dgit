import { getNode } from "../utils/nodeManager.js";
import { getPublicIp } from "../utils/network.js";
import { getPeerId } from "../utils/store.js";

// Bootstrap nodes - well-known peers that help with initial discovery
const BOOTSTRAP_NODES = [
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
];

export async function listen(options = {}) {
  try {
    const port = options.port || "0";
    const usePublicIp = options.public || false;

    // Get our persistent PeerID
    const peerId = await getPeerId();
    console.log("Node PeerID:", peerId.toString());

    const node = await getNode();
    const addresses = node.getMultiaddrs();

    console.log("Listening on addresses:");
    addresses.forEach((addr) => console.log(addr.toString()));

    if (usePublicIp) {
      const publicIp = await getPublicIp();
      console.log("Public IP:", publicIp);
      const localAddress = addresses[0].toString();
      const port = localAddress.split("/")[4];
      return `/ip4/${publicIp}/tcp/${port}/p2p/${peerId.toString()}`;
    }

    // Return the first address with our PeerID
    return `${addresses[0].toString()}/p2p/${peerId.toString()}`;
  } catch (error) {
    console.error("Failed to start listener:", error);
    throw error;
  }
}

function handleListenError(error) {
  if (error.code === "EADDRINUSE") {
    console.error("Port is already in use. Try a different port.");
  } else if (error.code === "EACCES") {
    console.error("Permission denied. Try a port number above 1024.");
  } else {
    console.error("Failed to start listener:", error.message);
  }
}
