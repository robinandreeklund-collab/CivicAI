"""
Tests for System Prompt Management API
Tests the CRUD operations, activation/deactivation, and character import functionality

Note: These tests require torch to be installed since they import from server.py.
In CI environments without GPU/torch, these tests will be skipped.
"""

import pytest
import sys
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import os
import json
import tempfile
import shutil

# Add ml_service to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'ml_service'))

# Skip all tests if torch is not available
torch_available = False
try:
    import torch
    torch_available = True
except ImportError:
    pass

pytestmark = pytest.mark.skipif(not torch_available, reason="torch not installed")


class TestSystemPromptModels:
    """Test Pydantic models for system prompts"""
    
    def test_valid_system_prompt(self):
        """Test valid system prompt creation"""
        from server import SystemPrompt
        
        prompt = SystemPrompt(
            name="Test Prompt",
            description="A test prompt",
            content="You are a helpful assistant.",
            language="en"
        )
        
        assert prompt.name == "Test Prompt"
        assert prompt.description == "A test prompt"
        assert prompt.content == "You are a helpful assistant."
        assert prompt.language == "en"
        assert prompt.is_active == False
        assert prompt.id is not None
    
    def test_empty_name_validation(self):
        """Test that empty name is rejected"""
        from server import SystemPrompt
        from pydantic import ValidationError
        
        with pytest.raises(ValidationError):
            SystemPrompt(
                name="",
                content="Some content"
            )
    
    def test_empty_content_validation(self):
        """Test that empty content is rejected"""
        from server import SystemPrompt
        from pydantic import ValidationError
        
        with pytest.raises(ValidationError):
            SystemPrompt(
                name="Test",
                content=""
            )
    
    def test_whitespace_name_validation(self):
        """Test that whitespace-only name is rejected"""
        from server import SystemPrompt
        from pydantic import ValidationError
        
        with pytest.raises(ValidationError):
            SystemPrompt(
                name="   ",
                content="Some content"
            )
    
    def test_system_prompt_create_model(self):
        """Test SystemPromptCreate model"""
        from server import SystemPromptCreate
        
        create_data = SystemPromptCreate(
            name="New Prompt",
            content="Hello world",
            description="Test description",
            language="sv",
            tags=["test", "example"]
        )
        
        assert create_data.name == "New Prompt"
        assert create_data.content == "Hello world"
        assert create_data.tags == ["test", "example"]
    
    def test_system_prompt_update_model(self):
        """Test SystemPromptUpdate model with partial data"""
        from server import SystemPromptUpdate
        
        # All fields optional
        update_data = SystemPromptUpdate(name="Updated Name")
        assert update_data.name == "Updated Name"
        assert update_data.content is None
        assert update_data.description is None


