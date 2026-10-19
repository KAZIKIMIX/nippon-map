import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("aliases", Path(__file__).with_name("jreast-route-aliases.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class RouteAliasesTest(unittest.TestCase):
    def test_known_aliases(self):
        for short, full in (("信越線", "信越本線"), ("羽越線", "羽越本線"), ("東北線", "東北本線"), ("中央線", "中央本線")):
            self.assertTrue(module.route_matches([short], full))
            self.assertTrue(module.route_matches([full], short))

    def test_reject_unrelated_lines(self):
        self.assertFalse(module.route_matches(["羽越線"], "信越本線"))
        self.assertFalse(module.route_matches(["東北新幹線"], "東北本線"))
        self.assertFalse(module.route_matches(["越後線"], "信越本線"))

    def test_whitespace_and_empty(self):
        self.assertTrue(module.route_matches([" 信越線 "], "信越本線"))
        self.assertFalse(module.route_matches([], "信越本線"))

if __name__ == "__main__":
    unittest.main()
