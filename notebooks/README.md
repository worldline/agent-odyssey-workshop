# Agent notebooks

**Colab notebooks are maintained directly in Google Colab.** This repository stores only the four local Jupyter notebooks. Shared exercise logic is mirrored by the maintainer; environment-specific setup remains different.

| TP | Colab template | Colab correction | Jupyter template | Jupyter correction |
|---|---|---|---|---|
| TP1 — Pricing | [Open Colab](https://colab.research.google.com/drive/1FRyi_XadXG1uDxwxBq3amjozduWyIr6E?#copy=true) | [Open Colab](https://colab.research.google.com/drive/1OcfUxo_CEe-J1tAO9ZYQxo2cpK278umW?#copy=true) | [Jupyter file](jupyter/tp1-template.ipynb) | [Jupyter file](jupyter/tp1-correction.ipynb) |
| TP2 — DeepAgents | [Open Colab](https://colab.research.google.com/drive/1UcEoBx8Hs4olAIsteLoklu9aEZsiv4tf?#copy=true) | [Open Colab](https://colab.research.google.com/drive/1505Q1ntRog-ZksFYCmsBy_-imFcErLqa?#copy=true) | [Jupyter file](jupyter/tp2-template.ipynb) | [Jupyter file](jupyter/tp2-correction.ipynb) |

## Start

Colab: personal Gmail; the workshop key is supplied privately and saved as MISTRAL_API_KEY in Colab Secrets. No personal Mistral account or billing is required for workshop participants. Independent users provide their own API access. Local Jupyter: Python 3.11+ kernel, %pip installation and an environment variable/masked key prompt; no google.colab import. Requests is pinned to 2.32.4, matching the Google Colab base runtime's exact requirement.

Start the [service](../harness/solution/) separately. Local Jupyter on its machine can use localhost; Colab needs the direct public HTTPS backend URL. Service/model checks are separate. Live model cells consume API allowance.

## Maintenance

Edit the original Colab template/correction in Google, not a participant copy. After each exercise-content change, update the corresponding Jupyter notebook and commit it. Preserve local setup instead of copying Colab userdata/installation cells. Clear outputs and check syntax before publication. There is no Colab notebook generator or authenticated Google sync in CI.

The participant links use the requested ?#copy=true form. Google sharing permissions must allow the intended participants to open their copies. CI checks only the four repository Jupyter files; live Colab/Mistral validation is separate.
