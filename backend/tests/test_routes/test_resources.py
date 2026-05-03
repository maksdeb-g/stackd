"""Tests for /resources route."""
from unittest.mock import MagicMock


SAVE_PAYLOAD = {
    "folder_id": "folder-1",
    "title": "Learn Python",
    "source": "youtube",
    "description": "A great tutorial",
    "link": "https://youtube.com/watch?v=abc",
    "difficulty": "beginner",
}


class TestSaveResource:
    def test_save_resource_returns_201(self, client, mock_supabase):
        saved = {**SAVE_PAYLOAD, "id": "res-1", "status": "WANT_TO_LEARN", "created_at": "2024-01-01T00:00:00"}
        mock_supabase.execute.return_value = MagicMock(data=[saved])

        response = client.post("/resources/save", json=SAVE_PAYLOAD)

        assert response.status_code == 201
        data = response.json()
        assert data["id"] == "res-1"
        assert data["status"] == "WANT_TO_LEARN"

    def test_default_status_is_want_to_learn(self, client, mock_supabase):
        saved = {**SAVE_PAYLOAD, "id": "res-2", "status": "WANT_TO_LEARN"}
        mock_supabase.execute.return_value = MagicMock(data=[saved])

        response = client.post("/resources/save", json=SAVE_PAYLOAD)

        assert response.json()["status"] == "WANT_TO_LEARN"

    def test_save_resource_missing_required_field_returns_422(self, client):
        incomplete = {k: v for k, v in SAVE_PAYLOAD.items() if k != "title"}
        response = client.post("/resources/save", json=incomplete)
        assert response.status_code == 422

    def test_db_error_returns_500(self, client, mock_supabase):
        mock_supabase.execute.side_effect = Exception("insert failed")

        response = client.post("/resources/save", json=SAVE_PAYLOAD)

        assert response.status_code == 500


class TestGetResourcesInFolder:
    def test_returns_resources_for_folder(self, client, mock_supabase):
        resources = [
            {"id": "r1", "title": "Python Video", "folder_id": "folder-1", "status": "DONE"},
            {"id": "r2", "title": "ML Book", "folder_id": "folder-1", "status": "IN_PROGRESS"},
        ]
        mock_supabase.execute.return_value = MagicMock(data=resources)

        response = client.get("/resources/folder/folder-1")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_returns_empty_list_for_empty_folder(self, client, mock_supabase):
        mock_supabase.execute.return_value = MagicMock(data=[])

        response = client.get("/resources/folder/empty-folder")

        assert response.status_code == 200
        assert response.json() == []

    def test_db_error_returns_500(self, client, mock_supabase):
        mock_supabase.execute.side_effect = Exception("query failed")

        response = client.get("/resources/folder/folder-1")

        assert response.status_code == 500


class TestUpdateProgress:
    def test_valid_status_update(self, client, mock_supabase):
        updated = {"id": "res-1", "status": "IN_PROGRESS"}
        mock_supabase.execute.return_value = MagicMock(data=[updated])

        response = client.patch("/resources/progress/res-1", json={"status": "IN_PROGRESS"})

        assert response.status_code == 200
        assert response.json()["status"] == "IN_PROGRESS"

    def test_all_valid_statuses_accepted(self, client, mock_supabase):
        for status in ["WANT_TO_LEARN", "IN_PROGRESS", "DONE"]:
            mock_supabase.execute.return_value = MagicMock(data=[{"id": "r1", "status": status}])
            response = client.patch("/resources/progress/r1", json={"status": status})
            assert response.status_code == 200

    def test_invalid_status_returns_422(self, client):
        # Pydantic's Literal validation rejects the value before the route handler
        # fires, so the framework returns 422 Unprocessable Entity.
        response = client.patch("/resources/progress/res-1", json={"status": "UNKNOWN"})
        assert response.status_code == 422

    def test_resource_not_found_returns_404(self, client, mock_supabase):
        mock_supabase.execute.return_value = MagicMock(data=[])

        response = client.patch("/resources/progress/nonexistent", json={"status": "DONE"})

        assert response.status_code == 404
        assert "Resource not found" in response.json()["detail"]

    def test_db_error_returns_500(self, client, mock_supabase):
        mock_supabase.execute.side_effect = Exception("update failed")

        response = client.patch("/resources/progress/res-1", json={"status": "DONE"})

        assert response.status_code == 500


class TestDeleteResource:
    def test_delete_returns_204(self, client, mock_supabase):
        mock_supabase.execute.return_value = MagicMock(data=[])

        response = client.delete("/resources/res-1")

        assert response.status_code == 204

    def test_db_error_returns_500(self, client, mock_supabase):
        mock_supabase.execute.side_effect = Exception("delete failed")

        response = client.delete("/resources/res-1")

        assert response.status_code == 500


class TestGetAllProgress:
    def test_returns_all_resources(self, client, mock_supabase):
        resources = [
            {"id": "r1", "status": "DONE"},
            {"id": "r2", "status": "IN_PROGRESS"},
            {"id": "r3", "status": "WANT_TO_LEARN"},
        ]
        mock_supabase.execute.return_value = MagicMock(data=resources)

        response = client.get("/resources/progress/all")

        assert response.status_code == 200
        assert len(response.json()) == 3

    def test_db_error_returns_500(self, client, mock_supabase):
        mock_supabase.execute.side_effect = Exception("query failed")

        response = client.get("/resources/progress/all")

        assert response.status_code == 500
