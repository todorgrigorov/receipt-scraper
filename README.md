# Receipt Scraper

Node.js scripts for scraping and analyzing grocery store receipts. 

Currently only supports parsing of digital receipts from one of the most popular chains in Bulgaria - Lidl.

## Prerequisites

- Node.js (version 22 or higher)
- OpenAI API key

## Setup

1. Clone the repository:

```bash
git clone https://github.com/todorgrigorov/receipt-scraper.git
cd receipt-scraper
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with your OpenAI API key:

```
LIDL_COOKIE=auth_cookie_for_fetching_the_receipts
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=your_model_name_here
```

## Usage

The application consists of three main scripts:

1. Fetch receipt IDs:

```bash
node src/lidl/fetch-receipt-ids.js
```

2. Fetch receipt contents:

```bash
node src/lidl/fetch-receipt-contents.js
```

3. Turn receipts into JSON structured format using an LLM (OpenAI):

```bash
node src/lidl/receipt-analyzer.js
```

4. Concat individual receipt JSONs

```bash
./concat.sh
```

5. Analyze!

```bash
python query.py
```

Each script processes the output from the previous one, storing results in the `src/lidl/out` directory.

You can then load the output JSONs in you favorite document DB, e.g. Mongo and query interesting facts about purchasing habits!
