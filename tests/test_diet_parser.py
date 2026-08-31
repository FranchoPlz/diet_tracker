import importlib.util
import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "diet_parser", ROOT / "src-tauri" / "python" / "diet_parser.py"
)
diet_parser = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(diet_parser)


class ParserUnitTests(unittest.TestCase):
    def test_accepts_pdf_heading_variations(self):
        self.assertTrue(diet_parser._is_option_header("- OPCIÓN 1"))
        self.assertTrue(diet_parser._is_option_header("OPCION 3 – PANCAKES"))
        self.assertEqual(
            diet_parser._parse_option_name("- OPCIÓN 1"), ("OPCIÓN 1", None)
        )

    def test_recognizes_ingredients_without_a_dash(self):
        lines = diet_parser._join_wrapped_lines(
            "-50g de Tomate Frito.\n70g de Queso Mozzarella / 80g de Queso Feta."
        )
        self.assertEqual(
            lines,
            [
                "-50g de Tomate Frito.",
                "-70g de Queso Mozzarella / 80g de Queso Feta.",
            ],
        )

    def test_keeps_wrapped_alternatives_together(self):
        lines = diet_parser._join_wrapped_lines(
            "-80g de Pasta /\n250g de Garbanzos / 160g de Gnocchis."
        )
        self.assertEqual(
            lines, ["-80g de Pasta / 250g de Garbanzos / 160g de Gnocchis."]
        )


@unittest.skipUnless(
    importlib.util.find_spec("pdfplumber"), "install src-tauri/python/requirements.txt"
)
class PdfRegressionTests(unittest.TestCase):
    def test_abril_output_matches_existing_golden_file(self):
        actual = diet_parser.parse_pdf_to_structure(str(ROOT / "ABRIL.pdf"))
        with (ROOT / "tests" / "fixtures" / "abril_golden.json").open(
            encoding="utf-8"
        ) as fixture:
            expected = json.load(fixture)
        self.assertEqual(actual, expected)

    def test_september_reads_all_diet_pages_and_layout_variations(self):
        result = diet_parser.parse_pdf_to_structure(str(ROOT / "SEPTIEMBRE.pdf"))

        self.assertEqual(result["status"], "ok")
        self.assertEqual([diet["name"] for diet in result["diets"]], ["DIETA 1", "DIETA 2"])

        diet_1, diet_2 = result["diets"]
        lunch_1 = next(meal for meal in diet_1["meals"] if meal["type"] == "ALMUERZO")
        dinner_1 = next(meal for meal in diet_1["meals"] if meal["type"] == "CENA")
        snack_2 = next(meal for meal in diet_2["meals"] if meal["type"] == "MERIENDA")
        dinner_2 = next(meal for meal in diet_2["meals"] if meal["type"] == "CENA")

        self.assertEqual([option["name"] for option in lunch_1["options"]], [
            "OPCIÓN 1",
            "OPCIÓN 2 – BIZCOCHO DE COCO",
        ])
        self.assertIn("OPCION 3 – PANCAKES DE VERDURA RELLENOS", [
            option["name"] for option in dinner_1["options"]
        ])
        self.assertTrue(any(
            item["name"] == "Frutos secos a elegir"
            for option in snack_2["options"]
            for line in option["ingredient_lines"]
            for item in line["items"]
        ))
        self.assertIn("OPCIÓN 3 – SMASH BURGUER", [
            option["name"] for option in dinner_2["options"]
        ])


if __name__ == "__main__":
    unittest.main()
