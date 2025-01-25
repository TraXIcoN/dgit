import fetch from "node-fetch";
import dns from "dns/promises";

export async function getPublicIp() {
  try {
    // Try multiple IP services in case one fails
    const services = [
      "https://api.ipify.org?format=json",
      "https://api64.ipify.org?format=json",
      "https://api.ip.sb/ip",
    ];

    for (const service of services) {
      try {
        const response = await fetch(service);
        const data = await response.json();
        return data.ip || data;
      } catch (e) {
        continue;
      }
    }
    throw new Error("Could not determine public IP");
  } catch (error) {
    console.error("Failed to get public IP:", error.message);
    return "0.0.0.0";
  }
}

export async function validateAddress(address) {
  try {
    const parts = address.split("/");
    const ip = parts[2];
    const port = parts[4];
    const peerId = parts[6];

    // Validate IP
    if (ip !== "127.0.0.1") {
      await dns.lookup(ip);
    }

    // Validate port
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 0 || portNum > 65535) {
      throw new Error("Invalid port number");
    }

    // Validate peer ID format - now accepts both Qm and 12D3 formats
    if (!peerId || !(peerId.startsWith("Qm") || peerId.startsWith("12D3"))) {
      throw new Error("Invalid peer ID format");
    }

    return true;
  } catch (error) {
    throw new Error(`Invalid address: ${error.message}`);
  }
}
