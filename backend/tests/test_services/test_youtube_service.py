"""Tests for youtube_service."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.youtube_service import search_youtube, _infer_difficulty


# ─── _infer_difficulty ────────────────────────────────────────────────────────

class TestInferDifficulty:
    def test_beginner_default(self):
        assert _infer_difficulty("Python Basics", "Learn Python from scratch") == "beginner"

    def test_advanced_keyword_in_title(self):
        assert _infer_difficulty("Advanced Python Internals", "") == "advanced"

    def test_advanced_keyword_in_description(self):
        assert _infer_difficulty("Python", "A deep dive into CPython expert level") == "advanced"

    def test_intermediate_keyword_in_title(self):
        assert _infer_difficulty("Python Tutorial", "") == "intermediate"

    def test_intermediate_keyword_in_description(self):
        assert _infer_difficulty("Python", "A practical guide for mid-level developers") == "intermediate"

    def test_advanced_takes_precedence(self):
        # both 'advanced' and 'tutorial' present – advanced wins because checked first
        assert _infer_difficulty("Advanced Tutorial", "") == "advanced"

    def test_case_insensitive(self):
        assert _infer_difficulty("ADVANCED Python", "") == "advanced"
        assert _infer_difficulty("Intermediate Guide", "") == "intermediate"


# ─── search_youtube ───────────────────────────────────────────────────────────

class TestSearchYoutube:
    @pytest.mark.asyncio
    async def test_returns_empty_when_no_api_key(self):
        with patch("app.services.youtube_service.settings") as mock_settings:
            mock_settings.YOUTUBE_API_KEY = ""
            result = await search_youtube("python")
        assert result == []

    @pytest.mark.asyncio
    async def test_returns_empty_on_http_error(self):
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = Exception("HTTP 403")

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.services.youtube_service.settings") as mock_settings, \
             patch("httpx.AsyncClient", return_value=mock_client):
            mock_settings.YOUTUBE_API_KEY = "fake_key"
            result = await search_youtube("python")

        assert result == []

    @pytest.mark.asyncio
    async def test_parses_youtube_response(self):
        fake_data = {
            "items": [
                {
                    "id": {"videoId": "abc123"},
                    "snippet": {
                        "title": "Python Tutorial",
                        "description": "Learn Python from scratch",
                        "thumbnails": {"medium": {"url": "https://img.yt.com/thumb.jpg"}},
                    },
                },
                {
                    "id": {"videoId": "def456"},
                    "snippet": {
                        "title": "Advanced Python",
                        "description": "Expert-level Python",
                        "thumbnails": {},
                    },
                },
            ]
        }

        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = fake_data

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.services.youtube_service.settings") as mock_settings, \
             patch("httpx.AsyncClient", return_value=mock_client):
            mock_settings.YOUTUBE_API_KEY = "fake_key"
            result = await search_youtube("python")

        assert len(result) == 2
        assert result[0].source == "youtube"
        assert result[0].title == "Python Tutorial"
        assert result[0].link == "https://www.youtube.com/watch?v=abc123"
        assert result[0].thumbnail == "https://img.yt.com/thumb.jpg"
        assert result[0].difficulty == "intermediate"  # 'Tutorial' keyword

        assert result[1].title == "Advanced Python"
        assert result[1].difficulty == "advanced"
        assert result[1].thumbnail == ""  # no medium thumbnail

    @pytest.mark.asyncio
    async def test_description_truncated_to_300_chars(self):
        long_desc = "x" * 500
        fake_data = {
            "items": [
                {
                    "id": {"videoId": "z"},
                    "snippet": {
                        "title": "T",
                        "description": long_desc,
                        "thumbnails": {},
                    },
                }
            ]
        }

        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = fake_data

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.services.youtube_service.settings") as mock_settings, \
             patch("httpx.AsyncClient", return_value=mock_client):
            mock_settings.YOUTUBE_API_KEY = "fake_key"
            result = await search_youtube("python")

        assert len(result[0].description) == 300

    @pytest.mark.asyncio
    async def test_empty_description_fallback(self):
        fake_data = {
            "items": [
                {
                    "id": {"videoId": "z"},
                    "snippet": {"title": "T", "description": "", "thumbnails": {}},
                }
            ]
        }

        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = fake_data

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.services.youtube_service.settings") as mock_settings, \
             patch("httpx.AsyncClient", return_value=mock_client):
            mock_settings.YOUTUBE_API_KEY = "fake_key"
            result = await search_youtube("python")

        assert result[0].description == "No description available."

    @pytest.mark.asyncio
    async def test_empty_items_list(self):
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {"items": []}

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.services.youtube_service.settings") as mock_settings, \
             patch("httpx.AsyncClient", return_value=mock_client):
            mock_settings.YOUTUBE_API_KEY = "fake_key"
            result = await search_youtube("python")

        assert result == []
