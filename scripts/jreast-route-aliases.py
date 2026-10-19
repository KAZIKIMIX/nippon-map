"""Conservative JR East route-name normalization for verified evidence matching.

This does not verify station names, prefectures or URLs. Those require separate checks.
"""
import re

ALIASES = {
    "信越線": "信越本線",
    "羽越線": "羽越本線",
    "東北線": "東北本線",
    "中央線": "中央本線",
}

def normalize_route(value: str) -> str:
    name = re.sub(r"[\s　]+", "", str(value or ""))
    return ALIASES.get(name, name)

def route_matches(database_routes, official_route: str) -> bool:
    if isinstance(database_routes, str):
        database_routes = [database_routes]
    target = normalize_route(official_route)
    return any(normalize_route(route) == target for route in (database_routes or []))
