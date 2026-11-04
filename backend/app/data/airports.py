"""Airport directory used to resolve free-text routes ("Delhi to Mumbai", "DEL-BOM") to IATA codes.

This is reference data only (no prices). Any valid IATA pair can be priced live; the directory just
powers search-by-name.
"""
import re

# IATA: (city, country ISO-2)
AIRPORTS: dict[str, tuple[str, str]] = {
    # India
    "DEL": ("Delhi", "IN"), "BOM": ("Mumbai", "IN"), "BLR": ("Bengaluru", "IN"), "HYD": ("Hyderabad", "IN"),
    "MAA": ("Chennai", "IN"), "CCU": ("Kolkata", "IN"), "PNQ": ("Pune", "IN"), "AMD": ("Ahmedabad", "IN"),
    "GOI": ("Goa", "IN"), "GOX": ("Goa Mopa", "IN"), "COK": ("Kochi", "IN"), "TRV": ("Thiruvananthapuram", "IN"),
    "CCJ": ("Kozhikode", "IN"), "JAI": ("Jaipur", "IN"), "LKO": ("Lucknow", "IN"), "PAT": ("Patna", "IN"),
    "GAU": ("Guwahati", "IN"), "BBI": ("Bhubaneswar", "IN"), "IXC": ("Chandigarh", "IN"), "SXR": ("Srinagar", "IN"),
    "IXJ": ("Jammu", "IN"), "NAG": ("Nagpur", "IN"), "IDR": ("Indore", "IN"), "BHO": ("Bhopal", "IN"),
    "VNS": ("Varanasi", "IN"), "IXB": ("Bagdogra", "IN"), "IXR": ("Ranchi", "IN"), "RPR": ("Raipur", "IN"),
    "VTZ": ("Visakhapatnam", "IN"), "VGA": ("Vijayawada", "IN"), "CJB": ("Coimbatore", "IN"), "IXM": ("Madurai", "IN"),
    "IXE": ("Mangaluru", "IN"), "UDR": ("Udaipur", "IN"), "ATQ": ("Amritsar", "IN"), "DED": ("Dehradun", "IN"),
    "IXL": ("Leh", "IN"), "IXZ": ("Port Blair", "IN"), "IMF": ("Imphal", "IN"), "AGR": ("Agra", "IN"),
    # Middle East
    "DXB": ("Dubai", "AE"), "AUH": ("Abu Dhabi", "AE"), "SHJ": ("Sharjah", "AE"), "DOH": ("Doha", "QA"),
    "MCT": ("Muscat", "OM"), "KWI": ("Kuwait", "KW"), "BAH": ("Bahrain", "BH"), "RUH": ("Riyadh", "SA"),
    "JED": ("Jeddah", "SA"), "IST": ("Istanbul", "TR"),
    # Europe
    "LHR": ("London", "GB"), "LGW": ("London Gatwick", "GB"), "MAN": ("Manchester", "GB"), "FRA": ("Frankfurt", "DE"),
    "MUC": ("Munich", "DE"), "CDG": ("Paris", "FR"), "AMS": ("Amsterdam", "NL"), "ZRH": ("Zurich", "CH"),
    "FCO": ("Rome", "IT"), "MAD": ("Madrid", "ES"), "BCN": ("Barcelona", "ES"), "VIE": ("Vienna", "AT"),
    "CPH": ("Copenhagen", "DK"), "DUB": ("Dublin", "IE"),
    # Asia-Pacific
    "SIN": ("Singapore", "SG"), "BKK": ("Bangkok", "TH"), "KUL": ("Kuala Lumpur", "MY"), "HKG": ("Hong Kong", "HK"),
    "NRT": ("Tokyo", "JP"), "HND": ("Tokyo Haneda", "JP"), "ICN": ("Seoul", "KR"), "PEK": ("Beijing", "CN"),
    "PVG": ("Shanghai", "CN"), "CMB": ("Colombo", "LK"), "KTM": ("Kathmandu", "NP"), "DAC": ("Dhaka", "BD"),
    "MLE": ("Male", "MV"), "SYD": ("Sydney", "AU"), "MEL": ("Melbourne", "AU"), "DPS": ("Bali", "ID"),
    "CGK": ("Jakarta", "ID"), "MNL": ("Manila", "PH"),
    # Americas / Africa
    "JFK": ("New York", "US"), "EWR": ("Newark", "US"), "SFO": ("San Francisco", "US"), "LAX": ("Los Angeles", "US"),
    "ORD": ("Chicago", "US"), "IAD": ("Washington", "US"), "YYZ": ("Toronto", "CA"), "NBO": ("Nairobi", "KE"),
    "JNB": ("Johannesburg", "ZA"), "CAI": ("Cairo", "EG"),
}

ALIASES: dict[str, str] = {
    "bangalore": "BLR", "bombay": "BOM", "calcutta": "CCU", "madras": "MAA", "cochin": "COK",
    "new delhi": "DEL", "trivandrum": "TRV", "poona": "PNQ", "vizag": "VTZ", "banaras": "VNS",
    "kualalumpur": "KUL", "nyc": "JFK", "new york city": "JFK",
}

_CITY_INDEX: dict[str, str] = {}
for _code, (_city, _) in AIRPORTS.items():
    _CITY_INDEX.setdefault(_city.lower(), _code)
_CITY_INDEX.update(ALIASES)

_SEPARATOR = re.compile(r"\s*(?:\bto\b|→|➔|->|=>|–|—|-|/|,)\s*", re.IGNORECASE)


def _normalise(token: str) -> str | None:
    token = re.sub(r"\([^)]*\)", " ", token).strip().lower()
    token = re.sub(r"\s+", " ", token)
    if not token:
        return None
    if len(token) == 3 and token.upper() in AIRPORTS:
        return token.upper()
    if token in _CITY_INDEX:
        return _CITY_INDEX[token]
    # prefix match on city name, e.g. "hyd", "benga"
    matches = {code for city, code in _CITY_INDEX.items() if city.startswith(token)} if len(token) >= 3 else set()
    return next(iter(matches)) if len(matches) == 1 else None


def resolve_route(query: str) -> tuple[str, str] | None:
    """'Delhi to Mumbai', 'DEL-BOM', 'del bom', 'Delhi → Mumbai (DEL-BOM)' -> ('DEL', 'BOM')."""
    q = (query or "").strip()
    if not q:
        return None
    # Explicit codes inside parentheses win: "Delhi to Mumbai (DEL-BOM)"
    paren = re.search(r"\(([A-Za-z]{3})\s*[-→> ]+\s*([A-Za-z]{3})\)", q)
    if paren:
        o, d = paren.group(1).upper(), paren.group(2).upper()
        if o != d:
            return o, d
    parts = [p for p in _SEPARATOR.split(q) if p.strip()]
    if len(parts) == 1:  # "DEL BOM"
        parts = q.split()
    if len(parts) != 2:
        return None
    o, d = _normalise(parts[0]), _normalise(parts[1])
    if not o or not d or o == d:
        return None
    return o, d


def city_of(code: str) -> str:
    return AIRPORTS.get(code.upper(), (code.upper(), ""))[0]


def search_airports(q: str, limit: int = 8) -> list[dict]:
    q = q.strip().lower()
    if not q:
        return []
    out = []
    for code, (city, country) in AIRPORTS.items():
        if code.lower().startswith(q) or city.lower().startswith(q):
            out.append({"code": code, "city": city, "country": country})
    return out[:limit]
