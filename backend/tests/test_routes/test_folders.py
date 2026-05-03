"""Tests for /folders route."""
from unittest.mock import MagicMock, patch


class TestListFolders:
    def test_returns_folder_list(self, client, mock_supabase):
        fake_folders = [
            {"id": "1", "name": "Science", "color": "#abc", "created_at": "2024-01-01T00:00:00"},
            {"id": "2", "name": "Maths", "color": "#def", "created_at": "2024-01-02T00:00:00"},
        ]
        mock_supabase.execute.return_value = MagicMock(data=fake_folders)

        response = client.get("/folders")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["name"] == "Science"

    def test_returns_empty_list_when_no_folders(self, client, mock_supabase):
        mock_supabase.execute.return_value = MagicMock(data=[])

        response = client.get("/folders")

        assert response.status_code == 200
        assert response.json() == []

    def test_db_error_returns_500(self, client, mock_supabase):
        mock_supabase.execute.side_effect = Exception("connection error")

        response = client.get("/folders")

        assert response.status_code == 500


class TestCreateFolder:
    def test_creates_folder_with_defaults(self, client, mock_supabase):
        new_folder = {"id": "abc", "name": "History", "color": "#6366f1", "created_at": "2024-01-01T00:00:00"}
        mock_supabase.execute.return_value = MagicMock(data=[new_folder])

        response = client.post("/folders", json={"name": "History"})

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "History"
        assert data["color"] == "#6366f1"

    def test_creates_folder_with_custom_color(self, client, mock_supabase):
        new_folder = {"id": "xyz", "name": "Art", "color": "#ff5733", "created_at": "2024-01-01T00:00:00"}
        mock_supabase.execute.return_value = MagicMock(data=[new_folder])

        response = client.post("/folders", json={"name": "Art", "color": "#ff5733"})

        assert response.status_code == 201
        assert response.json()["color"] == "#ff5733"

    def test_missing_name_returns_422(self, client):
        response = client.post("/folders", json={})
        assert response.status_code == 422

    def test_db_error_returns_500(self, client, mock_supabase):
        mock_supabase.execute.side_effect = Exception("insert failed")

        response = client.post("/folders", json={"name": "Broken"})

        assert response.status_code == 500


class TestDeleteFolder:
    def test_delete_folder_returns_204(self, client, mock_supabase):
        mock_supabase.execute.return_value = MagicMock(data=[])

        response = client.delete("/folders/folder-123")

        assert response.status_code == 204

    def test_delete_also_removes_resources(self, client, mock_supabase):
        """Deletion should call delete on saved_resources AND folders tables."""
        calls = []
        original_table = mock_supabase.table

        def track_table(name):
            calls.append(name)
            return mock_supabase

        mock_supabase.table.side_effect = track_table

        client.delete("/folders/folder-abc")

        assert "saved_resources" in calls
        assert "folders" in calls

    def test_db_error_returns_500(self, client, mock_supabase):
        mock_supabase.execute.side_effect = Exception("db error")

        response = client.delete("/folders/bad-id")

        assert response.status_code == 500
