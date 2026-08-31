#!/usr/bin/env python3

import argparse
import json
import re
import sys
import zipfile
from xml.sax.saxutils import escape


MEAL_TYPES = ["ALMUERZO", "COMIDA", "MERIENDA", "CENA"]

_MEAL_HEADER_RE = re.compile(r"^\s*(" + "|".join(MEAL_TYPES) + r")\s*$")

# Matches all option naming styles found in ABRIL.pdf:
# OPCIÓN N / OPCIÓN N – TITLE / OPCIÓN N DE COMIDA – TITLE /
# OPCIÓN N DE CENA / OPCIÓN N DE CENA – TITLE / OPCIÓN N BOCATA /
# CENA N / CENA N – TITLE
_OPTION_HEADER_RE = re.compile(
    r"^\s*-?\s*"
    r"("
    r"(?:OPCI[ÓO]N\s+\d+(?:\s+DE\s+\w+)?(?:\s*[–-]\s*.+)?)"
    r"|(?:OPCI[ÓO]N\s+\d+\s+\w.*?)"
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
    name = re.sub(r"^\s*-\s*", "", header_line).strip()
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

# Matches: 100g de X / 1,5 kg de X / 0.5 l de X
_NUMBER_PATTERN = r"(?:\d+(?:[.,]\d+)?|[¼½¾]|\d+\s*/\s*\d+)"
_QTY_UNIT_DE_RE = re.compile(
    rf"^({_NUMBER_PATTERN})\s*(kg|g|ml|l|litros?|gramos?|kilos?)\s+de\s+(.+)$",
    re.IGNORECASE,
)

# Matches: 150g Garbanzos (quantity+unit directly attached to name, no "de")
_QTY_UNIT_NOSPACE_RE = re.compile(
    rf"^({_NUMBER_PATTERN})\s*(kg|g|ml|l|litros?|gramos?|kilos?)\s+([A-ZÁÉÍÓÚÑ].+)$",
    re.UNICODE,
)

# Matches: 100 de X (missing unit — treat as g when context suggests weight)
_QTY_MISSING_UNIT_RE = re.compile(
    r"^(\d+(?:\.\d+)?)\s+de\s+(.+)$",
    re.IGNORECASE,
)

# Matches: N Cucharada/Loncha/Onza/Puñado/Vasito/Bola/Lata de X
_QTY_NAMED_UNIT_DE_RE = re.compile(
    rf"^({_NUMBER_PATTERN})\s+(Cucharadas?|Lonchas?|Onzas?|Puñados?|Vasitos?|Bolas?|Latas?|Paquetes?|Botes?|Tarros?|Tarrinas?|Botellas?)\s+de\s+(.+)$",
    re.IGNORECASE,
)

# Matches: N Cucharada/Loncha/Onza/Puñado/Vasito/Bola/Lata X (no "de")
_QTY_NAMED_UNIT_RE = re.compile(
    rf"^({_NUMBER_PATTERN})\s+(Cucharadas?|Lonchas?|Lonchad?|Onzas?|Puñados?|Vasitos?|Bolas?|Latas?|Paquetes?|Botes?|Tarros?|Tarrinas?|Botellas?)\s+(.+)$",
    re.IGNORECASE,
)

# Matches: N X (plain count — 1 Huevo, 2 Tortillas, etc.)
_QTY_COUNT_RE = re.compile(
    r"^(\d+)\s+(.+)$",
    re.IGNORECASE,
)

# Matches: ½ X
_HALF_RE = re.compile(
    r"^([¼½¾]|\d+\s*/\s*\d+)\s+(.+)$",
    re.IGNORECASE,
)

_UNICODE_FRACTIONS = {"¼": 0.25, "½": 0.5, "¾": 0.75}
_NAMED_UNITS = {
    "cucharada": "cucharada",
    "loncha": "loncha",
    "lonchad": "loncha",
    "onza": "onza",
    "puñado": "puñado",
    "vasito": "vasito",
    "bola": "bola",
    "lata": "lata",
    "paquete": "paquete",
    "bote": "bote",
    "tarro": "tarro",
    "tarrina": "tarrina",
    "botella": "botella",
}


def _parse_quantity(value: str) -> float:
    value = value.strip()
    if value in _UNICODE_FRACTIONS:
        return _UNICODE_FRACTIONS[value]
    if "/" in value:
        numerator, denominator = value.split("/", 1)
        return float(numerator.strip()) / float(denominator.strip())
    return float(value.replace(",", "."))


def _normalize_measure(quantity: float, unit: str) -> tuple:
    unit = unit.lower()
    if unit in ("kg", "kilo", "kilos"):
        return quantity * 1000, "g"
    if unit in ("l", "litro", "litros"):
        return quantity * 1000, "ml"
    if unit in ("gramo", "gramos"):
        return quantity, "g"
    return quantity, unit


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
        qty = _parse_quantity(m.group(1))
        if qty == int(qty):
            qty = int(qty)
        qty, unit = _normalize_measure(qty, m.group(2))
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
        qty = _parse_quantity(m.group(1))
        if qty == int(qty):
            qty = int(qty)
        qty, unit = _normalize_measure(qty, m.group(2))
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
        qty = _parse_quantity(m.group(1))
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
        qty = _parse_quantity(m.group(1))
        if qty == int(qty):
            qty = int(qty)
        unit_word = m.group(2)
        unit_lower = unit_word.lower().rstrip("s")
        name = m.group(3).strip().rstrip(".,;")
        name, paren_note = _extract_note_from_name(name)
        if paren_note and not note:
            note = paren_note
        item = {"name": name, "quantity": qty, "unit": _NAMED_UNITS.get(unit_lower, "unidad")}
        if note:
            item["note"] = note
        return item

    # Try: N NamedUnit X (no "de")
    m = _QTY_NAMED_UNIT_RE.match(raw)
    if m:
        qty = _parse_quantity(m.group(1))
        if qty == int(qty):
            qty = int(qty)
        unit_word = m.group(2)
        rest = m.group(3).strip().rstrip(".,;")
        unit_lower = unit_word.lower().rstrip("s")
        name = rest
        name, paren_note = _extract_note_from_name(name)
        if paren_note and not note:
            note = paren_note
        item = {"name": name, "quantity": qty, "unit": _NAMED_UNITS.get(unit_lower, "unidad")}
        if note:
            item["note"] = note
        return item

    # Try: ½ X
    m = _HALF_RE.match(raw)
    if m:
        qty = _parse_quantity(m.group(1))
        rest = m.group(2).strip().rstrip(".,;")
        # Check for "Bola de X"
        rest, paren_note = _extract_note_from_name(rest)
        if paren_note and not note:
            note = paren_note
        item = {"name": rest, "quantity": qty, "unit": "unidad"}
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

        if stripped == "-":
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
        elif re.match(r"^(?:\d+(?:[.,]\d+)?\s*(?:kg|g|ml|l)\b|\d+\s*[A-ZÁÉÍÓÚÑ]|[¼½¾]\s+|\d+\s*/\s*\d+\s+)", stripped):
            if current is not None and current.rstrip().endswith("/"):
                current = current + " " + stripped
                continue
            if current is not None:
                logical_lines.append(current)
            current = "-" + stripped
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


_TRAINING_DAY_RE = re.compile(r"^\s*D[IÍ]A\s+([\d\sYy,]+)\s*[–-]\s*(.+?)\s*$", re.IGNORECASE | re.MULTILINE)


def _clean_training_lines(raw_text: str) -> list:
    lines = []
    for raw_line in raw_text.split("\n"):
        line = re.sub(r"\s+", " ", raw_line.strip())
        if not line:
            continue
        if lines and lines[-1].endswith("-"):
            lines[-1] = lines[-1][:-1] + line
        else:
            lines.append(line)
    return lines


def _parse_exercise_rows(raw_text: str) -> list:
    lines = [line for line in _clean_training_lines(raw_text) if not re.match(r"^EJERCICIOS\s+SERIES\s+REPETICIONES\s+DETALLES$", line, re.IGNORECASE)]
    rows = []
    pending = []
    index = 0
    while index < len(lines):
        inline = re.match(r"^(.+?)\s+(\d+)\s+(.+)$", lines[index]) if not pending else None
        if inline and not re.match(r"^\d+[ºª]\s*-", lines[index], re.IGNORECASE):
            rows.append({"exercise": inline.group(1), "series": inline.group(2), "repetitions": inline.group(3), "details": ""})
            index += 1
            continue

        series_match = re.match(r"^(\d+)(?:\s+(.+))?$", lines[index])
        if not series_match:
            pending.append(lines[index])
            index += 1
            continue

        series = series_match.group(1)
        first_repetition = series_match.group(2)
        index += 1
        is_superset = bool(pending and pending[0].upper() == "SUPERSERIE")
        exercise_lines = pending[1:] if is_superset else pending
        exercise_lines = [re.sub(r"^-\s*", "", line) for line in exercise_lines if line != "+"]
        pending = []
        if not exercise_lines:
            continue

        repetitions = [first_repetition] if first_repetition else []
        if is_superset:
            while index < len(lines) and len(repetitions) < len(exercise_lines) and not re.match(r"^\d+$", lines[index]):
                repetitions.append(lines[index])
                index += 1
        elif re.match(r"^1[ºª]\s*-", first_repetition or (lines[index] if index < len(lines) else ""), re.IGNORECASE):
            while index < len(lines) and re.match(r"^\d+[ºª]\s*-", lines[index], re.IGNORECASE):
                repetitions.append(lines[index])
                index += 1
        elif not repetitions and index < len(lines):
            repetitions.append(lines[index])
            index += 1

        details = []
        while index < len(lines) and re.match(r"^(?:CON CADA|SIN PARAR|\d+\s*SEG\.?\s*DESCANSO|¿?QU[EÉ] ES UN DROP SET|VAMOS A SUBIR|[ÚU]LTIMA SERIE|REPES|PESO Y|SEGUIMOS|AS[IÍ] SUCESIVAMENTE|HASTA QUE|CADA \d|AGUANTAMOS)", lines[index], re.IGNORECASE):
            details.append(lines[index])
            index += 1
        exercise = " + ".join(exercise_lines) if is_superset else " ".join(exercise_lines)
        row = {"exercise": exercise, "series": series, "repetitions": "\n".join(repetitions), "details": " ".join(details)}
        if is_superset:
            row["supersetExercises"] = exercise_lines
        rows.append(row)
    return rows


def _clean_table_cell(value) -> str:
    return " ".join(_clean_training_lines(value or ""))


def _parse_training_table(table: list) -> list:
    rows = []
    for columns in table[1:]:
        if not columns or not columns[0]:
            continue
        raw_exercise = columns[0]
        is_superset = raw_exercise.strip().upper().startswith("SUPERSERIE")
        exercise_lines = _clean_training_lines(re.sub(r"^\s*SUPERSERIE\s*", "", raw_exercise, flags=re.IGNORECASE))
        exercise_lines = [re.sub(r"^-\s*", "", line) for line in exercise_lines if line != "+"]
        row = {
            "exercise": " + ".join(exercise_lines) if is_superset else " ".join(exercise_lines),
            "series": _clean_table_cell(columns[1] if len(columns) > 1 else ""),
            "repetitions": "\n".join(_clean_training_lines(columns[2] if len(columns) > 2 else "")),
            "details": _clean_table_cell(columns[3] if len(columns) > 3 else ""),
        }
        if is_superset:
            row["supersetExercises"] = exercise_lines
        rows.append(row)
    return rows


def _parse_training(page_texts: list, page_tables=None):
    training_start = next((index for index, text in enumerate(page_texts) if re.search(r"^\s*ENTRENAMIENTO\s*$", text, re.IGNORECASE | re.MULTILINE)), None)
    if training_start is None:
        return None
    joined_training_pages = "\n".join(page_texts[training_start:])
    header = re.search(r"^\s*ENTRENAMIENTO\s*$", joined_training_pages, re.IGNORECASE | re.MULTILINE)
    training_text = joined_training_pages[header.end():] if header else joined_training_pages
    day_matches = list(_TRAINING_DAY_RE.finditer(training_text))
    tips_text = training_text[:day_matches[0].start()] if day_matches else training_text
    tips = []
    for line in _clean_training_lines(tips_text):
        if re.match(r"^(?:ENTRENAMIENTO|TIPS PARA CADA ENTRENAMIENTO)$", line, re.IGNORECASE):
            continue
        if line.startswith("-"):
            tips.append(re.sub(r"^-\s*", "", line))
        elif tips:
            tips[-1] += " " + line
    rest_match = re.search(r"descansos? entre series.*?(\d+)\s*segundos?", " ".join(tips), re.IGNORECASE)
    days = []
    for index, match in enumerate(day_matches):
        end = day_matches[index + 1].start() if index + 1 < len(day_matches) else len(training_text)
        body = training_text[match.end():end].strip()
        title = match.group(2).strip()
        active_rest = bool(re.search(r"DESCANSO\s+ACTIVO", title, re.IGNORECASE))
        days.append({
            "days": [int(value) for value in re.findall(r"\d+", match.group(1))],
            "title": title,
            "activeRest": active_rest,
            "details": " ".join(_clean_training_lines(body)) if active_rest else "",
            "exercises": [] if active_rest else _parse_exercise_rows(body),
        })
    if page_tables:
        for page_text, tables in zip(page_texts, page_tables):
            page_day = _TRAINING_DAY_RE.search(page_text)
            table = next((value for value in tables if value and value[0] and value[0][:4] == ["EJERCICIOS", "SERIES", "REPETICIONES", "DETALLES"]), None)
            if not page_day or not table:
                continue
            day_numbers = [int(value) for value in re.findall(r"\d+", page_day.group(1))]
            day = next((value for value in days if value["days"] == day_numbers), None)
            if day is not None:
                day["exercises"] = _parse_training_table(table)
    return {"tips": tips, "defaultRestSeconds": int(rest_match.group(1)) if rest_match else None, "days": days}


# ─── Main structure parsing ───────────────────────────────────────────────────


def parse_pdf_to_structure(pdf_path: str) -> dict:
    try:
        import pdfplumber
    except ImportError:
        return {"status": "error", "message": "pdfplumber not installed"}

    try:
        with pdfplumber.open(pdf_path) as pdf:
            all_page_texts = [page.extract_text() or "" for page in pdf.pages]
            all_page_tables = [page.extract_tables() for page in pdf.pages]
    except FileNotFoundError:
        return {"status": "error", "message": f"File not found: {pdf_path}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

    diet_page_texts = []
    for text in all_page_texts:
        if re.search(r"^\s*(?:SUPLEMENTACI[ÓO]N|ENTRENAMIENTO)\s*$", text, re.MULTILINE):
            break
        diet_page_texts.append(text)
    full_text = "\n".join(diet_page_texts)

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

    result = {"status": "ok", "diets": diets}
    training = _parse_training(all_page_texts, all_page_tables)
    if training is not None:
        result["training"] = training
    return result


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
        for (name_key, unit), entry in sorted(aggregation.items(), key=lambda x: x[0][0]):
            qty = entry["quantity"]
            qty_out = int(qty) if qty is not None and qty == int(qty) else qty
            totals.append({"ingredient": name_key, "quantity": qty_out, "unit": unit, "count": entry["count"]})

        print(json.dumps({"status": "ok", "totals": totals}, ensure_ascii=False))

    except Exception as exc:
        print(json.dumps({"status": "error", "message": str(exc)}))
        sys.exit(1)


def _add_item(aggregation, item):
    qty = item.get("quantity")
    unit = item.get("unit")
    name = item.get("name", "")
    name_key = name.lower().strip()
    key = (name_key, unit)
    entry = aggregation.setdefault(key, {"quantity": 0 if qty is not None else None, "count": 0})
    entry["count"] += 1
    if qty is not None:
        if entry["quantity"] is None:
            entry["quantity"] = 0
        entry["quantity"] += qty


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


def _xlsx_cell(reference: str, value) -> str:
    if isinstance(value, (int, float)):
        return f'<c r="{reference}"><v>{value}</v></c>'
    text = "" if value is None else str(value)
    return f'<c r="{reference}" t="inlineStr"><is><t>{escape(text)}</t></is></c>'


def _xlsx_column(index: int) -> str:
    label = ""
    while index:
        index, remainder = divmod(index - 1, 26)
        label = chr(65 + remainder) + label
    return label


def _xlsx_sheet(rows: list) -> str:
    xml_rows = []
    for row_index, row in enumerate(rows, 1):
        cells = "".join(
            _xlsx_cell(f"{_xlsx_column(column_index)}{row_index}", value)
            for column_index, value in enumerate(row, 1)
        )
        xml_rows.append(f'<row r="{row_index}">{cells}</row>')
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'<sheetData>{"".join(xml_rows)}</sheetData></worksheet>'
    )


def _write_xlsx(plan: dict, output_path: str):
    plan_rows = [["Día", "Dieta", "Comida", "Opción", "Ingredientes"]]
    for day in plan.get("days", []):
        for meal in day.get("meals", []):
            plan_rows.append([
                day.get("day"),
                day.get("diet"),
                meal.get("type"),
                meal.get("option"),
                " · ".join(meal.get("ingredients", [])),
            ])

    shopping_rows = [["Comprado", "Ingrediente", "Cantidad", "Unidad", "Apariciones"]]
    for item in plan.get("shopping_list", []):
        shopping_rows.append([
            "",
            item.get("name"),
            item.get("quantity"),
            item.get("unit"),
            item.get("count", 1),
        ])

    content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>'''
    root_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>'''
    workbook = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Plan semanal" sheetId="1" r:id="rId1"/><sheet name="Lista de compra" sheetId="2" r:id="rId2"/></sheets>
</workbook>'''
    workbook_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
</Relationships>'''

    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as workbook_file:
        workbook_file.writestr("[Content_Types].xml", content_types)
        workbook_file.writestr("_rels/.rels", root_rels)
        workbook_file.writestr("xl/workbook.xml", workbook)
        workbook_file.writestr("xl/_rels/workbook.xml.rels", workbook_rels)
        workbook_file.writestr("xl/worksheets/sheet1.xml", _xlsx_sheet(plan_rows))
        workbook_file.writestr("xl/worksheets/sheet2.xml", _xlsx_sheet(shopping_rows))


def cmd_export_plan(args):
    try:
        with open(args.plan_json_path, "r", encoding="utf-8") as source:
            plan = json.load(source)
        if args.format == "json":
            with open(args.output_path, "w", encoding="utf-8") as output:
                json.dump(plan, output, ensure_ascii=False, indent=2)
        else:
            _write_xlsx(plan, args.output_path)
        print(json.dumps({"status": "ok", "path": args.output_path}))
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
        "parse", help="Extract structured diet data from a PDF"
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

    plan_export_parser = subparsers.add_parser("export-plan", help="Export a weekly plan")
    plan_export_parser.add_argument("plan_json_path")
    plan_export_parser.add_argument("output_path")
    plan_export_parser.add_argument("format", choices=["json", "xlsx"])
    plan_export_parser.set_defaults(func=cmd_export_plan)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
