"""Static notebook validation: no installation, secret access or inference."""
from pathlib import Path
import ast
import json
ROOT = Path(__file__).resolve().parents[1]
files = sorted((ROOT / "notebooks").glob("*/*.ipynb"))
assert len(files) == 8, "Expected four Colab and four Jupyter notebooks"
for path in files:
    notebook = json.loads(path.read_text())
    assert notebook["nbformat"] == 4
    sources = []
    for cell in notebook["cells"]:
        assert cell["cell_type"] in {"code", "markdown"}
        source = "".join(cell["source"])
        if cell["cell_type"] == "code":
            assert cell["outputs"] == [] and cell["execution_count"] is None
            if "install" in cell["metadata"].get("tags", []):
                assert source.startswith("!pip" if path.parent.name == "colab" else "%pip")
            else:
                ast.parse(source)
            sources.append(source)
    code = "\n".join(sources)
    assert ("from google.colab import userdata" in code) == (path.parent.name == "colab")
    if path.name.startswith("tp2"):
        assert "create_deep_agent" in code and "GeneralPurposeSubagentProfile(enabled=False)" in code
        assert "def ask_pricing_agent" not in code and "def ask_policy_agent" not in code
    print("PASS", path.relative_to(ROOT))
print("No code cells executed; live Colab/provider validation is separate.")
