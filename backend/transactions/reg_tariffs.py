"""
REG/RURA Electricity Tariffs — effective 1 October 2025
Law No. 09/2013 of 01/03/2013

This module calculates units based on the official REG tariff structure.
"""
from decimal import Decimal


# ── Category choices (used on Meter and MeterRequest models) ──────────────────
CATEGORY_CHOICES = [
    ("residential",      "Residential (Household)"),
    ("non_residential",  "Non-Residential"),
    ("health",           "Health Facility"),
    ("school",           "School / Higher Learning Institution"),
    ("hotel_small",      "Hotel (annual consumption < 660,000 kWh)"),
    ("hotel_large",      "Hotel (annual consumption ≥ 660,000 kWh)"),
    ("commercial",       "Commercial / Data Centre"),
    ("water_pumping",    "Water Pumping Station"),
    ("water_treatment",  "Water Treatment Plant"),
    ("telecom",          "Telecom Tower"),
    ("industry_small",   "Industry – Small (5,000–100,000 kWh/yr)"),
    ("industry_medium",  "Industry – Medium (100,000–1,000,000 kWh/yr)"),
    ("industry_large",   "Industry – Large (≥ 1,000,000 kWh/yr)"),
]

# ── Flat rates per category (FRW/kWh, VAT & regulatory fee exclusive) ─────────
FLAT_RATES = {
    "non_residential":  Decimal("355"),   # 0–100 kWh block (conservative)
    "health":           Decimal("214"),
    "school":           Decimal("214"),
    "hotel_small":      Decimal("239"),
    "hotel_large":      Decimal("175"),
    "commercial":       Decimal("175"),
    "water_pumping":    Decimal("133"),
    "water_treatment":  Decimal("133"),
    "telecom":          Decimal("289"),
    "industry_small":   Decimal("175"),
    "industry_medium":  Decimal("133"),
    "industry_large":   Decimal("110"),
}

# ── Residential tiered rates ───────────────────────────────────────────────────
# Tier 1:  0 – 20 kWh  →  89 FRW/kWh
# Tier 2: 21 – 50 kWh  → 310 FRW/kWh
# Tier 3: >50 kWh      → 369 FRW/kWh
RESIDENTIAL_TIERS = [
    (Decimal("20"),  Decimal("89")),    # (cap_kwh, price_per_kwh)
    (Decimal("50"),  Decimal("310")),
    (None,           Decimal("369")),   # None = no cap (top tier)
]


def calculate_units(amount_rwf: Decimal, category: str, current_balance: Decimal) -> Decimal:
    """
    Calculate how many kWh units a given RWF amount buys,
    based on the meter's REG category and current balance.

    For residential: tiered pricing based on how much is already on the meter.
    For all others: flat rate.

    Returns units as a Decimal rounded to 3 decimal places.
    """
    amount = Decimal(str(amount_rwf))
    balance = Decimal(str(current_balance))

    if category == "residential":
        return _calculate_residential(amount, balance)
    else:
        rate = FLAT_RATES.get(category, Decimal("200"))
        return (amount / rate).quantize(Decimal("0.001"))


def _calculate_residential(amount: Decimal, current_balance: Decimal) -> Decimal:
    """
    Residential tiered calculation.
    Work through tiers based on how much balance the meter already has.
    """
    remaining_amount = amount
    total_units = Decimal("0")
    consumed = current_balance  # treat current balance as already-consumed units

    for cap, rate in RESIDENTIAL_TIERS:
        if remaining_amount <= 0:
            break

        if cap is not None:
            # How much room is left in this tier?
            tier_start = RESIDENTIAL_TIERS[[t[0] for t in RESIDENTIAL_TIERS].index(cap) - 1][0] \
                if RESIDENTIAL_TIERS[[t[0] for t in RESIDENTIAL_TIERS].index(cap)][0] != RESIDENTIAL_TIERS[0][0] \
                else Decimal("0")
            room_in_tier = cap - max(consumed, tier_start)

            if room_in_tier <= 0:
                # Already past this tier, skip
                continue

            max_units_this_tier = room_in_tier
            cost_to_fill_tier = max_units_this_tier * rate

            if remaining_amount >= cost_to_fill_tier:
                # Buy all available units in this tier
                total_units += max_units_this_tier
                remaining_amount -= cost_to_fill_tier
                consumed += max_units_this_tier
            else:
                # Buy partial units in this tier
                units = remaining_amount / rate
                total_units += units
                remaining_amount = Decimal("0")
        else:
            # Top tier — no cap, buy everything remaining here
            units = remaining_amount / rate
            total_units += units
            remaining_amount = Decimal("0")

    return total_units.quantize(Decimal("0.001"))


def get_effective_rate(category: str, current_balance: Decimal = Decimal("0")) -> Decimal:
    """
    Returns the effective FRW/kWh rate for display purposes.
    For residential, returns the rate of the current tier.
    """
    if category == "residential":
        balance = Decimal(str(current_balance))
        if balance <= 20:
            return Decimal("89")
        elif balance <= 50:
            return Decimal("310")
        else:
            return Decimal("369")
    return FLAT_RATES.get(category, Decimal("200"))


def get_category_display(category: str) -> str:
    """Return human-readable category name."""
    return dict(CATEGORY_CHOICES).get(category, category)