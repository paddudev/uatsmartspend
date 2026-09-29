import base64
import datetime
import io
import os
import re

import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session

import database_models

if os.environ.get("TESSERACT_CMD"):
    pytesseract.pytesseract.tesseract_cmd = os.environ["TESSERACT_CMD"]

CLASSIFICATION_THRESHOLD = 0.55

STOPLIST_KEYWORDS = (
    "total", "subtotal", "sub total", "tax", "gst", "cgst", "sgst", "cash",
    "change", "balance", "amount due", "qty", "discount", "round off",
    "thank you", "bill no", "invoice", "receipt no", "card", "paid",
    "payment", "customer", "cashier", "counter",
)

LINE_ITEM_RE = re.compile(r"^(.+?)\s+[₹$]?\s*(\d+(?:\.\d{1,2})?)\s*$")

DATE_PATTERNS = (
    (re.compile(r"\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})\b"), "dmy"),
    (re.compile(r"\b(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})\b"), "ymd"),
)


def decode_bill_to_images(file_data: str, file_type: str) -> list[Image.Image]:
    raw_bytes = base64.b64decode(file_data, validate=True)
    if file_type == "application/pdf":
        poppler_path = os.environ.get("POPPLER_PATH")
        return convert_from_bytes(raw_bytes, poppler_path=poppler_path)
    return [Image.open(io.BytesIO(raw_bytes)).convert("RGB")]


def extract_bill_text(file_data: str, file_type: str) -> str:
    images = decode_bill_to_images(file_data, file_type)
    return "\n".join(pytesseract.image_to_string(image) for image in images)


def parse_line_items(raw_text: str) -> list[dict]:
    items = []
    for line in raw_text.splitlines():
        line = line.strip()
        if not line:
            continue
        lowered = line.lower()
        if any(keyword in lowered for keyword in STOPLIST_KEYWORDS):
            continue
        match = LINE_ITEM_RE.match(line)
        if not match:
            continue
        description, amount_str = match.groups()
        description = description.strip(" -:\t")
        if not description or not re.search(r"[A-Za-z]", description):
            continue
        try:
            amount = float(amount_str)
        except ValueError:
            continue
        if amount <= 0:
            continue
        items.append({"raw_item_text": description, "amount": amount})
    return items


def extract_bill_date(raw_text: str) -> str:
    for pattern, order in DATE_PATTERNS:
        match = pattern.search(raw_text)
        if not match:
            continue
        parts = match.groups()
        try:
            if order == "dmy":
                day, month, year = int(parts[0]), int(parts[1]), int(parts[2])
            else:
                year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
            parsed = datetime.date(year, month, day)
        except ValueError:
            continue
        return parsed.isoformat()
    return datetime.date.today().isoformat()


def best_match(raw_text: str, corpus_texts: list[str], corpus_fks: list[int]) -> tuple[int | None, float | None]:
    if not corpus_texts:
        return None, None
    vectorizer = TfidfVectorizer()
    try:
        matrix = vectorizer.fit_transform(corpus_texts + [raw_text])
    except ValueError:
        return None, None
    similarities = cosine_similarity(matrix[-1], matrix[:-1])[0]
    best_index = similarities.argmax()
    best_score = float(similarities[best_index])
    if best_score >= CLASSIFICATION_THRESHOLD:
        return corpus_fks[best_index], best_score
    return None, best_score


def classify_line_items(line_items: list[dict], userid_fk: int, db: Session) -> list[dict]:
    products = (
        db.query(database_models.productsandservices)
        .filter(database_models.productsandservices.userid_fk == userid_fk)
        .all()
    )
    aliases = (
        db.query(database_models.bill_item_aliases)
        .filter(database_models.bill_item_aliases.userid_fk == userid_fk)
        .all()
    )

    product_ids = [product.id for product in products]
    product_categories = {product_id: set() for product_id in product_ids}
    for link in (
        db.query(database_models.productsandservices_categories)
        .filter(database_models.productsandservices_categories.productsandservices_fk.in_(product_ids))
        .all()
    ):
        product_categories[link.productsandservices_fk].add(link.categorymaster_fk)
    product_brands = {product_id: set() for product_id in product_ids}
    for link in (
        db.query(database_models.productsandservices_brands)
        .filter(database_models.productsandservices_brands.productsandservices_fk.in_(product_ids))
        .all()
    ):
        product_brands[link.productsandservices_fk].add(link.brand_fk)

    corpus_texts = []
    corpus_product_fks = []
    for product in products:
        corpus_texts.append(product.name)
        corpus_product_fks.append(product.id)
    for alias in aliases:
        corpus_texts.append(alias.alias_text)
        corpus_product_fks.append(alias.productsandservices_fk)

    for item in line_items:
        products_services_fk, product_score = best_match(item["raw_item_text"], corpus_texts, corpus_product_fks)
        item["products_services_fk"] = products_services_fk
        item["classification_confidence"] = product_score
        item["categorymaster_fk"] = None
        item["brand_fk"] = None

        if products_services_fk is not None:
            categories = product_categories.get(products_services_fk, set())
            brands = product_brands.get(products_services_fk, set())
            if len(categories) == 1:
                item["categorymaster_fk"] = next(iter(categories))
            else:
                item["categorymaster_fk"] = learned_link(item["raw_item_text"], aliases, products_services_fk, "categorymaster_fk", categories)
            item["brand_fk"] = learned_link(item["raw_item_text"], aliases, products_services_fk, "brand_fk", brands)

        # A product in several categories (burger: dine-in / dine-out) with no
        # learned alias to pick between them goes to review rather than
        # guessing, so the report totals stay correct.
        classified = products_services_fk is not None and (
            item["categorymaster_fk"] is not None or not product_categories.get(products_services_fk)
        )
        item["source"] = "ai" if classified else "draft"

    return line_items


def learned_link(raw_text: str, aliases: list, products_services_fk: int, field: str, allowed: set[int]) -> int | None:
    # Category and brand are only ever learned from bill_item_aliases, and
    # only from aliases of the matched product, so the prediction is always
    # one of the product's own mappings.
    texts = []
    fks = []
    for alias in aliases:
        value = getattr(alias, field)
        if alias.productsandservices_fk == products_services_fk and value in allowed:
            texts.append(alias.alias_text)
            fks.append(value)
    fk, _score = best_match(raw_text, texts, fks)
    return fk


def process_bill(file_data: str, file_type: str, userid_fk: int, db: Session) -> dict:
    raw_text = extract_bill_text(file_data, file_type)
    transaction_date = extract_bill_date(raw_text)
    line_items = parse_line_items(raw_text)
    line_items = classify_line_items(line_items, userid_fk, db)
    return {
        "raw_ocr_text": raw_text,
        "transaction_date": transaction_date,
        "line_items": line_items,
    }
