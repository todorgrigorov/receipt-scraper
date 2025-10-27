import OpenAI from "openai";
import { fileURLToPath } from "url";
import { config as configEnv } from "dotenv";
import { existsSync } from "fs";
import fs from "fs/promises";
import path, { dirname } from "path";
import { JSDOM } from "jsdom";
import pLimit from "p-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUT_DIR = path.resolve(__dirname, "out");

configEnv();

const openAIClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const getReceiptJSON = async (receiptId) => {
	const rawHTML = await fs.readFile(
		path.resolve(OUT_DIR, `${receiptId}.html`),
		"utf-8"
	);

	const {
		window: { document },
	} = new JSDOM(rawHTML);

	[
		...document.body.getElementsByClassName("header"),
		...document.body.getElementsByClassName("purchase_summary"),
		...document.body.getElementsByClassName("purchase_tender_information"),
		...document.body.getElementsByClassName("footer"),
		...document.body.getElementsByClassName("return_code"),
	].forEach((el) => el.remove());

	const promptInput = document.body.innerHTML;
	console.log("Prompt input length:", promptInput.length);

	const response = await openAIClient.responses.create({
		model: process.env.OPENAI_MODEL,
		reasoning: { effort: "low" },
		instructions: `
I will provide you with the HTML content of a grocery store receipt.
All prices are in Bulgarian Lev (BGN).
Product items are usually in Bulgarian language.
Product items are displayed as HTML span elements with class "purchase_list_line_N".
Sometimes, there can be multiple span elements with the same class for a single product (e.g., for quantity and price). Those can be grouped by the "data-art-id" HTML attribute.

Your task is to analyze the receipt and extract the following information in JSON format:
	- date: Date of purchase (format: DD-MM-YYYY)
	- time: Time of purchase (format: HH:MM)
	- total: Total amount paid
	- items: List of items purchased, each with:
		- name: Name
		- quantity: Quantity
		- category: Category (e.g. "Dairy", "Bakery", "Beverages", etc. This info will not be part of the receipt, you will need to infer it based on the product name. If you can't guess, leave it empty)
		- price_per_unit: Price per unit`,
		input: promptInput,
	});

	return response.output_text;
};

const allReceipts = (
	await fs.readFile(path.resolve(OUT_DIR, "receipt_ids.txt"), "utf-8")
).split("\n");
const limit = pLimit(3);

const analyzeTasks = allReceipts.map(receiptId => {
	return limit(async () => {
		if (existsSync(path.resolve(OUT_DIR, `${receiptId}.json`))) {
			console.log("Skipping already analyzed receipt", receiptId);
			return;
		}

		console.log(`Analyzing receipt ${receiptId}...`);

		try {
			const receiptJSON = await getReceiptJSON(receiptId);

			console.log(
				`Analyzed receipt content ${receiptId}`
			);
			await fs.writeFile(
				path.resolve(OUT_DIR, `${receiptId}.json`),
				receiptJSON
			);
		} catch (e) {
			console.error("Error analyzing receipt:", e);
		}
	});
});

await Promise.all(analyzeTasks);
