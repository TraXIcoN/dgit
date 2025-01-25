import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { mplex } from "@libp2p/mplex";
import { kadDHT } from "@libp2p/kad-dht";
import { identify } from "@libp2p/identify";
import { multiaddr } from "@multiformats/multiaddr";
import { handleCommitRequests } from "./peers.js";

// Bootstrap nodes - well-known peers that help with initial discovery
const BOOTSTRAP_NODES = [
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
].map((addr) => multiaddr(addr));

export async function discover() {
  try {
    // Create libp2p node with DHT
    const node = await createLibp2p({
      addresses: {
        listen: ["/ip4/0.0.0.0/tcp/0"],
      },
      transports: [tcp()],
      streamMuxers: [mplex()],
      connectionEncryption: [noise()],
      services: {
        identify: identify(),
        dht: kadDHT({
          enabled: true,
          clientMode: false,
          protocolPrefix: "/ipfs",
        }),
      },
    });

    await node.start();

    // Log our peer ID and addresses
    console.log("Peer ID:", node.peerId.toString());
    const addresses = node.getMultiaddrs();
    console.log("Listening on addresses:");
    addresses.forEach((addr) => console.log(addr.toString()));

    // Log connection events using toString()
    node.addEventListener("peer:connect", (evt) => {
      console.log("Connected to peer:", evt.detail.toString());
    });

    node.addEventListener("peer:disconnect", (evt) => {
      console.log("Disconnected from peer:", evt.detail.toString());
    });

    // Start peer discovery
    console.log("Starting peer discovery...");
    const dht = node.services.dht;

    // Periodically look for peers
    setInterval(async () => {
      try {
        const topic = `dgit-${Date.now()}`;
        await dht.provide(Buffer.from(topic));

        for await (const peerData of dht.findProviders(Buffer.from(topic))) {
          // Use toString() instead of toMultihash()
          console.log("Found peer:", peerData.id.toString());

          // Log the full peer data
          if (peerData.multiaddrs) {
            console.log("Peer addresses:");
            peerData.multiaddrs.forEach((addr) =>
              console.log("  -", addr.toString())
            );
          }
        }
      } catch (err) {
        console.warn("Peer discovery error:", err.message);
      }
    }, 30000);

    // Handle commit requests from other peers
    await handleCommitRequests(node);

    return node;
  } catch (error) {
    console.error("Discovery failed:", error);
    throw error;
  }
}
