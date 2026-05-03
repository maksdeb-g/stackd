"""Tests for wikipedia_service."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


class TestSearchWikipedia:
    @pytest.mark.asyncio
    async def test_returns_empty_on_http_error(self):
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = Exception("timeout")

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_client):
            from app.services.wikipedia_service import search_wikipedia
            result = await search_wikipedia("python")

        assert result == []

    @pytest.mark.asyncio
    async def test_parses_wikipedia_response(self):
        search_data = {
            "query": {
                "search": [
                    {
                        "title": "Python (programming language)",
                        "snippet": 'A <span class="searchmatch">Python</span> programming language',
                        "pageid": 23862,
                    }
                ]
            }
        }
        image_data = {
            "query": {
                "pages": {
                    "23862": {
                        "thumbnail": {"source": "https://upload.wikimedia.org/thumb.jpg"}
                    }
                }
            }
        }

        responses = [
            self._make_mock_response(search_data),
            self._make_mock_response(image_data),
        ]

        mock_client = AsyncMock()
        mock_client.get.side_effect = responses
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_client):
            from app.services.wikipedia_service import search_wikipedia
            result = await search_wikipedia("python")

        assert len(result) == 1
        page = result[0]
        assert page.source == "wikipedia"
        assert page.title == "Python (programming language)"
        # HTML span tags should be stripped
        assert "<span" not in page.description
        assert "Python" in page.description
        assert page.thumbnail == "https://upload.wikimedia.org/thumb.jpg"
        assert "Python_(programming_language)" in page.link
        assert page.difficulty == "beginner"

    @pytest.mark.asyncio
    async def test_strips_html_from_snippet(self):
        search_data = {
            "query": {
                "search": [
                    {
                        "title": "Machine Learning",
                        "snippet": 'Learn <span class="searchmatch">machine</span> learning basics',
                        "pageid": 100,
                    }
                ]
            }
        }
        image_data = {"query": {"pages": {"100": {}}}}

        responses = [
            self._make_mock_response(search_data),
            self._make_mock_response(image_data),
        ]

        mock_client = AsyncMock()
        mock_client.get.side_effect = responses
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_client):
            from app.services.wikipedia_service import search_wikipedia
            result = await search_wikipedia("machine learning")

        assert result[0].description == "Learn machine learning basics"

    @pytest.mark.asyncio
    async def test_empty_snippet_fallback(self):
        search_data = {
            "query": {
                "search": [
                    {"title": "Empty Article", "snippet": "", "pageid": 1}
                ]
            }
        }
        image_data = {"query": {"pages": {"1": {}}}}

        responses = [
            self._make_mock_response(search_data),
            self._make_mock_response(image_data),
        ]

        mock_client = AsyncMock()
        mock_client.get.side_effect = responses
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_client):
            from app.services.wikipedia_service import search_wikipedia
            result = await search_wikipedia("empty")

        assert result[0].description == "Wikipedia article."

    @pytest.mark.asyncio
    async def test_empty_search_results(self):
        search_data = {"query": {"search": []}}

        mock_response = self._make_mock_response(search_data)

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_client):
            from app.services.wikipedia_service import search_wikipedia
            result = await search_wikipedia("xyzzy")

        assert result == []

    @pytest.mark.asyncio
    async def test_image_lookup_failure_does_not_break_result(self):
        """If the image sub-request raises, the article should still be returned."""
        search_data = {
            "query": {
                "search": [
                    {"title": "No Image Article", "snippet": "Some content", "pageid": 999}
                ]
            }
        }

        # first call succeeds, second call raises
        mock_client = AsyncMock()
        mock_client.get.side_effect = [
            self._make_mock_response(search_data),
            Exception("connection error"),
        ]
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("httpx.AsyncClient", return_value=mock_client):
            from app.services.wikipedia_service import search_wikipedia
            result = await search_wikipedia("no image")

        assert len(result) == 1
        assert result[0].thumbnail == ""

    @staticmethod
    def _make_mock_response(data: dict) -> MagicMock:
        r = MagicMock()
        r.raise_for_status = MagicMock()
        r.json.return_value = data
        return r
