#!/usr/bin/env python3

import argparse
import json
import re
import sys


MEAL_TYPES = ["ALMUERZO", "COMIDA", "MERIENDA", "CENA"]

_MEAL_HEADER_RE = re.compile(r"^\s*(" + "|".join(MEAL_TYPES) + r")\s*$")

# Matches all option naming styles found in ABRIL.pdf:
# OPCIÓN N / OPCIÓN N – TITLE / OPCIÓN N DE COMIDA – TITLE /
# OPCIÓN N DE CENA / OPCIÓN N DE CENA – TITLE / OPCIÓN N BOCATA /
# CENA N / CENA N – TITLE
_OPTION_HEADER_RE = re.compile(
    r"^\s*"
    r"("
    r"(?:OPCIÓN\s+\d+(?:\s+DE\s+\w+)?(?:\s*[–-]\s*.+)?)"
    r"|(?:OPCIÓN\s+\d+\s+\w.*?)"
    r"|(?:CENA\s+\d+(?:\s*[–-]\s*.+)?)"
    r")"
    r"\s*$",
    re.IGNORECASE,
)

_DIETA_RE = re.compile(r"DIETA\s+(\d+)", re.IGNORECASE)

# Recipe indicator patterns — lines containing these are recipe instructions
_RECIPE_INDICATORS = re.compile(
    r"\b(vamos|cortamos|cuando|llevamos|sartén|plancha\s*y|horno\s*y|"
    r"mezclar|servir|añadir|batimos|prepararlo|hacerlo|pochando|introducimos|"
    r"enrolladlo|calentamos|colocamos|rellenando|enrrollamos|listo|"
    r"mandamos|batiremos|mezclamos|corregimos|tostamos|¿cómo|como lo vamos|"
    r"condimentamos|salpimentándolos|hacerse)\b",
    re.IGNORECASE,
)


def _is_option_header(line: str) -> bool:
    return bool(_OPTION_HEADER_RE.match(line))


def _is_meal_header(line: str) -> bool:
    return bool(_MEAL_HEADER_RE.match(line))


def _parse_option_name(header_line: str) -> tuple:
    name = header_line.strip()
    return name, None


def _split_into_diets(full_text: str) -> list:
    parts = re.split(r"(DIETA\s+\d+)", full_text)
    diets = []
    i = 1
    while i < len(parts) - 1:
        diet_name = parts[i].strip()
        body = parts[i + 1]
        diets.append((diet_name, body))
        i += 2
    return diets


def _extract_intro(diet_body: str) -> tuple:
    lines = diet_body.split("\n")
    intro_lines = []
    meal_start_idx = None
    for idx, line in enumerate(lines):
        if _is_meal_header(line):
            meal_start_idx = idx
            break
        stripped = line.strip()
        if stripped:
            intro_lines.append(stripped)

    intro = "\n".join(intro_lines).strip()
    if meal_start_idx is not None:
        rest = "\n".join(lines[meal_start_idx:])
    else:
        rest = ""
    return intro, rest


def _split_into_meals(diet_body: str) -> list:
    lines = diet_body.split("\n")
    meals = []
    current_type = None
    current_lines = []

    for line in lines:
        m = _MEAL_HEADER_RE.match(line)
        if m:
            if current_type is not None:
                meals.append((current_type, "\n".join(current_lines)))
            current_type = m.group(1).upper()
            current_lines = []
        else:
            current_lines.append(line)

    if current_type is not None:
        meals.append((current_type, "\n".join(current_lines)))

    return meals


def _split_into_options(meal_type: str, meal_body: str) -> list:
    lines = meal_body.split("\n")

    header_positions = []
    for idx, line in enumerate(lines):
        if _is_option_header(line):
            header_positions.append(idx)

    if not header_positions:
        return [
            {
                "name": meal_type,
                "description": None,
                "raw_text": meal_body.strip(),
            }
        ]

    options = []
    for i, pos in enumerate(header_positions):
        header_line = lines[pos].strip()
        name, description = _parse_option_name(header_line)
        end = header_positions[i + 1] if i + 1 < len(header_positions) else len(lines)
        raw_lines = lines[pos + 1 : end]
        raw_text = "\n".join(raw_lines).strip()
        options.append(
            {
                "name": name,
                "description": description,
                "raw_text": raw_text,
            }
        )

    return options


