import datetime
import boto3

ce = boto3.client("ce")


def get_costs_ongoing_month():
    today = datetime.date.today()
    start = today.replace(day=1).strftime("%Y-%m-%d")
    end = today.strftime("%Y-%m-%d")
    response = ce.get_cost_and_usage(
        TimePeriod={
            "Start": start,
            "End": end,
        },
        Granularity="DAILY",
        Metrics=["NetUnblendedCost"],
        GroupBy=[{"Type": "DIMENSION", "Key": "LINKED_ACCOUNT"}],
    )
    return response["ResultsByTime"]
