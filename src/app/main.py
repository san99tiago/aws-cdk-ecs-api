# SAMPLE PYTHON FAST-API APP FOR ECS DOCKER IMAGE TESTS
# - Santiago Garcia Arango
# - Fredy Andres Montano

from fastapi import FastAPI, Response, status

from app.costs_manager import get_costs_ongoing_month

app = FastAPI(
    description="Simple FastAPI to demo AWS integrations",
    version="1.0.0",
)


@app.get("/")
def get_root():
    return {
        "Message": "Hello World from Santi. This is a simple API to return current cost of AWS of the ongoing month"
    }


@app.get("/api/status")
def get_status():
    return {"Status": "Healthy"}


@app.get("/costs", status_code=status.HTTP_200_OK)
def get_costs_month(response: Response):
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