# ─── Typo corrections from ABRIL.pdf ──────────────────────────────────────────

_TYPO_CORRECTIONS = {
    "planhca": "plancha",
    "Lonchad e": "Loncha de",
    "lonchad e": "Loncha de",
}


def _fix_typos(text: str) -> str:
    """Apply known PDF typo corrections."""
    for wrong, right in _TYPO_CORRECTIONS.items():
        text = text.replace(wrong, right)
    return text


# ─── Ingredient parsing ───────────────────────────────────────────────────────

# Matches: 100g de X / 100 g de X / 100ml de X / 100 ml de X
_QTY_UNIT_DE_RE = re.compile(
    r"^(\d+(?:\.\d+)?)\s*(g|ml)\s+de\s+(.+)$",
    re.IGNORECASE,
)

# Matches: 150g Garbanzos (quantity+unit directly attached to name, no "de")
_QTY_UNIT_NOSPACE_RE = re.compile(
    r"^(\d+(?:\.\d+)?)\s*(g|ml)\s+([A-ZÁÉÍÓÚÑ].+)$",
    re.UNICODE,
)

# Matches: 100 de X (missing unit — treat as g when context suggests weight)
_QTY_MISSING_UNIT_RE = re.compile(
    r"^(\d+(?:\.\d+)?)\s+de\s+(.+)$",
    re.IGNORECASE,
)

# Matches: N Cucharada/Loncha/Onza/Puñado/Vasito/Bola/Lata de X
_QTY_NAMED_UNIT_DE_RE = re.compile(
    r"^(\d+(?:\.\d+)?)\s+(Cucharadas?|Lonchas?|Onzas?|Puñados?|Vasitos?|Bolas?|Latas?)\s+de\s+(.+)$",
    re.IGNORECASE,
)

# Matches: N Cucharada/Loncha/Onza/Puñado/Vasito/Bola/Lata X (no "de")
_QTY_NAMED_UNIT_RE = re.compile(
    r"^(\d+(?:\.\d+)?)\s+(Cucharadas?|Lonchas?|Lonchad?|Onzas?|Puñados?|Vasitos?|Bolas?|Latas?)\s+(.+)$",
    re.IGNORECASE,
)

# Matches: N X (plain count — 1 Huevo, 2 Tortillas, etc.)
_QTY_COUNT_RE = re.compile(
    r"^(\d+)\s+(.+)$",
    re.IGNORECASE,
)

# Matches: ½ X
_HALF_RE = re.compile(
    r"^½\s+(.+)$",
    re.IGNORECASE,
)


def _extract_note_from_name(name: str) -> tuple:
    """Extract parenthetical notes from name. Returns (clean_name, note_or_None)."""
    # Check for parenthetical content at end
    paren_match = re.search(r"\(([^)]+)\)\s*$", name)
    if paren_match:
        note_content = paren_match.group(1)
        clean_name = name[: paren_match.start()].strip()
        # Remove trailing punctuation
        clean_name = clean_name.rstrip(".,;")
        return clean_name, note_content
    return name, None


def _check_quantity_libre(name: str) -> tuple:
    """Check if this has CANTIDAD LIBRE marker. Returns (clean_name, note_or_None)."""
    if "CANTIDAD LIBRE" in name.upper():
        # Strip "PUEDE SER EN CANTIDAD LIBRE" and similar
        clean = re.sub(
            r"\s*(?:PUEDE SER EN )?CANTIDAD LIBRE", "", name, flags=re.IGNORECASE
        ).strip()
        clean = clean.rstrip(".,;)")
        return clean, "cantidad libre"
    return name, None


