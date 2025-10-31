import json
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
import statistics
from typing import List, Dict, Any, Tuple


def load_receipts(path: str) -> List[Dict[str, Any]]:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Input file not found: {path}")
    with p.open("r", encoding="utf-8") as f:
        return json.load(f)


def parse_year_month(date_str: str) -> Tuple[str, str]:
    """Return (year, year-month) from a date string.
    Assumes input is in DD-MM-YYYY format and returns (year, year-month).
    """
    if not date_str:
        return ("unknown", "unknown")
    s = date_str.strip()
    try:
        dt = datetime.strptime(s, "%d-%m-%Y")
        return (str(dt.year), f"{dt.year}-{dt.month:02d}")
    except Exception:
        return ("unknown", "unknown")


def safe_total(r: Dict[str, Any]) -> float:
    t = r.get("total")
    try:
        return float(t)
    except Exception:
        return 0.0


def totals_by_year_month(receipts: List[Dict[str, Any]]) -> Tuple[Dict[str, float], Dict[str, float]]:
    by_year = defaultdict(float)
    by_month = defaultdict(float)
    for r in receipts:
        year, ym = parse_year_month(r.get("date", ""))
        amt = safe_total(r)
        by_year[year] += amt
        by_month[ym] += amt
    return dict(by_year), dict(by_month)


def overall_stats(receipts: List[Dict[str, Any]]) -> Dict[str, Any]:
    totals = [safe_total(r) for r in receipts]
    cleaned = [t for t in totals if t is not None]
    count = len(cleaned)
    total_spent = sum(cleaned)
    avg = statistics.mean(cleaned) if cleaned else 0.0
    med = statistics.median(cleaned) if cleaned else 0.0
    minimum = min(cleaned) if cleaned else 0.0
    maximum = max(cleaned) if cleaned else 0.0
    return {
        "count": count,
        "total_spent": total_spent,
        "average": avg,
        "median": med,
        "min": minimum,
        "max": maximum,
    }


def item_frequency(receipts: List[Dict[str, Any]], n: int = 20) -> List[Tuple[str, int]]:
    """Count item occurrences if receipts contain an 'items' list of dicts with 'name'."""
    counter = Counter()
    for r in receipts:
        items = r.get("items") or r.get("lines")
        if not items:
            continue
        if isinstance(items, dict):
            # unexpected format
            continue
        for it in items:
            if isinstance(it, dict):
                name = it.get("name") or it.get("title") or it.get("description")
            else:
                name = str(it)
            if name:
                counter[name] += 1
    return counter.most_common(n)


def monthly_time_series(by_month: Dict[str, float]) -> List[Tuple[str, float]]:
    # sort keys like YYYY-MM when possible
    def keyfn(k: str):
        try:
            return datetime.strptime(k, "%Y-%m")
        except Exception:
            return datetime.max

    items = sorted(by_month.items(), key=lambda kv: keyfn(kv[0]))
    return items


def generate_analytics(receipts: List[Dict[str, Any]], top_n: int = 50) -> Dict[str, Any]:
    by_year, by_month = totals_by_year_month(receipts)
    overall = overall_stats(receipts)
    items = item_frequency(receipts, n=top_n)
    series = monthly_time_series(by_month)
    return {
        "overall": overall,
        "totals_by_year": by_year,
        "totals_by_month": by_month,
        "monthly_series_sorted": series,
        "top_items": items,
    }


def main():
    """Run analytics immediately and print results.

    Uses `out/receipts.json` by default. Prints a short summary and the full
    analytics JSON to stdout.
    """
    default_input = Path("out/receipts.json")
    try:
        if default_input.exists():
            receipts = load_receipts(str(default_input))
        else:
            raise FileNotFoundError(
                "No receipts file found. Expected 'out/receipts.json'."
            )
    except FileNotFoundError as e:
        print(str(e))
        return

    analytics = generate_analytics(receipts)

    # Friendly console output
    print("\nReceipts analytics summary")
    print(f"Total receipts: {analytics['overall']['count']}")
    print(f"Total spent: {analytics['overall']['total_spent']:.2f}")
    print(f"Average per receipt: {analytics['overall']['average']:.2f}")
    if analytics['top_items']:
        print("Top items:")
        for name, freq in analytics['top_items']:
            print(f"  {name}: {freq}")

    # Print full analytics JSON
    print("\nFull analytics JSON:")
    print(json.dumps(analytics, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
