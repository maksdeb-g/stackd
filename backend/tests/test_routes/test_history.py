"""Tests for /history route."""
from unittest.mock import MagicMock


class TestGetSearchHistory:
    def test_returns_history_list(self, client, mock_supabase):
        history = [
            {"id": "h1", "query": "python", "result_count": 10, "searched_at": "2024-01-02T00:00:00"},
            {"id": "h2", "query": "machine learning", "result_count": 8, "searched_at": "2024-01-01T00:00:00"},
        ]
        mock_supabase.execute.return_value = MagicMock(data=history)

        response = client.get("/history")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["query"] == "python"

    def test_returns_empty_list_when_no_history(self, client, mock_supabase):
        mock_supabase.execute.return_value = MagicMock(data=[])

        response = client.get("/history")

        assert response.status_code == 200
        assert response.json() == []

    def test_db_failure_returns_empty_list_not_500(self, client, mock_supabase):
        """History endpoint should swallow DB errors and return [] instead of 500."""
        mock_supabase.execute.side_effect = Exception("DB unavailable")

        response = client.get("/history")

        assert response.status_code == 200
        assert response.json() == []

    def test_custom_limit_accepted(self, client, mock_supabase):
        mock_supabase.execute.return_value = MagicMock(data=[])

        response = client.get("/history?limit=5")

        assert response.status_code == 200

    def test_default_limit_is_20(self, client, mock_supabase):
        """Verify limit is chained onto the query."""
        mock_supabase.execute.return_value = MagicMock(data=[])
        client.get("/history")
        mock_supabase.limit.assert_called_with(20)

    def test_response_items_have_expected_keys(self, client, mock_supabase):
        item = {"id": "h1", "query": "python", "result_count": 5, "searched_at": "2024-01-01T00:00:00"}
        mock_supabase.execute.return_value = MagicMock(data=[item])

        response = client.get("/history")

        data = response.json()
        assert "id" in data[0]
        assert "query" in data[0]
        assert "result_count" in data[0]