class TestSystemPromptStorage:
    """Test system prompt file storage operations"""
    
    @pytest.fixture
    def temp_prompts_dir(self):
        """Create a temporary directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir)
    
    def test_save_and_load_prompt(self, temp_prompts_dir):
        """Test saving and loading a system prompt"""
        from server import SystemPrompt, save_system_prompt, load_system_prompt, SYSTEM_PROMPTS_DIR
        
        # Mock the prompts directory
        with patch('server.SYSTEM_PROMPTS_DIR', temp_prompts_dir):
            prompt = SystemPrompt(
                id="test-123",
                name="Test Prompt",
                content="Test content",
                description="Test description"
            )
            
            # Save the prompt
            result = save_system_prompt(prompt)
            assert result == True
            
            # Check file exists
            assert (temp_prompts_dir / "test-123.json").exists()
            
            # Load and verify
            loaded = load_system_prompt("test-123")
            assert loaded is not None
            assert loaded.name == "Test Prompt"
            assert loaded.content == "Test content"
    
    def test_load_all_prompts(self, temp_prompts_dir):
        """Test loading all prompts from directory"""
        from server import SystemPrompt, save_system_prompt, load_all_system_prompts
        
        with patch('server.SYSTEM_PROMPTS_DIR', temp_prompts_dir):
            # Create multiple prompts
            for i in range(3):
                prompt = SystemPrompt(
                    id=f"prompt-{i}",
                    name=f"Prompt {i}",
                    content=f"Content {i}"
                )
                save_system_prompt(prompt)
            
            # Load all
            prompts = load_all_system_prompts()
            assert len(prompts) == 3
    
    def test_delete_prompt(self, temp_prompts_dir):
        """Test deleting a system prompt"""
        from server import SystemPrompt, save_system_prompt, delete_system_prompt_file
        
        with patch('server.SYSTEM_PROMPTS_DIR', temp_prompts_dir):
            prompt = SystemPrompt(
                id="to-delete",
                name="Delete Me",
                content="Content"
            )
            save_system_prompt(prompt)
            
            # Verify exists
            assert (temp_prompts_dir / "to-delete.json").exists()
            
            # Delete
            result = delete_system_prompt_file("to-delete")
            assert result == True
            
            # Verify gone
            assert not (temp_prompts_dir / "to-delete.json").exists()


class TestActivePrompt:
    """Test active prompt functionality"""
    
    def test_get_active_prompt_default(self, tmp_path):
        """Test that default prompt is returned when no active prompt exists"""
        from server import get_active_system_prompt, DEFAULT_SYSTEM_PROMPT
        
        with patch('server.SYSTEM_PROMPTS_DIR', tmp_path):
            result = get_active_system_prompt()
            assert result == DEFAULT_SYSTEM_PROMPT
    
    def test_get_active_prompt_custom(self, tmp_path):
        """Test that active custom prompt is returned"""
        from server import SystemPrompt, save_system_prompt, get_active_system_prompt
        
        with patch('server.SYSTEM_PROMPTS_DIR', tmp_path):
            # Create and save an active prompt
            prompt = SystemPrompt(
                id="active-prompt",
                name="Active Prompt",
                content="I am the active prompt",
                is_active=True
            )
            save_system_prompt(prompt)
            
            result = get_active_system_prompt()
            assert result == "I am the active prompt"


class TestSystemPromptEndpoints:
    """Test FastAPI endpoints for system prompts"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        from server import app
        from fastapi.testclient import TestClient
        return TestClient(app)
    
    def test_list_prompts_endpoint(self, client, tmp_path):
        """Test GET /api/system-prompts"""
        with patch('server.SYSTEM_PROMPTS_DIR', tmp_path):
            response = client.get("/api/system-prompts")
            assert response.status_code == 200
            data = response.json()
            assert "prompts" in data
            assert "count" in data
    
    def test_get_active_prompt_endpoint(self, client, tmp_path):
        """Test GET /api/system-prompts/active"""
        with patch('server.SYSTEM_PROMPTS_DIR', tmp_path):
            response = client.get("/api/system-prompts/active")
            assert response.status_code == 200
            data = response.json()
            assert "prompt" in data
            assert "is_default" in data
    
    def test_create_prompt_endpoint(self, client, tmp_path):
        """Test POST /api/system-prompts"""
        with patch('server.SYSTEM_PROMPTS_DIR', tmp_path):
            response = client.post(
                "/api/system-prompts",
                json={
                    "name": "New Test Prompt",
                    "content": "This is a test prompt content",
                    "description": "Test description"
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
            assert data["prompt"]["name"] == "New Test Prompt"
    
    def test_create_prompt_validation_error(self, client, tmp_path):
        """Test POST /api/system-prompts with invalid data"""
        with patch('server.SYSTEM_PROMPTS_DIR', tmp_path):
            response = client.post(
                "/api/system-prompts",
                json={
                    "name": "",
                    "content": "Content"
                }
            )
            assert response.status_code == 422  # Validation error
    
    def test_get_nonexistent_prompt(self, client, tmp_path):
        """Test GET /api/system-prompts/{id} with nonexistent ID"""
        with patch('server.SYSTEM_PROMPTS_DIR', tmp_path):
            response = client.get("/api/system-prompts/nonexistent-id")
            assert response.status_code == 404
    
    def test_activate_prompt_endpoint(self, client, tmp_path):
        """Test POST /api/system-prompts/{id}/activate"""
        from server import SystemPrompt, save_system_prompt
        
        with patch('server.SYSTEM_PROMPTS_DIR', tmp_path):
            # Create a prompt first
            prompt = SystemPrompt(
                id="activate-test",
                name="Activate Test",
                content="Content",
                is_active=False
            )
            save_system_prompt(prompt)
            
            # Activate it
            response = client.post("/api/system-prompts/activate-test/activate")
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
            assert data["prompt"]["is_active"] == True
    
    def test_list_available_characters(self, client):
        """Test GET /api/system-prompts/characters/available"""
        response = client.get("/api/system-prompts/characters/available")
        assert response.status_code == 200
        data = response.json()
        assert "characters" in data
        assert "count" in data


class TestCharacterImport:
    """Test character card import functionality"""
    
    def test_import_character_not_found(self, tmp_path):
        """Test importing a nonexistent character"""
        from server import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        with patch('server.SYSTEM_PROMPTS_DIR', tmp_path):
            response = client.post(
                "/api/system-prompts/import-character",
                json={"character_id": "nonexistent-character"}
            )
            assert response.status_code == 404


class TestSimpleSystemPromptAPI:
    """Test the simple /api/system-prompt GET endpoint (convenience wrapper)"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        from server import app
        from fastapi.testclient import TestClient
        return TestClient(app)
    
    def test_get_simple_prompt_returns_default(self, client, tmp_path):
        """Test GET /api/system-prompt returns default when no active prompt exists"""
        with patch('server.SYSTEM_PROMPTS_DIR', tmp_path):
            response = client.get("/api/system-prompt")
            assert response.status_code == 200
            data = response.json()
            assert "content" in data
            # Should return the default prompt since no prompt files exist
            assert len(data["content"]) > 0
    
    def test_get_simple_prompt_returns_active(self, client, tmp_path):
        """Test GET /api/system-prompt returns the active prompt"""
        from server import SystemPrompt, save_system_prompt
        
        with patch('server.SYSTEM_PROMPTS_DIR', tmp_path):
            # Create and save an active prompt
            prompt = SystemPrompt(
                id="test-active",
                name="Active Test Prompt",
                content="This is the active system prompt for testing",
                is_active=True
            )
            save_system_prompt(prompt)
            
            response = client.get("/api/system-prompt")
            assert response.status_code == 200
            data = response.json()
            assert data["content"] == "This is the active system prompt for testing"


class TestSystemPromptInference:
    """Test that system prompt is injected into inference requests"""
    
    def test_get_active_system_prompt_returns_default(self, tmp_path):
        """Test get_active_system_prompt returns default when no active prompt"""
        from server import get_active_system_prompt, DEFAULT_SYSTEM_PROMPT
        
        with patch('server.SYSTEM_PROMPTS_DIR', tmp_path):
            result = get_active_system_prompt()
            assert result == DEFAULT_SYSTEM_PROMPT
    
    def test_get_active_system_prompt_returns_active(self, tmp_path):
        """Test get_active_system_prompt returns the active prompt content"""
        from server import SystemPrompt, save_system_prompt, get_active_system_prompt
        
        with patch('server.SYSTEM_PROMPTS_DIR', tmp_path):
            # Create and save an active prompt
            prompt = SystemPrompt(
                id="inference-test",
                name="Inference Test Prompt",
                content="Du är en hjälpsam svensk AI-assistent.",
                is_active=True
            )
            save_system_prompt(prompt)
            
            result = get_active_system_prompt()
            assert result == "Du är en hjälpsam svensk AI-assistent."


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
