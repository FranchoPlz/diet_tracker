import importlib.util
import json
import unittest
import tempfile
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "diet_parser", ROOT / "src-tauri" / "python" / "diet_parser.py"
)
diet_parser = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(diet_parser)


class ParserUnitTests(unittest.TestCase):
    def test_normalizes_metric_and_practical_units(self):
        self.assertEqual(
            diet_parser._parse_single_item("1,5 kg de Pechuga de pollo"),
            {"name": "Pechuga de pollo", "quantity": 1500, "unit": "g"},
        )
        self.assertEqual(
            diet_parser._parse_single_item("0.75 l de Leche"),
            {"name": "Leche", "quantity": 750, "unit": "ml"},
        )
        self.assertEqual(
            diet_parser._parse_single_item("2 Latas de Atún"),
            {"name": "Atún", "quantity": 2, "unit": "lata"},
        )
        self.assertEqual(
            diet_parser._parse_single_item("1/2 Aguacate"),
            {"name": "Aguacate", "quantity": 0.5, "unit": "unidad"},
        )

    def test_keeps_unquantified_items_in_totals(self):
        aggregation = {}
        diet_parser._add_item(aggregation, {"name": "Canela", "quantity": None, "unit": None})
        diet_parser._add_item(aggregation, {"name": "Canela", "quantity": None, "unit": None})
        self.assertEqual(
            aggregation[("canela", None)],
            {"quantity": None, "count": 2},
        )

    def test_writes_excel_workbook_with_plan_and_shopping_sheets(self):
        plan = {
            "days": [{"day": 1, "diet": "DIETA 1", "meals": [{"type": "COMIDA", "option": "OPCIÓN 1", "ingredients": ["100 g Arroz"]}]}],
            "shopping_list": [{"name": "arroz", "quantity": 100, "unit": "g", "count": 1}],
        }
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "plan.xlsx"
            diet_parser._write_xlsx(plan, str(output))
            with zipfile.ZipFile(output) as workbook:
                self.assertIn("xl/worksheets/sheet1.xml", workbook.namelist())
                self.assertIn("xl/worksheets/sheet2.xml", workbook.namelist())
                self.assertIn("Plan semanal", workbook.read("xl/workbook.xml").decode())
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

    def test_parses_training_shape_and_superseries(self):
        training = diet_parser._parse_training([
            "SUPLEMENTACIÓN\n- Creatina\nENTRENAMIENTO\nTIPS PARA CADA ENTRENAMIENTO\n- Los descansos entre series van a ser de 60 segundos de máximo.\n- Beber agua.",
            "DÍA 1 – TORSO\nEJERCICIOS SERIES REPETICIONES DETALLES\nSUPERSERIE\nCurl de bíceps\n+\nPres francés\n4\n12 - 10 - 8 - 8\n10 - 10 - 10 - 10",
            "DÍA 2 y 3 – DESCANSO ACTIVO\n45 MINUTOS DE CAMINATA",
        ])
        self.assertEqual(training["defaultRestSeconds"], 60)
        self.assertNotIn("Creatina", " ".join(training["tips"]))
        self.assertEqual(training["days"][0]["exercises"][0], {
            "exercise": "Curl de bíceps + Pres francés",
            "series": "4",
            "repetitions": "12 - 10 - 8 - 8\n10 - 10 - 10 - 10",
            "details": "",
            "supersetExercises": ["Curl de bíceps", "Pres francés"],
        })
        self.assertEqual(training["days"][1]["days"], [2, 3])
        self.assertTrue(training["days"][1]["activeRest"])


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
        self.assertEqual(actual["status"], expected["status"])
        self.assertEqual(
            [diet["name"] for diet in actual["diets"]],
            [diet["name"] for diet in expected["diets"]],
        )
        self.assertEqual(
            [[(meal["type"], len(meal["options"])) for meal in diet["meals"]] for diet in actual["diets"]],
            [[(meal["type"], len(meal["options"])) for meal in diet["meals"]] for diet in expected["diets"]],
        )
        self.assertEqual(actual["training"]["defaultRestSeconds"], 60)
        self.assertEqual([day["days"] for day in actual["training"]["days"]], [[1], [2], [3], [4], [5], [6, 7]])
        self.assertEqual(actual["training"]["days"][2]["title"], "DESCANSO ACTIVO")
        self.assertTrue(any(row.get("supersetExercises") for row in actual["training"]["days"][0]["exercises"]))

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
        self.assertEqual(result["training"]["defaultRestSeconds"], 60)
        self.assertEqual([day["days"] for day in result["training"]["days"]], [[1], [2], [3], [4], [5], [6, 7]])
        self.assertEqual(result["training"]["days"][0]["title"], "TORSO")
        self.assertTrue(any(row.get("supersetExercises") for row in result["training"]["days"][1]["exercises"]))


if __name__ == "__main__":
    unittest.main()
