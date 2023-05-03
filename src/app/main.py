# SAMPLE PYTHON FAST-API APP FOR ECS DOCKER IMAGE TESTS
# - Santiago Garcia Arango
# - Fredy Andres Montano

from typing import Union

from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root():
    return {"Message": "Hello World from Santi"}


@app.get("/items/{item_id}")
def read_item(item_id: int, filter: Union[str, None] = None):
    return {
        "item_id": item_id,
        "filter": filter,
        "Message": "Awesome item from Santi",
    }
