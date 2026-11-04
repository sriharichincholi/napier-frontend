from app.data.airports import resolve_route, search_airports


def test_resolves_city_names():
    assert resolve_route("Delhi to Mumbai") == ("DEL", "BOM")
    assert resolve_route("Frankfurt to Hyderabad") == ("FRA", "HYD")


def test_resolves_codes_and_separators():
    assert resolve_route("DEL-BOM") == ("DEL", "BOM")
    assert resolve_route("del bom") == ("DEL", "BOM")
    assert resolve_route("Delhi → Mumbai (DEL-BOM)") == ("DEL", "BOM")


def test_aliases():
    assert resolve_route("Bangalore to Bombay") == ("BLR", "BOM")


def test_rejects_garbage_and_same_airport():
    assert resolve_route("") is None
    assert resolve_route("nowhere to atlantis") is None
    assert resolve_route("DEL-DEL") is None


def test_airport_search():
    assert any(a["code"] == "HYD" for a in search_airports("hyd"))
