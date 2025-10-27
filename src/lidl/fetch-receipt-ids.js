import { existsSync } from "fs";
import fs from "fs/promises";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { config as configEnv } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

configEnv();

const COOKIE = process.env.LIDL_COOKIE;
if (!COOKIE) {
  throw new Error("LIDL_COOKIE environment variable is not set");
}
const BASE_URL = "https://www.lidl.bg/mre/api/v1/";
const OUT_DIR = path.resolve(__dirname, "out");

// if (existsSync(OUT_DIR)) {
//   await fs.rmdir(OUT_DIR, { recursive: true });
// }
// await fs.mkdir(path.resolve("./out"));

const getReceipts = async (page = 1) => {
  const url = new URL("tickets", BASE_URL);
  url.searchParams.set("country", "BG");
  url.searchParams.set("page", page);

  const { items, totalCount } = await (
    await fetch(url.toString(), {
      headers: { Cookie: COOKIE, "Content-Type": "application/json" },
    })
  ).json();

  return { receipts: items, totalCount };
};

const allReceipts = [];
let currentPage = 1;
let interval = setInterval(async () => {
  console.log(`Fetching page ${currentPage}...`);

  try {
    const { receipts, totalCount } = await getReceipts(currentPage);
    allReceipts.push(...receipts);
    console.log(
      `Fetched ${receipts.length} receipts, Progress: ${allReceipts.length}/${totalCount}`
    );

    for await (const receipt of receipts) {
      await fs.appendFile(
        path.resolve(OUT_DIR, "receipt_ids.txt"),
        `${receipt.id}\n`
      );
    }

    currentPage++;

    if (allReceipts.length >= totalCount) {
      clearInterval(interval);
    }
  } catch (e) {
    console.error("Error fetching receipts:", e);
    clearInterval(interval);
  }
}, Math.round(Math.random() * (3_000 - 1_000) + 1_000));
