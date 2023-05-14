# SAMPLE PYTHON FAST-API APP FOR ECS DOCKER IMAGE TESTS
# - Santiago Garcia Arango
# - Fredy Andres Montano

import os
from fastapi import FastAPI, Response, status

from .costs_manager import get_costs_ongoing_month

app = FastAPI(
    description="Simple FastAPI to demo AWS integrations",
    version="0.1.0",
)

os_env_json = {}
for key, value in os.environ.items():
    os_env_json[key] = value


@app.get("/")
def get_root() -> dict:
    return {
        "Message": "Hello from Santi. This is a simple API to return current cost of AWS of the ongoing month",
        "OS Details": os_env_json,
    }


@app.get("/status")
def get_status() -> dict:
    return {"Status": "Healthy"}


@app.get("/costs", status_code=status.HTTP_200_OK)
def get_costs_month(response: Response) -> dict:
    try:
        costs = get_costs_ongoing_month()
    except Exception as e:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {
            "Message": "There was a handled exception in the processing of the request",
            "Details": str(e),
        }
    return {
        "Message": "This response corresponds to the monthly costs of this AWS account so far",
        "Costs": costs,
    }
