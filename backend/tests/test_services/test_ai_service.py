"""Tests for ai_service."""
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


class TestGenerateSubtopics:
    @pytest.mark.asyncio
    async def test_fallback_when_no_api_key(self):
        with patch("app.services.ai_service.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = ""
            from app.services.ai_service import generate_subtopics
            result = await generate_subtopics("Python")

        assert isinstance(result, list)
        assert len(result) == 5
        # Fallback items should reference the topic
        assert any("Python" in item for item in result)

    @pytest.mark.asyncio
    async def test_openai_returns_json_array(self):
        subtopics = ["Variables", "Functions", "Classes", "Modules", "Exceptions", "Iterators"]
        mock_message = MagicMock()
        mock_message.content = json.dumps(subtopics)

        mock_choice = MagicMock()
        mock_choice.message = mock_message

        mock_completion = MagicMock()
        mock_completion.choices = [mock_choice]

        mock_openai = MagicMock()
        mock_openai.chat.completions.create = AsyncMock(return_value=mock_completion)

        with patch("app.services.ai_service.settings") as mock_settings, \
             patch("app.services.ai_service.AsyncOpenAI", return_value=mock_openai):
            mock_settings.OPENAI_API_KEY = "sk-test"
            from app.services.ai_service import generate_subtopics
            result = await generate_subtopics("Python")

        assert result == subtopics

    @pytest.mark.asyncio
    async def test_openai_strips_markdown_fences(self):
        subtopics = ["Topic A", "Topic B", "Topic C"]
        raw = "```json\n" + json.dumps(subtopics) + "\n```"

        mock_message = MagicMock()
        mock_message.content = raw

        mock_choice = MagicMock()
        mock_choice.message = mock_message

        mock_completion = MagicMock()
        mock_completion.choices = [mock_choice]

        mock_openai = MagicMock()
        mock_openai.chat.completions.create = AsyncMock(return_value=mock_completion)

        with patch("app.services.ai_service.settings") as mock_settings, \
             patch("app.services.ai_service.AsyncOpenAI", return_value=mock_openai):
            mock_settings.OPENAI_API_KEY = "sk-test"
            from app.services.ai_service import generate_subtopics
            result = await generate_subtopics("AI")

        assert result == subtopics

    @pytest.mark.asyncio
    async def test_result_capped_at_8_items(self):
        subtopics = [f"Topic {i}" for i in range(12)]
        mock_message = MagicMock()
        mock_message.content = json.dumps(subtopics)

        mock_choice = MagicMock()
        mock_choice.message = mock_message

        mock_completion = MagicMock()
        mock_completion.choices = [mock_choice]

        mock_openai = MagicMock()
        mock_openai.chat.completions.create = AsyncMock(return_value=mock_completion)

        with patch("app.services.ai_service.settings") as mock_settings, \
             patch("app.services.ai_service.AsyncOpenAI", return_value=mock_openai):
            mock_settings.OPENAI_API_KEY = "sk-test"
            from app.services.ai_service import generate_subtopics
            result = await generate_subtopics("Big Topic")

        assert len(result) == 8

    @pytest.mark.asyncio
    async def test_fallback_topic_names_are_descriptive(self):
        with patch("app.services.ai_service.settings") as mock_settings:
            mock_settings.OPENAI_API_KEY = ""
            from app.services.ai_service import generate_subtopics
            result = await generate_subtopics("JavaScript")

        topics = " ".join(result)
        assert "JavaScript" in topics
        assert "Introduction" in topics or "introduction" in topics.lower()
