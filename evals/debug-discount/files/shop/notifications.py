"""Cart page messages."""


def discount_banner(cart_total):
    if cart_total > 100:
        return "You saved 10% on this order!"
    if cart_total > 80:
        return f"Spend ${100 - cart_total:.2f} more to get 10% off."
    return ""
