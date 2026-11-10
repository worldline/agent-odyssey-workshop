# Agent notebooks

Four browser-hosted Colab variants and four local Jupyter variants. Environment setup differs; exercise code is generated from shared content. Every file starts with cleared outputs.

| TP | Colab template | Colab correction | Jupyter template | Jupyter correction |
|---|---|---|---|---|
| TP1 — Pricing | [Open in Colab](https://colab.research.google.com/github/worldline/agent-odyssey-workshop/blob/main/notebooks/colab/tp1-template.ipynb) | [Open in Colab](https://colab.research.google.com/github/worldline/agent-odyssey-workshop/blob/main/notebooks/colab/tp1-correction.ipynb) | [Download](jupyter/tp1-template.ipynb) | [Download](jupyter/tp1-correction.ipynb) |
| TP2 — DeepAgents | [Open in Colab](https://colab.research.google.com/github/worldline/agent-odyssey-workshop/blob/main/notebooks/colab/tp2-template.ipynb) | [Open in Colab](https://colab.research.google.com/github/worldline/agent-odyssey-workshop/blob/main/notebooks/colab/tp2-correction.ipynb) | [Download](jupyter/tp2-template.ipynb) | [Download](jupyter/tp2-correction.ipynb) |

## Start

Colab: personal Gmail; secret MISTRAL_API_KEY with notebook access. Local Jupyter: Python 3.11+ kernel; the notebook uses %pip and an environment variable/masked key prompt, with no google.colab import. Select the matching file; do not copy Colab setup cells to local Jupyter.

Start the [service](../harness/solution/) separately. Local Jupyter on its machine can use localhost; Colab needs the direct public HTTPS backend URL. Each notebook configures its own backend/model and checks them independently. Only live model/probe cells consume API allowance. API access/free credits are not guaranteed.

TP2 uses DeepAgents 0.7.34 with two isolated dictionary subagents and task delegation. The workshop profile disables the default general-purpose subagent and unrelated filesystem/planning tools. Evidence captures actual specialist HTTP calls during each mission. This tiny scenario demonstrates boundaries, not a requirement for multi-agent design.

The presenter will verify Colab opening/imports and actual Mistral execution separately. Offline simulation checks are not live-provider validation.
