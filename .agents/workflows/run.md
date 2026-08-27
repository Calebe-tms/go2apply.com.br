---
description: Abre o painel desktop e inicia todos os serviços do ReadRelint automaticamente
---

# Workflow: Run (Iniciar Painel & Serviços)

Execute o comando abaixo para abrir o painel em primeiro plano e já iniciar todos os serviços automaticamente:

```powershell
& .\.venv\Scripts\python.exe painel.py --autostart
```

*(Ou dê duplo-clique no executável [Iniciar-Painel.bat](file:///e:/www/ReadRelint/Iniciar-Painel.bat))*

### O que o comando faz automaticamente:
1. Traz a janela do **Painel Desktop PyQt6** para a frente (não minimizada).
2. Inicia o **Backend FastAPI** (:8000).
3. Inicia o **Frontend SvelteKit** (:5173).
4. Abre o navegador automaticamente em `http://localhost:5173`.

