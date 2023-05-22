#!/bin/bash

################################################################################
# ------------------------------------------------------------------------------
# | PYTHON COMMANDS (FOR EXPLAINING ITS USAGE)
# ------------------------------------------------------------------------------
################################################################################

# Install Python
# -->  https://www.python.org/downloads/

# Verify that Python is installed correctly
python --version

# Install Poetry for managing Python dependencies
pip install poetry

# Configure Poetry to create virtual environments in the same folder
poetry config virtualenvs.in-project true

# Install Python dependencies using Poetry
poetry install

# Initialize interactive shell with Poetry
poetry shell

# Add/remove Python main code dependency
poetry add dependency_name
poetry remove dependency_name

# Add/remove Python specific group dependency (for testing or other purpose)
poetry add dependency_name --group test-unit
poetry remove dependency_name --group test-unit

# Run poetry tasks for testing the source code (unit/integration tests)
# --> Search inside "pyproject.toml" the poe tasks for details
poe test-unit
poe test-unit-html
poe test-integration-load-manual
poe test-integration-load-auto

# Finish/Exit the interactive shell with Poetry
deactivate
