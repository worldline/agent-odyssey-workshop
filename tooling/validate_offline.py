"""Exercise corrections with a fake model and a loopback-only backend.
No hosted model calls, keys or Colab runtime. Run after installing notebook requirements.
"""
from __future__ import annotations
import json
import os
from pathlib import Path
from threading import Lock
import requests
import httpx
from pydantic import Field, PrivateAttr
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, SystemMessage, ToolMessage
from langchain_core.outputs import ChatGeneration, ChatResult

ROOT = Path(__file__).resolve().parents[1]
BACKEND = os.environ.get("OFFLINE_BACKEND_URL", "http://127.0.0.1:8000")
assert BACKEND.startswith("http://127.0.0.1:")
# This test must never contact a hosted model, even if inadvertently instantiated.
def blocked(*args, **kwargs):
    raise RuntimeError("Hosted HTTP clients are blocked during offline validation")
httpx.Client.send = blocked
httpx.AsyncClient.send = blocked
original_request = requests.sessions.Session.request
def local_request(self, method, url, *args, **kwargs):
    assert url.startswith(BACKEND + "/"), "Only the validation backend is allowed"
    return original_request(self, method, url, *args, **kwargs)
requests.sessions.Session.request = local_request

class OfflineModel(BaseChatModel):
    model_name: str = "ministral-8b-2512"
    roles: dict[str, int] = Field(default_factory=dict)
    scopes: dict[str, set[str]] = Field(default_factory=dict)
    _lock: Lock = PrivateAttr(default_factory=Lock)

    @property
    def _llm_type(self): return "mistralai-chat"
    @property
    def _identifying_params(self): return {"model_name": self.model_name}
    def _get_ls_params(self, stop=None, **kwargs):
        return {"ls_provider": "mistral", "ls_model_name": self.model_name}
    def bind_tools(self, tools, **kwargs): return self.bind(tools=tools, **kwargs)
    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        system = "\n".join(str(m.content) for m in messages if isinstance(m, SystemMessage))
        role = next((r for r in ["ORCHESTRATOR", "PRICING", "POLICY"] if "ROLE: " + r in system), None)
        assert role is not None, "Unexpected/generic subagent context"
        names = set()
        for t in kwargs.get("tools", []):
            names.add(t.name if hasattr(t,"name") else t.get("function",{}).get("name",t.get("name")))
        with self._lock:
            self.roles[role] = self.roles.get(role, 0) + 1
            self.scopes.setdefault(role,set()).update(names)
        results = [m for m in messages if isinstance(m, ToolMessage)]
        def call(name,args): return {"name":name,"args":args,"id":f"{role}-{len(messages)}-{name}"}
        if role == "ORCHESTRATOR":
            if not results:
                msg = AIMessage(content="",tool_calls=[call("task",{"subagent_type":"pricing","description":"Compare all payment fees for 100 EUR / 10000 cents."}),call("task",{"subagent_type":"policy","description":"Retrieve merchant rules for 100 EUR / 10000 cents."})])
            else: msg = AIMessage(content="Recommend Wallet, fee €1.30: allowed and within its cap.")
        elif role == "POLICY":
            if not results: msg=AIMessage(content="",tool_calls=[call("get_merchant_policy",{"amount_cents":10000})])
            else: msg=AIMessage(content=str(results[-1].content))
        else:
            quotes=[m for m in results if m.name=="get_payment_quote"]
            if quotes: msg=AIMessage(content="Mastercard fee: €1.60." if len(quotes)==1 else "Fees from API: Visa 170, Mastercard 160, Wallet 130, Bank transfer 50 cents.")
            elif not results: msg=AIMessage(content="",tool_calls=[call("list_payment_methods",{})])
            else:
                human=" ".join(str(m.content) for m in messages if m.type=="human")
                methods=["mastercard"] if "What is the Mastercard fee" in human else ["visa","mastercard","wallet","bank_transfer"]
                msg=AIMessage(content="",tool_calls=[call("get_payment_quote",{"amount_cents":10000,"payment_method":method}) for method in methods])
        return ChatResult(generations=[ChatGeneration(message=msg)])


def run(tp):
    path=ROOT/"notebooks/jupyter"/(tp+"-correction.ipynb")
    nb=json.loads(path.read_text()); ns={}; model=OfflineModel()
    for cell in nb["cells"]:
        if cell["cell_type"]!="code": continue
        tags=cell["metadata"].get("tags",[]); src="".join(cell["source"])
        if "install" in tags or "secret_setup" in tags or src.lstrip().startswith('probe = llm.invoke'): continue
        if "BACKEND_URL =" in src: src=src.replace('"http://127.0.0.1:8000"',repr(BACKEND))
        if "llm" not in ns: ns["llm"]=model
        exec(compile(src,str(path),"exec"),ns)
    expected={"PRICING"} if tp=="tp1" else {"PRICING","POLICY","ORCHESTRATOR"}
    assert set(model.roles)==expected
    assert model.scopes["PRICING"]=={"list_payment_methods","get_payment_quote"}
    if tp=="tp2":
        assert model.scopes["POLICY"]=={"get_merchant_policy"}
        assert model.scopes["ORCHESTRATOR"]=={"task"}, model.scopes
    print("PASS",tp,"actual framework/tool loops with fake model:",model.roles,model.scopes)

if __name__=="__main__":
    run("tp1");run("tp2")