def _parse_single_item(raw: str) -> dict:
    """Parse a single ingredient string into a structured item dict."""
    raw = raw.strip().rstrip(".,;")

    # Check for "a elegir" note
    note = None
    if "a elegir" in raw.lower() and not re.search(
        r"a elegir\s*\(", raw, re.IGNORECASE
    ):
        # Keep "a elegir" as part of name for now, will handle at end
        pass

    # Check CANTIDAD LIBRE first
    raw, libre_note = _check_quantity_libre(raw)
    if libre_note:
        note = libre_note

    # Handle "1-2 Tomates gordos dependiendo del tamaño"
    range_match = re.match(r"^(\d+)-(\d+)\s+(.+)$", raw)
    if range_match:
        note_str = f"{range_match.group(1)}-{range_match.group(2)} unidades"
        name = range_match.group(3).strip().rstrip(".,;")
        # Remove trailing parenthetical
        name, paren_note = _extract_note_from_name(name)
        if paren_note and not note:
            note = paren_note
        return {
            "name": name,
            "quantity": None,
            "unit": None,
            **({"note": note_str} if not note else {"note": note}),
        }

    # Try: N g/ml de X
    m = _QTY_UNIT_DE_RE.match(raw)
    if m:
        qty = float(m.group(1))
        if qty == int(qty):
            qty = int(qty)
        unit = m.group(2).lower()
        name = m.group(3).strip().rstrip(".,;")
        name, paren_note = _extract_note_from_name(name)
        if paren_note and not note:
            note = paren_note
        item = {"name": name, "quantity": qty, "unit": unit}
        if note:
            item["note"] = note
        return item

    # Try: 150g Garbanzos (no "de", uppercase start = ingredient name)
    m = _QTY_UNIT_NOSPACE_RE.match(raw)
    if m:
        qty = float(m.group(1))
        if qty == int(qty):
            qty = int(qty)
        unit = m.group(2).lower()
        name = m.group(3).strip().rstrip(".,;")
        name, paren_note = _extract_note_from_name(name)
        if paren_note and not note:
            note = paren_note
        item = {"name": name, "quantity": qty, "unit": unit}
        if note:
            item["note"] = note
        return item

    # Try: N de X (missing unit — assume g)
    m = _QTY_MISSING_UNIT_RE.match(raw)
    if m:
        qty = float(m.group(1))
        if qty == int(qty):
            qty = int(qty)
        name = m.group(2).strip().rstrip(".,;")
        name, paren_note = _extract_note_from_name(name)
        if paren_note and not note:
            note = paren_note
        item = {"name": name, "quantity": qty, "unit": "g"}
        if note:
            item["note"] = note
        return item

    # Try: N NamedUnit de X
    m = _QTY_NAMED_UNIT_DE_RE.match(raw)
    if m:
        qty = float(m.group(1))
        if qty == int(qty):
            qty = int(qty)
        unit_word = m.group(2)
        # Determine unit: "Loncha" stays as unidad (for display "Loncha de X")
        # but name includes the unit word prefix
        unit_lower = unit_word.lower().rstrip("s")
        if unit_lower in ("loncha", "lonchad"):
            # "1 Loncha de Queso" → name="Loncha de Queso havarti light", unit=unidad
            name = f"{unit_word} de {m.group(3).strip().rstrip('.,;')}"
        elif unit_lower in ("puñado",):
            name = f"{unit_word} de {m.group(3).strip().rstrip('.,;')}"
        elif unit_lower in ("vasito",):
            name = f"{unit_word} de {m.group(3).strip().rstrip('.,;')}"
        elif unit_lower in ("bola",):
            name = f"{unit_word} de {m.group(3).strip().rstrip('.,;')}"
        elif unit_lower in ("lata",):
            name = f"{unit_lower} de {m.group(3).strip().rstrip('.,;')}"
        elif unit_lower in ("onza",):
            name = f"{unit_word} de {m.group(3).strip().rstrip('.,;')}"
        elif unit_lower in ("cucharada",):
            name = f"{unit_word} de {m.group(3).strip().rstrip('.,;')}"
        else:
            name = m.group(3).strip().rstrip(".,;")
        name, paren_note = _extract_note_from_name(name)
        if paren_note and not note:
            note = paren_note
        item = {"name": name, "quantity": qty, "unit": "unidad"}
        if note:
            item["note"] = note
        return item

    # Try: N NamedUnit X (no "de")
    m = _QTY_NAMED_UNIT_RE.match(raw)
    if m:
        qty = float(m.group(1))
        if qty == int(qty):
            qty = int(qty)
        unit_word = m.group(2)
        rest = m.group(3).strip().rstrip(".,;")
        unit_lower = unit_word.lower().rstrip("s")
        if unit_lower in ("loncha", "lonchad"):
            name = f"{unit_word} {rest}"
        elif unit_lower in ("puñado",):
            name = f"{unit_word} {rest}"
        else:
            name = rest
        name, paren_note = _extract_note_from_name(name)
        if paren_note and not note:
            note = paren_note
        item = {"name": name, "quantity": qty, "unit": "unidad"}
        if note:
            item["note"] = note
        return item

    # Try: ½ X
    m = _HALF_RE.match(raw)
    if m:
        rest = m.group(1).strip().rstrip(".,;")
        # Check for "Bola de X"
        rest, paren_note = _extract_note_from_name(rest)
        if paren_note and not note:
            note = paren_note
        item = {"name": rest, "quantity": 0.5, "unit": "unidad"}
        if note:
            item["note"] = note
        return item

    # Try: N X (plain count)
    m = _QTY_COUNT_RE.match(raw)
    if m:
        qty = int(m.group(1))
        rest = m.group(2).strip().rstrip(".,;")
        rest, paren_note = _extract_note_from_name(rest)
        if paren_note and not note:
            note = paren_note
        item = {"name": rest, "quantity": qty, "unit": "unidad"}
        if note:
            item["note"] = note
        return item

    # No quantity — plain name
    name = raw.rstrip(".,;")
    name, paren_note = _extract_note_from_name(name)
    if paren_note and not note:
        note = paren_note
    item = {"name": name, "quantity": None, "unit": None}
    if note:
        item["note"] = note
    return item


