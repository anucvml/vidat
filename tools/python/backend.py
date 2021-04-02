# Example code for a Python backend to handle `submitURL` posts. See tools/backend
# for a more extensive example using nodejs to write the backend server.

import json
import uvicorn
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()
# Add cors configuration to allow requests from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set submitToken to bind this submission to its corresponding task
@app.post("/")
def demo(submitToken: str, annotation: dict = Body(...)):
    print("annotation:", json.dumps(annotation, sort_keys=True, indent=4, separators=(",", ":")))
    print("submitToken:", submitToken)
    return "OK"


if __name__ == "__main__":
    # 'backend' is the name of this file
    uvicorn.run(app="backend:app", host="localhost", port=8000, reload=True, debug=True)
