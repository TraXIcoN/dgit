import fs from "fs/promises";
import path from "path";

export async function initRepo() {
  try {
    // Create .dgit directory and its subdirectories
    await fs.mkdir(".dgit/refs/heads", { recursive: true });
    await fs.mkdir(".dgit/objects", { recursive: true });

    // Initialize empty HEAD reference
    await fs.writeFile(path.join(".dgit", "HEAD"), "ref: refs/heads/main\n");

    // Create initial config
    const config = {
      version: "0.1.0",
      core: {
        bare: false,
        repositoryformatversion: 0,
      },
      created_at: new Date().toISOString(),
    };

    await fs.writeFile(
      path.join(".dgit", "config.json"),
      JSON.stringify(config, null, 2)
    );

    console.log("Initialized empty dgit repository");
  } catch (error) {
    if (error.code === "EEXIST") {
      console.error("Error: dgit repository already exists");
    } else {
      console.error("Error initializing repository:", error.message);
    }
    process.exit(1);
  }
}