_RECIPE_VERB_START_RE = re.compile(
    r"^(Vamos|Cortamos|Cuando|Llevamos|Mezclar|Servir|Añadir|Batimos|Condimentamos|"
    r"Calentamos|Colocamos|Rellenando|Enrrollamos|Tostamos|Mandamos|Mezclamos|"
    r"Corregimos|Salpimentándolos|Hacerse|¿)",
    re.IGNORECASE,
)


def _is_recipe_line(line: str) -> bool:
    """Return True if this line looks like recipe instructions rather than an ingredient."""
    stripped = line.strip()
    if not stripped:
        return False
    if _RECIPE_INDICATORS.search(stripped):
        return True
    return False


def _is_recipe_dash_line(content: str) -> bool:
    """Return True if the content after "-" is a recipe instruction (verb-started sentence)."""
    stripped = content.strip()
    if not stripped:
        return False
    if stripped.startswith("¿"):
        return True
    return bool(_RECIPE_VERB_START_RE.match(stripped))


def _join_wrapped_lines(raw_text: str) -> list:
    """
    Rejoin lines that were word-wrapped. Handles:
    - Lines ending with hyphen (word split across lines): "Tortelli-\nnis" → "Tortellinis"
    - Continuation lines that belong to the previous ingredient line
    Returns list of logical lines.
    """
    raw_lines = raw_text.split("\n")
    logical_lines = []
    current = None

    for line in raw_lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Word-hyphen continuation: prev line ended with "-"
        if current is not None and current.endswith("-"):
            # Join without space (the hyphen was a word break)
            current = current[:-1] + stripped
            continue

        if stripped.startswith("-"):
            content_after_dash = stripped.lstrip("-").strip()
            if _is_recipe_dash_line(content_after_dash):
                if current is not None:
                    logical_lines.append(current)
                    current = None
                continue
            if current is not None:
                logical_lines.append(current)
            current = stripped
        else:
            if _is_recipe_line(stripped):
                if current is not None:
                    logical_lines.append(current)
                    current = None
                continue
            if current is not None:
                current = current + " " + stripped

    if current is not None:
        logical_lines.append(current)

    return logical_lines


def _parse_combination_item(raw: str) -> dict:
    """
    Parse a combination item like:
    "60g de Gambitas congeladas + 1 huevo"
    "50g de Aguacate + 50g de Philadelphia light todo mezclado"
    "1 huevo + 1 lata de atún natural"
    "2 Onzas de chocolate negro (16g) + 20g de Crema de cacahuete"
    Returns a dict with is_combination=True, sub_items, note, name
    """
    parts = [p.strip() for p in raw.split(" + ")]
    sub_items = [_parse_single_item(p) for p in parts]

    # Build display name from sub items
    names = []
    for si in sub_items:
        names.append(si["name"])

    display_name = " + ".join(names)
    note = raw  # full raw as note

    return {
        "name": display_name,
        "quantity": None,
        "unit": None,
        "note": note,
        "is_combination": True,
        "sub_items": sub_items,
    }


