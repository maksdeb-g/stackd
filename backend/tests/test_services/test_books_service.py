"""Tests for books_service."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.books_service import search_books, _infer_difficulty


# ─── _infer_difficulty ────────────────────────────────────────────────────────

class TestInferDifficulty:
    def test_beginner_default(self):
        assert _infer_difficulty([], "A simple introduction") == "beginner"

    def test_advanced_from_category(self):
        assert _infer_difficulty(["Graduate Studies"], "") == "advanced"

    def test_advanced_from_description(self):
        assert _infer_difficulty([], "A research-level monograph") == "advanced"

    def test_intermediate_from_category(self):
        assert _infer_difficulty(["Professional Development"], "") == "intermediate"

    def test_intermediate_from_description(self):
        assert _infer_difficulty([], "A practical guide for working developers") == "intermediate"

    def test_theory_keyword_maps_to_advanced(self):
        assert _infer_difficulty([], "Category theory and its applications") == "advanced"

    def test_case_insensitive(self):
        assert _infer_difficulty(["ADVANCED Mathematics"], "") == "advanced"


# ─── search_books ─────────────────────────────────────────────────────────────

class TestSearchBooks:
    @pytest.mark.asyncio
    async def test_returns_empty_on_http_error(self):
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = Exception("503")

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_client):
            result = await search_books("python")

        assert result == []

    @pytest.mark.asyncio
    async def test_parses_books_response(self):
        fake_data = {
            "items": [
                {
                    "id": "book1",
                    "volumeInfo": {
                        "title": "Fluent Python",
                        "authors": ["Luciano Ramalho"],
                        "description": "A practical guide to Python 3",
                        "categories": ["Computers"],
                        "imageLinks": {"thumbnail": "https://books.google.com/thumb.jpg"},
                        "infoLink": "https://books.google.com/books?id=book1",
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

        with patch("httpx.AsyncClient", return_value=mock_client):
            result = await search_books("python")

        assert len(result) == 1
        book = result[0]
        assert book.source == "book"
        assert book.title == "Fluent Python"
        assert "Luciano Ramalho" in book.description
        assert book.thumbnail == "https://books.google.com/thumb.jpg"
        assert book.link == "https://books.google.com/books?id=book1"
        assert book.difficulty == "intermediate"  # 'practical' keyword

    @pytest.mark.asyncio
    async def test_no_authors_no_prefix(self):
        fake_data = {
            "items": [
                {
                    "id": "book2",
                    "volumeInfo": {
                        "title": "Nameless Book",
                        "description": "A book without authors",
                        "categories": [],
                        "imageLinks": {},
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

        with patch("httpx.AsyncClient", return_value=mock_client):
            result = await search_books("nameless")

        assert len(result) == 1
        assert not result[0].description.startswith("By ")

    @pytest.mark.asyncio
    async def test_missing_description_fallback(self):
        fake_data = {
            "items": [
                {
                    "id": "book3",
                    "volumeInfo": {
                        "title": "Empty Book",
                        "categories": [],
                        "imageLinks": {},
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

        with patch("httpx.AsyncClient", return_value=mock_client):
            result = await search_books("empty")

        assert result[0].description == "No description."

    @pytest.mark.asyncio
    async def test_infolink_fallback_uses_id(self):
        fake_data = {
            "items": [
                {
                    "id": "myBookId",
                    "volumeInfo": {
                        "title": "No Link Book",
                        "categories": [],
                        "imageLinks": {},
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

        with patch("httpx.AsyncClient", return_value=mock_client):
            result = await search_books("no link")

        assert result[0].link == "https://books.google.com/books?id=myBookId"

    @pytest.mark.asyncio
    async def test_api_key_included_when_present(self):
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {"items": []}

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_client), \
             patch("app.services.books_service.settings") as mock_settings:
            mock_settings.GOOGLE_BOOKS_API_KEY = "my_key"
            await search_books("python")

        call_kwargs = mock_client.get.call_args
        assert "key" in call_kwargs.kwargs.get("params", call_kwargs.args[1] if len(call_kwargs.args) > 1 else {})

    @pytest.mark.asyncio
    async def test_empty_items_list(self):
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {}

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_client):
            result = await search_books("python")

        assert result == []
