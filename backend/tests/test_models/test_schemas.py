"""Tests for Pydantic schema validation."""
import pytest
from datetime import datetime
from pydantic import ValidationError

from app.models.schemas import (
    Resource,
    Folder,
    FolderCreate,
    SaveResourceRequest,
    ProgressUpdate,
    SubtopicRequest,
    SubtopicResponse,
    SearchHistoryItem,
)


# ─── Resource ────────────────────────────────────────────────────────────────

class TestResource:
    def test_valid_resource(self):
        r = Resource(title="Learn Python", source="youtube", description="A video", link="https://example.com")
        assert r.title == "Learn Python"
        assert r.source == "youtube"
        assert r.difficulty == "beginner"  # default
        assert r.id is None
        assert r.thumbnail is None

    def test_resource_with_all_fields(self):
        r = Resource(
            id="abc123",
            title="Advanced Python",
            source="book",
            description="Deep dive",
            thumbnail="https://img.example.com/thumb.jpg",
            link="https://books.google.com/",
            difficulty="advanced",
        )
        assert r.id == "abc123"
        assert r.difficulty == "advanced"

    def test_resource_invalid_source(self):
        with pytest.raises(ValidationError):
            Resource(title="X", source="unknown_source", description="D", link="https://x.com")

    def test_resource_invalid_difficulty(self):
        with pytest.raises(ValidationError):
            Resource(title="X", source="book", description="D", link="https://x.com", difficulty="expert")

    def test_resource_missing_required_fields(self):
        with pytest.raises(ValidationError):
            Resource(source="book", description="D", link="https://x.com")  # missing title

    @pytest.mark.parametrize("source", ["youtube", "book", "wikipedia"])
    def test_resource_all_valid_sources(self, source):
        r = Resource(title="T", source=source, description="D", link="https://x.com")
        assert r.source == source

    @pytest.mark.parametrize("difficulty", ["beginner", "intermediate", "advanced"])
    def test_resource_all_valid_difficulties(self, difficulty):
        r = Resource(title="T", source="book", description="D", link="https://x.com", difficulty=difficulty)
        assert r.difficulty == difficulty


# ─── FolderCreate ─────────────────────────────────────────────────────────────

class TestFolderCreate:
    def test_defaults(self):
        fc = FolderCreate(name="My Folder")
        assert fc.name == "My Folder"
        assert fc.color == "#6366f1"

    def test_custom_color(self):
        fc = FolderCreate(name="Red Folder", color="#ff0000")
        assert fc.color == "#ff0000"

    def test_missing_name_raises(self):
        with pytest.raises(ValidationError):
            FolderCreate()


# ─── Folder ───────────────────────────────────────────────────────────────────

class TestFolder:
    def test_valid_folder(self):
        f = Folder(id="1", name="Science", color="#abc123")
        assert f.id == "1"
        assert f.created_at is None

    def test_folder_with_datetime(self):
        now = datetime.now()
        f = Folder(id="2", name="Maths", color="#ffffff", created_at=now)
        assert f.created_at == now


# ─── SaveResourceRequest ──────────────────────────────────────────────────────

class TestSaveResourceRequest:
    def test_valid(self):
        req = SaveResourceRequest(
            folder_id="f1",
            title="ML Book",
            source="book",
            description="A book about ML",
            link="https://books.google.com/",
        )
        assert req.folder_id == "f1"
        assert req.difficulty == "beginner"  # default
        assert req.thumbnail is None

    def test_with_thumbnail(self):
        req = SaveResourceRequest(
            folder_id="f1",
            title="T",
            source="youtube",
            description="D",
            link="https://yt.com",
            thumbnail="https://img.yt.com/thumb.jpg",
            difficulty="intermediate",
        )
        assert req.thumbnail == "https://img.yt.com/thumb.jpg"
        assert req.difficulty == "intermediate"


# ─── ProgressUpdate ───────────────────────────────────────────────────────────

class TestProgressUpdate:
    @pytest.mark.parametrize("status", ["WANT_TO_LEARN", "IN_PROGRESS", "DONE"])
    def test_valid_statuses(self, status):
        p = ProgressUpdate(status=status)
        assert p.status == status

    def test_invalid_status(self):
        with pytest.raises(ValidationError):
            ProgressUpdate(status="COMPLETED")


# ─── SubtopicRequest / SubtopicResponse ──────────────────────────────────────

class TestSubtopicSchemas:
    def test_subtopic_request(self):
        req = SubtopicRequest(topic="Machine Learning")
        assert req.topic == "Machine Learning"

    def test_subtopic_response(self):
        resp = SubtopicResponse(subtopics=["Intro", "Regression", "Neural Nets"])
        assert len(resp.subtopics) == 3

    def test_subtopic_response_empty_list(self):
        resp = SubtopicResponse(subtopics=[])
        assert resp.subtopics == []


# ─── SearchHistoryItem ────────────────────────────────────────────────────────

class TestSearchHistoryItem:
    def test_valid(self):
        item = SearchHistoryItem(
            id="h1",
            query="python basics",
            result_count=12,
            created_at=datetime.now(),
        )
        assert item.query == "python basics"
        assert item.result_count == 12
