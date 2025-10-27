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

const getReceipt = async (receiptId) => {
	const url = new URL(`tickets/${receiptId}`, BASE_URL);
	url.searchParams.set("country", "BG");
	url.searchParams.set("languageCode", "bg-BG");

	const { ticket: receipt } = await (
		await fetch(url, {
			headers: { Cookie: COOKIE, "Content-Type": "application/json" },
		})
	).json();

	return receipt;
};

const allReceipts = (
	await fs.readFile(path.resolve(OUT_DIR, "receipt_ids.txt"), "utf-8")
).split("\n");

let currentReceiptIdx = 0;
let interval = setInterval(async () => {
	const receiptId = allReceipts[currentReceiptIdx];

	if (existsSync(path.resolve(OUT_DIR, `${receiptId}.html`))) {
		console.log("Skipping already fetched receipt", receiptId);
		currentReceiptIdx++;
		return;
	}

	console.log(`Fetching receipt ${receiptId}...`);

	try {
		const receipt = await getReceipt(receiptId);

		console.log(
			`Fetched receipt content ${receiptId}, Progress: ${
				currentReceiptIdx + 1
			}/${allReceipts.length}`
		);
		await fs.writeFile(
			path.resolve(OUT_DIR, `${receiptId}.html`),
			receipt.htmlPrintedReceipt
		);

		currentReceiptIdx++;
	} catch (e) {
		console.error("Error fetching receipt:", e);
		clearInterval(interval);
	}
}, Math.round(Math.random() * (3_000 - 1_000) + 1_000));
