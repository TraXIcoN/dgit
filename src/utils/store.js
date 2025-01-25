import fs from "fs/promises";
import path from "path";
import os from "os";
import { createEd25519PeerId } from "@libp2p/peer-id-factory";

const STORE_DIR = path.join(os.homedir(), ".dgit");
const PEER_ID_FILE = path.join(STORE_DIR, "peer-id.json");
const CONNECTIONS_FILE = path.join(STORE_DIR, "connections.json");

// Ensure store directory exists
async function ensureStoreDir() {
  try {
    await fs.mkdir(STORE_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
}

// Get or create persistent PeerID
export async function getPeerId() {
  await ensureStoreDir();

  try {
    // Try to load existing PeerID
    const data = await fs.readFile(PEER_ID_FILE, "utf8");
    const parsed = JSON.parse(data);

    // If we have an existing PeerID, create a new one anyway for now
    // This is temporary until we fix the loading of stored PeerIDs
    console.log("Creating new PeerID (temporary solution)");
    const peerId = await createEd25519PeerId();
    const peerIdJson = JSON.stringify(peerId.toJSON(), null, 2);
    await fs.writeFile(PEER_ID_FILE, peerIdJson);
    return peerId;
  } catch (error) {
    if (error.code === "ENOENT") {
      // Create new PeerID if none exists
      console.log("Creating new PeerID");
      const peerId = await createEd25519PeerId();
      const peerIdJson = JSON.stringify(peerId.toJSON(), null, 2);
      await fs.writeFile(PEER_ID_FILE, peerIdJson);
      return peerId;
    }
    throw error;
  }
}

// Save a new connection
export async function saveConnection(peerId, address, alias = "") {
  await ensureStoreDir();

  let connections = [];
  try {
    const data = await fs.readFile(CONNECTIONS_FILE, "utf8");
    connections = JSON.parse(data);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  // Update or add connection
  const existingIndex = connections.findIndex((c) => c.peerId === peerId);
  const connection = {
    peerId,
    address,
    alias,
    lastSeen: Date.now(),
  };

  if (existingIndex >= 0) {
    connections[existingIndex] = connection;
  } else {
    connections.push(connection);
  }

  await fs.writeFile(CONNECTIONS_FILE, JSON.stringify(connections, null, 2));
}

// Get all stored connections
export async function getConnections() {
  try {
    const data = await fs.readFile(CONNECTIONS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

// Add or update alias for a peer
export async function setAlias(peerId, alias) {
  const connections = await getConnections();
  const connection = connections.find((c) => c.peerId === peerId);

  if (connection) {
    connection.alias = alias;
    await fs.writeFile(CONNECTIONS_FILE, JSON.stringify(connections, null, 2));
    return true;
  }
  return false;
}
