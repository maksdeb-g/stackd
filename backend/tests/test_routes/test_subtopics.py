"""Tests for /subtopics route."""
from unittest.mock import patch, AsyncMock


class TestGetSubtopics:
    def test_blank_topic_returns_400(self, client):
        response = client.post("/subtopics", json={"topic": "   "})
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()

    def test_empty_topic_returns_400(self, client):
        response = client.post("/subtopics", json={"topic": ""})
        assert response.status_code == 400

    def test_missing_topic_field_returns_422(self, client):
        response = client.post("/subtopics", json={})
        assert response.status_code == 422

    def test_successful_subtopic_generation(self, client):
        subtopics = ["Variables", "Functions", "Loops", "Classes"]
        with patch("app.routes.subtopics.generate_subtopics", return_value=subtopics):
            response = client.post("/subtopics", json={"topic": "Python"})

        assert response.status_code == 200
        data = response.json()
        assert "subtopics" in data
        assert data["subtopics"] == subtopics

    def test_ai_service_error_returns_500(self, client):
        with patch(
            "app.routes.subtopics.generate_subtopics",
            side_effect=Exception("OpenAI timeout"),
        ):
            response = client.post("/subtopics", json={"topic": "Python"})

        assert response.status_code == 500
        assert "AI service error" in response.json()["detail"]

    def test_response_contains_subtopics_list(self, client):
        with patch("app.routes.subtopics.generate_subtopics", return_value=["A", "B"]):
            response = client.post("/subtopics", json={"topic": "Maths"})

        assert isinstance(response.json()["subtopics"], list)

    def test_empty_subtopics_list_is_valid(self, client):
        with patch("app.routes.subtopics.generate_subtopics", return_value=[]):
            response = client.post("/subtopics", json={"topic": "Rare topic"})

        assert response.status_code == 200
        assert response.json()["subtopics"] == []
