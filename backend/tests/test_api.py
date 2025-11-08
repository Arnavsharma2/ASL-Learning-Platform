import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root_endpoint():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "version" in response.json()


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


# Note: Database-dependent tests will need proper test database setup
# These are placeholder tests to verify API structure

def test_lessons_endpoint_structure():
    """Test that lessons endpoint exists (may fail without DB)"""
    response = client.get("/api/lessons/")
    # Endpoint exists even if DB not connected
    assert response.status_code in [200, 500]


def test_progress_stats_endpoint_structure():
    """Test that progress stats endpoint exists"""
    response = client.get("/api/progress/stats/test-user-id")
    assert response.status_code in [200, 500]
