import unittest

from pricing import apply_discount


class TestApplyDiscount(unittest.TestCase):
    def test_large_order_gets_discount(self):
        self.assertEqual(apply_discount(150), 135.0)

    def test_small_order_no_discount(self):
        self.assertEqual(apply_discount(50), 50)


if __name__ == "__main__":
    unittest.main()
