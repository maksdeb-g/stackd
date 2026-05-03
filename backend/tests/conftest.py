"""Shared fixtures for all tests."""
import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
import app.core.database as _db_module


@pytest.fixture()
def mock_supabase():
    """Return a MagicMock that mimics the Supabase client chaining API."""
    db = MagicMock()
    # Default behaviour: every chained call returns the mock itself so
    # callers can do db.table(...).select(...).execute() without errors.
    db.table.return_value = db
    db.select.return_value = db
    db.insert.return_value = db
    db.update.return_value = db
    db.delete.return_value = db
    db.eq.return_value = db
    db.order.return_value = db
    db.limit.return_value = db
    db.execute.return_value = MagicMock(data=[])
    return db


@pytest.fixture()
def client(mock_supabase):
    """FastAPI test client with Supabase _client replaced by the mock.

    The route modules import ``get_supabase`` directly
    (``from app.core.database import get_supabase``), so patching the name in
    ``app.core.database`` would not affect them.  Setting ``_client`` on the
    module means the real ``get_supabase()`` returns our mock at runtime.
    """
    original = _db_module._client
    _db_module._client = mock_supabase
    from app.main import app
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    _db_module._client = original
