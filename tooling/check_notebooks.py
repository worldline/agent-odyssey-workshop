"""Static notebook validation: no installation, secret access or inference."""
from pathlib import Path
import ast
import json
ROOT = Path(__file__).resolve().parents[1]
files = sorted((ROOT / "notebooks").glob("*/*.ipynb"))
assert len(files) == 4 and all(p.parent.name == "jupyter" for p in files), "Repository must contain only four local Jupyter notebooks"
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
                assert source.startswith("%pip")
            else:
                ast.parse(source)
            sources.append(source)
    code = "\n".join(sources)
    install_cells = [source for cell in notebook["cells"] if cell["cell_type"] == "code" and "install" in cell["metadata"].get("tags", []) for source in ["".join(cell["source"])]]
    assert len(install_cells) == 1 and "requests==2.32.4" in install_cells[0]
    assert "requests==2.34.2" not in code
    assert "from google.colab import userdata" not in code
    if path.name.startswith("tp2"):
        assert "create_deep_agent" in code and "GeneralPurposeSubagentProfile(enabled=False)" in code
        assert "def ask_pricing_agent" not in code and "def ask_policy_agent" not in code
    print("PASS", path.relative_to(ROOT))
requirements = (ROOT / "notebooks/requirements-tp1.txt").read_text()
assert "requests==2.32.4" in requirements and "requests==2.34.2" not in requirements
print("Requests pinned to the Colab-compatible 2.32.4 in all four Jupyter setup cells; no code cells executed. Live Colab/provider validation is separate.")