def _parse_ingredient_line(logical_line: str) -> dict:
    """
    Parse a logical ingredient line (starts with "-") into a structured dict.
    Returns: {items: [...], is_alternatives: bool, is_combination: bool}
    """
    content = _fix_typos(logical_line.lstrip("-").strip())

    # Determine if this line is alternatives (/) or combination (+) at top level
    # But need to be careful: "60g de Gambitas congeladas + 1 huevo" within alternatives
    # means the line itself may contain "/" separating items that include "+"

    # Check for alternatives (/) at top level
    # We split by "/" but need to check if each part contains "+" (combination within alternatives)
    if "/" in content:
        parts = [p.strip() for p in content.split("/")]
        items = []
        for part in parts:
            part = part.strip().rstrip(".,;")
            if " + " in part:
                # This sub-item is a combination
                combo = _parse_combination_item(part)
                items.append(combo)
            else:
                items.append(_parse_single_item(part))
        return {"items": items, "is_alternatives": True, "is_combination": False}

    # Check for combination (+) — split on " + " (space-delimited) to avoid
    # matching product names like "Leche +proteínas" where + is part of the name
    if " + " in content:
        combo = _parse_combination_item(content)
        return {
            "items": [combo],
            "is_alternatives": False,
            "is_combination": True,
        }

    # Single item
    item = _parse_single_item(content)
    return {"items": [item], "is_alternatives": False, "is_combination": False}


def _parse_ingredients(raw_text: str) -> list:
    """Parse raw_text into a list of ingredient_line dicts."""
    logical_lines = _join_wrapped_lines(raw_text)
    ingredient_lines = []

    for line in logical_lines:
        if not line.strip().startswith("-"):
            # Skip non-ingredient lines that slipped through
            continue
        parsed = _parse_ingredient_line(line)
        if parsed["items"]:
            ingredient_lines.append(parsed)

    return ingredient_lines


# ─── Main structure parsing ───────────────────────────────────────────────────


