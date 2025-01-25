import { getNode } from "../utils/nodeManager.js";
import { multiaddr } from "@multiformats/multiaddr";
import { saveConnection } from "../utils/store.js";

export async function connect(address) {
  try {
    const node = await getNode();

    // Convert string address to multiaddr
    const ma = multiaddr(address);

    // Connect to the peer
    await node.dial(ma);

    // Extract peerId from the multiaddr
    const peerId = ma.getPeerId();
    if (!peerId) {
      throw new Error("No peer ID found in address");
    }

    // Save the connection with required fields
    await saveConnection(peerId, address);

    console.log("Successfully connected to:", address);
    console.log("Peer ID:", peerId);

    // Return the connection details
    return { peerId, address };
  } catch (error) {
    console.error("Failed to connect:", error);
    throw error;
  }
}
