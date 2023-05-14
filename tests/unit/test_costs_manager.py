import pytest
from src.app.costs_manager import get_costs_ongoing_month


def test_get_costs_ongoing_month(mocker):
    mocker.patch(
        "src.app.costs_manager.ce.get_cost_and_usage",
        return_value={
            "ResultsByTime": [
                {
                    "TimePeriod": {"Start": "2023-05-01", "End": "2023-05-02"},
                    "Groups": [
                        {
                            "Keys": ["123456789012"],
                            "Metrics": {
                                "NetUnblendedCost": {"Amount": "-1.23", "Unit": "USD"}
                            },
                        }
                    ],
                    "Total": {},
                    "Estimated": True,
                }
            ]
        },
    )
    costs = get_costs_ongoing_month()
    assert len(costs) == 1
    assert costs[0]["TimePeriod"]["Start"] == "2023-05-01"
    assert costs[0]["Groups"][0]["Keys"][0] == "123456789012"
    assert costs[0]["Groups"][0]["Metrics"]["NetUnblendedCost"]["Amount"] == "-1.23"