def parse_pdf_to_structure(pdf_path: str) -> dict:
    try:
        import pdfplumber
    except ImportError:
        return {"status": "error", "message": "pdfplumber not installed"}

    try:
        with pdfplumber.open(pdf_path) as pdf:
            page_texts = []
            for i, page in enumerate(pdf.pages):
                if i >= 6:
                    break
                page_texts.append(page.extract_text() or "")
    except FileNotFoundError:
        return {"status": "error", "message": f"File not found: {pdf_path}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

    full_text = "\n".join(page_texts)

    diet_chunks = _split_into_diets(full_text)
    if not diet_chunks:
        return {"status": "error", "message": "No DIETA sections found in PDF"}

    diets = []
    for diet_name, diet_body in diet_chunks:
        intro, meals_body = _extract_intro(diet_body)
        meal_chunks = _split_into_meals(meals_body)

        meals = []
        for meal_type, meal_body in meal_chunks:
            raw_options = _split_into_options(meal_type, meal_body)
            options = []
            for opt in raw_options:
                ingredient_lines = _parse_ingredients(opt["raw_text"])
                options.append(
                    {
                        "name": opt["name"],
                        "description": opt["description"],
                        "ingredient_lines": ingredient_lines,
                    }
                )
            meals.append({"type": meal_type, "options": options})

        diets.append({"name": diet_name, "intro": intro, "meals": meals})

    return {"status": "ok", "diets": diets}


def cmd_parse(args):
    result = parse_pdf_to_structure(args.pdf_path)
    print(json.dumps(result, ensure_ascii=False))
    if result.get("status") == "error":
        sys.exit(1)


def cmd_calculate(args):
    try:
        result = parse_pdf_to_structure(args.pdf_path)
        if result.get("status") == "error":
            print(json.dumps(result))
            sys.exit(1)

        with open(args.selection_json_path, "r", encoding="utf-8") as f:
            selection = json.load(f)

        days = selection.get("days", [])

        if not days:
            print(json.dumps({"status": "ok", "totals": []}))
            return

        diets = result["diets"]

        diet_by_name = {}
        for diet in diets:
            diet_by_name[diet["name"].strip().upper()] = diet

        aggregation = {}

        for day in days:
            diet_name = day.get("diet", "").strip().upper()
            diet = diet_by_name.get(diet_name)
            if diet is None:
                continue

            meal_by_type = {}
            for meal in diet["meals"]:
                meal_by_type[meal["type"].strip().upper()] = meal

            for meal_sel in day.get("meals", []):
                meal_type = meal_sel.get("type", "").strip().upper()
                selected_option_index = meal_sel.get("selected_option_index", 0)
                alternative_choices = meal_sel.get("alternative_choices", {})

                meal = meal_by_type.get(meal_type)
                if meal is None:
                    continue

                options = meal.get("options", [])
                if selected_option_index >= len(options):
                    continue

                option = options[selected_option_index]
                ingredient_lines = option.get("ingredient_lines", [])

                for line_idx, line in enumerate(ingredient_lines):
                    is_alternatives = line.get("is_alternatives", False)
                    is_combination = line.get("is_combination", False)
                    items = line.get("items", [])

                    if not items:
                        continue

                    if is_alternatives:
                        chosen_item_idx = alternative_choices.get(str(line_idx), 0)
                        if chosen_item_idx >= len(items):
                            chosen_item_idx = 0
                        chosen = items[chosen_item_idx]

                        if chosen.get("is_combination"):
                            for sub in chosen.get("sub_items", []):
                                _add_item(aggregation, sub)
                        else:
                            _add_item(aggregation, chosen)

                    elif is_combination:
                        combo = items[0]
                        for sub in combo.get("sub_items", []):
                            _add_item(aggregation, sub)

                    else:
                        item = items[0]
                        if item.get("is_combination"):
                            for sub in item.get("sub_items", []):
                                _add_item(aggregation, sub)
                        else:
                            _add_item(aggregation, item)

        totals = []
        for (name_key, unit), qty in sorted(aggregation.items(), key=lambda x: x[0][0]):
            qty_out = int(qty) if qty == int(qty) else qty
            totals.append({"ingredient": name_key, "quantity": qty_out, "unit": unit})

        print(json.dumps({"status": "ok", "totals": totals}, ensure_ascii=False))

    except Exception as exc:
        print(json.dumps({"status": "error", "message": str(exc)}))
        sys.exit(1)


def _add_item(aggregation, item):
    qty = item.get("quantity")
    unit = item.get("unit")
    name = item.get("name", "")
    if qty is None:
        return
    name_key = name.lower().strip()
    key = (name_key, unit)
    aggregation[key] = aggregation.get(key, 0) + qty


def cmd_export(args):
    try:
        with open(args.totals_json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        totals = data.get("totals", [])

        with open(args.output_csv_path, "wb") as f:
            f.write(b"\xef\xbb\xbf")
            f.write("Ingrediente,Cantidad,Unidad\n".encode("utf-8"))
            for item in totals:
                ingredient = item["ingredient"]
                quantity = item["quantity"]
                unit = item["unit"]
                if isinstance(quantity, float) and quantity == int(quantity):
                    quantity = int(quantity)
                f.write(f"{ingredient},{quantity},{unit}\n".encode("utf-8"))

        output_path = str(args.output_csv_path)
        import os

        if not os.path.isabs(output_path):
            output_path = os.path.abspath(output_path)

        print(
            json.dumps({"status": "ok", "path": output_path, "item_count": len(totals)})
        )

    except Exception as exc:
        print(json.dumps({"status": "error", "message": str(exc)}))
        sys.exit(1)


def _ensure_utf8_stdout():
    import io, os

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    else:
        sys.stdout = io.TextIOWrapper(
            os.fdopen(sys.stdout.fileno(), "wb", closefd=False),
            encoding="utf-8",
        )


def main():
    _ensure_utf8_stdout()
    parser = argparse.ArgumentParser(description="Diet PDF parser sidecar CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    parse_parser = subparsers.add_parser(
        "parse", help="Extract structured diet data from PDF pages 1-6"
    )
    parse_parser.add_argument("pdf_path", help="Path to the PDF file")
    parse_parser.set_defaults(func=cmd_parse)

    calc_parser = subparsers.add_parser("calculate", help="Calculate nutrition totals")
    calc_parser.add_argument("pdf_path", help="Path to the PDF file")
    calc_parser.add_argument("selection_json_path", help="Path to selection JSON file")
    calc_parser.set_defaults(func=cmd_calculate)

    export_parser = subparsers.add_parser("export", help="Export totals to CSV")
    export_parser.add_argument("totals_json_path", help="Path to totals JSON file")
    export_parser.add_argument("output_csv_path", help="Path for output CSV file")
    export_parser.set_defaults(func=cmd_export)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
