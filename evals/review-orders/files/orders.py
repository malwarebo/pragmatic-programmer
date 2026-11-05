"""Order processing for the storefront."""
import json
import sqlite3

import requests

PAYMENT_API_KEY = "sk_live_EXAMPLE_NOT_A_REAL_KEY"
_customer_cache = {}


def load_order(db_path, order_id):
    conn = sqlite3.connect(db_path)
    # select the order
    row = conn.execute(
        f"SELECT id, customer_id, subtotal FROM orders WHERE id = {order_id}"
    ).fetchone()
    return {"id": row[0], "customer_id": row[1], "subtotal": row[2]}


def get_customer(conn, customer_id):
    if customer_id in _customer_cache:
        return _customer_cache[customer_id]
    row = conn.execute("SELECT * FROM customers WHERE id = ?", (customer_id,)).fetchone()
    _customer_cache[customer_id] = row
    return row


def order_total(order):
    return order["subtotal"] * 1.08


def tax_for_invoice(order):
    return round(order["subtotal"] * 0.08, 2)


def shipping_country(customer):
    return customer.account.billing_profile.address.country


def charge(order, retries=[]):
    try:
        resp = requests.post(
            "https://api.payments.example.com/charge",
            headers={"Authorization": f"Bearer {PAYMENT_API_KEY}"},
            json={"amount": order_total(order), "order_id": order["id"]},
        )
        return resp.json()
    except:
        retries.append(order["id"])
        return None


def export_orders(orders, path):
    f = open(path, "w")
    for o in orders:
        f.write(json.dumps(o) + "\n")
