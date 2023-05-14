# LOAD BALANCER TESTS TO VALIDATE ECS SERVICE SCALING UP AND DOWN THE ECS TASKS
# Usage:
# 1) Install required library for load testing (locust):
#    --> "pip install -r requirements.txt"
# 2) Run the Locust app as follows:
#    --> "python -m locust"
# 3) Go to Locust Web Portal
#    --> http://0.0.0.0:8089 (open local window)
# 4) Run the Locust testing tool with the necessary test requirements
#    --> Users, SpawnRate, Host, etc...
# 5) Wait for the magic of the ASG alarms being activated and the ECS services
#    updating the total value of tasks based on load


from locust import HttpUser, task


class ApiConsumerUser(HttpUser):
    @task
    def default(self):
        self.client.get("/")
        self.client.get("/status")
