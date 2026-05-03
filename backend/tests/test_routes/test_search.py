"""Tests for /search route."""
from unittest.mock import patch, MagicMock
from app.models.schemas import Resource


def _make_resource(title="Test", source="youtube"):
    return Resource(title=title, source=source, description="Desc", link="https://x.com")


class TestUnifiedSearch:
    def test_empty_query_string_returns_422(self, client):
        """min_length=1 on the Query parameter should trigger a 422."""
        response = client.get("/search?query=")
        assert response.status_code == 422

    def test_whitespace_only_query_returns_400(self, client):
        with patch("app.routes.search.search_youtube", return_value=[]), \
             patch("app.routes.search.search_books", return_value=[]), \
             patch("app.routes.search.search_wikipedia", return_value=[]):
            response = client.get("/search?query=   ")
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()

    def test_missing_query_param_returns_422(self, client):
        response = client.get("/search")
        assert response.status_code == 422

    def test_successful_search_aggregates_all_sources(self, client, mock_supabase):
        yt = [_make_resource("YT Video", "youtube")]
        bk = [_make_resource("Book", "book")]
        wp = [_make_resource("Wiki Article", "wikipedia")]

        with patch("app.routes.search.search_youtube", return_value=yt), \
             patch("app.routes.search.search_books", return_value=bk), \
             patch("app.routes.search.search_wikipedia", return_value=wp):
            response = client.get("/search?query=python")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        titles = {r["title"] for r in data}
        assert titles == {"YT Video", "Book", "Wiki Article"}

    def test_service_exception_is_skipped(self, client):
        """If a service raises, its results are omitted from the response."""
        bk = [_make_resource("Book", "book")]
        with patch("app.routes.search.search_youtube", side_effect=Exception("YT down")), \
             patch("app.routes.search.search_books", return_value=bk), \
             patch("app.routes.search.search_wikipedia", return_value=[]):
            response = client.get("/search?query=python")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Book"

    def test_all_services_fail_returns_empty_list(self, client):
        with patch("app.routes.search.search_youtube", side_effect=Exception("down")), \
             patch("app.routes.search.search_books", side_effect=Exception("down")), \
             patch("app.routes.search.search_wikipedia", side_effect=Exception("down")):
            response = client.get("/search?query=python")

        assert response.status_code == 200
        assert response.json() == []

    def test_db_failure_is_non_fatal(self, client, mock_supabase):
        """Search history insert failure must not break the response."""
        mock_supabase.execute.side_effect = Exception("DB connection refused")

        yt = [_make_resource("YT Video", "youtube")]
        with patch("app.routes.search.search_youtube", return_value=yt), \
             patch("app.routes.search.search_books", return_value=[]), \
             patch("app.routes.search.search_wikipedia", return_value=[]):
            response = client.get("/search?query=python")

        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_returns_correct_resource_structure(self, client):
        resource = _make_resource("My Video", "youtube")
        with patch("app.routes.search.search_youtube", return_value=[resource]), \
             patch("app.routes.search.search_books", return_value=[]), \
             patch("app.routes.search.search_wikipedia", return_value=[]):
            response = client.get("/search?query=python")

        data = response.json()
        assert "title" in data[0]
        assert "source" in data[0]
        assert "description" in data[0]
        assert "link" in data[0]
        assert "difficulty" in data[0]
