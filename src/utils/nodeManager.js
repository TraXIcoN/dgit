import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { mplex } from "@libp2p/mplex";
import { identify } from "@libp2p/identify";
import { getPeerId, saveConnection } from "./store.js";

let sharedNode = null;

export async function getNode() {
  if (!sharedNode) {
    const peerId = await getPeerId();

    sharedNode = await createLibp2p({
      peerId,
      addresses: {
        listen: ["/ip4/0.0.0.0/tcp/0"],
      },
      transports: [tcp()],
      streamMuxers: [mplex()],
      connectionEncryption: [noise()],
      services: {
        identify: identify(),
      },
      connectionManager: {
        minConnections: 0,
        maxConnections: 50,
        pollInterval: 2000,
      },
    });

    await sharedNode.start();

    sharedNode.addEventListener("peer:connect", async (evt) => {
      const remotePeer = evt.detail;
      console.log("Peer connected:", remotePeer.toString());
      await saveConnection(
        remotePeer.toString(),
        sharedNode.getMultiaddrs().map((addr) => addr.toString())[0]
      );
    });

    sharedNode.addEventListener("peer:disconnect", (evt) => {
      console.log("Peer disconnected:", evt.detail.toString());
    });
  }
  return sharedNode;
}
