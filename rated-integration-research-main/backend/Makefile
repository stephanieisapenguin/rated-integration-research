# Backend Makefile — FastAPI app for the Rated app.
#
# Quick start:
#   make install    # create venv and install deps
#   make dev        # run uvicorn with autoreload on http://localhost:8000
#
# All targets assume you're in the backend/ directory.

PYTHON ?= python3
VENV   ?= .venv
PIP    := $(VENV)/bin/pip
PY     := $(VENV)/bin/python
UVICORN := $(VENV)/bin/uvicorn
PORT   ?= 8000
HOST   ?= 0.0.0.0

.PHONY: help install dev run test lint format typecheck clean freeze

help:
	@echo "Targets:"
	@echo "  install   Create venv and install requirements.txt"
	@echo "  dev       Run uvicorn with --reload (local development)"
	@echo "  run       Run uvicorn without reload (production-ish)"
	@echo "  test      Run pytest"
	@echo "  lint      Run ruff"
	@echo "  format    Run ruff format + black"
	@echo "  typecheck Run mypy"
	@echo "  clean     Remove venv, caches, build artifacts"
	@echo "  freeze    Write current pip freeze to requirements.lock"

$(VENV)/bin/activate:
	$(PYTHON) -m venv $(VENV)
	$(PIP) install --upgrade pip

install: $(VENV)/bin/activate
	$(PIP) install -r requirements.txt

dev: install
	$(UVICORN) api:app --reload --host $(HOST) --port $(PORT)

run: install
	$(UVICORN) api:app --host $(HOST) --port $(PORT)

test: install
	$(PIP) install pytest >/dev/null
	$(VENV)/bin/pytest -q

lint: install
	$(PIP) install ruff >/dev/null
	$(VENV)/bin/ruff check .

format: install
	$(PIP) install ruff black >/dev/null
	$(VENV)/bin/ruff check --fix .
	$(VENV)/bin/black .

typecheck: install
	$(PIP) install mypy >/dev/null
	$(VENV)/bin/mypy .

freeze:
	$(PIP) freeze > requirements.lock

clean:
	rm -rf $(VENV) .pytest_cache .ruff_cache .mypy_cache __pycache__ */__pycache__
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
