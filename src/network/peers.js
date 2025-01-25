import { getNode } from "../utils/nodeManager.js";
import { getConnections, getPeerId } from "../utils/store.js";

export async function listPeers() {
  try {
    const connections = await getConnections();

    // Group connections by peerId and count frequency
    const peerStats = connections.reduce((acc, conn) => {
      if (!conn.peerId) {
        console.log("Warning: Found connection without peerId:", conn);
        return acc;
      }

      if (!acc[conn.peerId]) {
        acc[conn.peerId] = {
          peerId: conn.peerId,
          address: conn.address,
          connectionCount: 1,
          lastSeen: new Date(conn.lastSeen),
        };
      } else {
        acc[conn.peerId].connectionCount++;
        // Update lastSeen if this connection is more recent
        if (conn.lastSeen > acc[conn.peerId].lastSeen.getTime()) {
          acc[conn.peerId].lastSeen = new Date(conn.lastSeen);
        }
      }
      return acc;
    }, {});

    // Display results
    console.log("\nPeer Connection Statistics:");
    Object.values(peerStats).forEach((peer) => {
      console.log("\nPeer:", peer.peerId);
      console.log("Address:", peer.address || "Unknown");
      console.log("Connection Count:", peer.connectionCount);
      console.log("Last Seen:", peer.lastSeen.toLocaleString());
    });

    return Object.values(peerStats);
  } catch (error) {
    console.error("Failed to list peers:", error);
    return [];
  }
}

export async function getCommitsFromPeer(peerId) {
  const node = await getNode();

  try {
    const { stream } = await node.dialProtocol(peerId, "/dgit/commits/1.0.0");
    const writer = stream.sink;
    const reader = stream.source;

    const request = { type: "get_commits" };
    await writer.write(JSON.stringify(request));

    const response = await reader.read();
    const commits = JSON.parse(response.toString());

    return commits;
  } catch (error) {
    throw new Error(`Failed to get commits from peer: ${error.message}`);
  }
}

export async function handleCommitRequests(node) {
  await node.handle("/dgit/commits/1.0.0", async ({ stream }) => {
    try {
      const reader = stream.source;
      const writer = stream.sink;

      const request = await reader.read();
      const { type } = JSON.parse(request.toString());

      if (type === "get_commits") {
        const commits = await getLocalCommits();
        await writer.write(JSON.stringify(commits));
      }
    } catch (error) {
      console.error("Error handling commit request:", error);
    }
  });
}

async function getLocalCommits() {
  return [
    { hash: "1234567", message: "Initial commit" },
    { hash: "7654321", message: "Add feature X" },
  ];
}

// Add a new command to set aliases
export async function setAlias(peerId, alias) {
  const success = await setAlias(peerId, alias);
  if (success) {
    console.log(`Set alias "${alias}" for peer ${peerId}`);
  } else {
    console.log(`No stored connection found for peer ${peerId}`);
  }
}
