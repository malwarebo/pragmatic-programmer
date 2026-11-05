"""Pricing rules."""

DISCOUNT_THRESHOLD = 100
DISCOUNT_RATE = 0.10


def apply_discount(total):
    if total > DISCOUNT_THRESHOLD:
        return round(total * (1 - DISCOUNT_RATE), 2)
    return total
