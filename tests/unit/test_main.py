import pytest
from fastapi.testclient import TestClient
from src.app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_get_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert b"Hello from Santi" in response.content


def test_get_status(client):
    response = client.get("/status")
    assert response.status_code == 200
    assert b"Healthy" in response.content


def test_get_costs_month_success(client, mocker):
    mocker.patch(
        "src.app.main.get_costs_ongoing_month",
        return_value=[
            {
                "TimePeriod": {"Start": "2023-05-01", "End": "2023-05-02"},
                # More fields here...
            }
        ],
    )
    response = client.get("/costs")
    assert response.status_code == 200
    assert b"This response corresponds to the monthly costs" in response.content
    assert b"TimePeriod" in response.content


def test_get_costs_month_failure(client, mocker):
    mocker.patch(
        "src.app.main.get_costs_ongoing_month", side_effect=Exception("Some Exception")
    )
    response = client.get("/costs")
    assert response.status_code == 500
    assert (
        b"There was a handled exception in the processing of the request"
        in response.content
    )
    assert b"Some Exception" in response.content
