"""
Tests for ONESEEK Δ+ v4.0 API Catalog and Active Features Configuration.

This module tests:
- API catalog loading from config/api_catalog.json
- Active features configuration (intent_engine, typo_checker, time_context)
- Helper functions for checking feature states
"""

import json
import os
import pytest
from pathlib import Path


class TestApiCatalogConfigFile:
    """Tests for api_catalog.json configuration file."""
    
    def get_config_path(self):
        """Get path to api_catalog.json."""
        return Path(__file__).parent.parent / "config" / "api_catalog.json"
    
    def test_api_catalog_file_exists(self):
        """Test that api_catalog.json exists."""
        config_path = self.get_config_path()
        assert config_path.exists(), f"api_catalog.json should exist at {config_path}"
    
    def test_api_catalog_file_valid_json(self):
        """Test that api_catalog.json contains valid JSON."""
        config_path = self.get_config_path()
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        assert isinstance(data, dict), "api_catalog.json should contain a JSON object"
    
    def test_api_catalog_has_active_features(self):
        """Test that api_catalog.json has active_features key."""
        config_path = self.get_config_path()
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        assert "active_features" in data, "api_catalog.json should have 'active_features' key"
        active_features = data["active_features"]
        
        assert "intent_engine" in active_features, "active_features should have 'intent_engine'"
        assert "typo_checker" in active_features, "active_features should have 'typo_checker'"
        assert "time_context" in active_features, "active_features should have 'time_context'"
    
    def test_intent_engine_disabled_by_default(self):
        """Test that intent_engine is disabled by default in v4.0."""
        config_path = self.get_config_path()
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        active_features = data["active_features"]
        assert active_features["intent_engine"] == False, \
            "Intent Engine should be disabled (False) by default in v4.0"
    
    def test_typo_checker_disabled_by_default(self):
        """Test that typo_checker is disabled by default in v4.0."""
        config_path = self.get_config_path()
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        active_features = data["active_features"]
        assert active_features["typo_checker"] == False, \
            "Typo Checker should be disabled (False) by default in v4.0"
    
    def test_time_context_enabled_by_default(self):
        """Test that time_context is enabled by default (always active)."""
        config_path = self.get_config_path()
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        active_features = data["active_features"]
        assert active_features["time_context"] == True, \
            "Time Context should be enabled (True) by default - it's always active"
    
    def test_api_catalog_has_catalog_key(self):
        """Test that api_catalog.json has api_catalog key."""
        config_path = self.get_config_path()
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        assert "api_catalog" in data, "api_catalog.json should have 'api_catalog' key"
        catalog = data["api_catalog"]
        assert isinstance(catalog, dict), "api_catalog should be a dictionary"
    
    def test_api_catalog_has_required_categories(self):
        """Test that api_catalog has essential categories (supports $ref structure)."""
        config_path = self.get_config_path()
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        catalog = data["api_catalog"]
        # Note: As of v7.0, using modular $ref structure
        # At minimum, we should have weather category
        assert "väder" in catalog, "api_catalog should have 'väder' category"
    
    def test_api_catalog_categories_have_apis(self):
        """Test that each category has at least one API defined (supports $ref structure)."""
        config_path = self.get_config_path()
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        catalog = data["api_catalog"]
        config_dir = config_path.parent
        
        for category_name, category_config in catalog.items():
            # Support $ref structure (v7.0+)
            if isinstance(category_config, dict) and "$ref" in category_config:
                ref_file = category_config["$ref"]
                ref_path = config_dir / ref_file
                assert ref_path.exists(), f"Referenced file '{ref_file}' should exist"
                # Validate that referenced file contains valid JSON
                with open(ref_path, 'r', encoding='utf-8') as f:
                    ref_data = json.load(f)
                assert isinstance(ref_data, dict), f"Referenced file '{ref_file}' should contain a JSON object"
                assert "apis" in ref_data, f"Referenced category '{category_name}' should have 'apis' key"
                apis = ref_data["apis"]
                assert isinstance(apis, list), f"Category '{category_name}' apis should be a list"
                assert len(apis) > 0, f"Category '{category_name}' should have at least one API"
            else:
                # Legacy inline structure
                assert "apis" in category_config, f"Category '{category_name}' should have 'apis' key"
                apis = category_config["apis"]
                assert isinstance(apis, list), f"Category '{category_name}' apis should be a list"
                assert len(apis) > 0, f"Category '{category_name}' should have at least one API"
    
    def test_api_catalog_apis_have_required_fields(self):
        """Test that each API has required fields (name, source) - supports $ref."""
        config_path = self.get_config_path()
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        catalog = data["api_catalog"]
        config_dir = config_path.parent
        
        for category_name, category_config in catalog.items():
            # Support $ref structure (v7.0+)
            if isinstance(category_config, dict) and "$ref" in category_config:
                ref_file = category_config["$ref"]
                ref_path = config_dir / ref_file
                with open(ref_path, 'r', encoding='utf-8') as f:
                    ref_data = json.load(f)
                apis = ref_data.get("apis", [])
            else:
                # Legacy inline structure
                apis = category_config.get("apis", [])
            
            for api in apis:
                assert "name" in api, f"API in '{category_name}' should have 'name' field"
                assert "source" in api, f"API in '{category_name}' should have 'source' field"
    
    def test_api_catalog_has_categories(self):
        """Test that api_catalog has categories (modular v7.0+ uses $ref for scalability)."""
        config_path = self.get_config_path()
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        catalog = data["api_catalog"]
        # v7.0+ uses modular $ref structure for scalability
        # At minimum we should have at least one category
        assert len(catalog) >= 1, \
            f"api_catalog should have at least one category, found {len(catalog)}"
    
    def test_api_catalog_has_system_prompt(self):
        """Test that api_catalog.json has a system_prompt for the new self-steering logic."""
        config_path = self.get_config_path()
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        assert "system_prompt" in data, "api_catalog.json should have 'system_prompt' key"
        system_prompt = data["system_prompt"]
        
        assert isinstance(system_prompt, str), "system_prompt should be a string"
        assert len(system_prompt) > 100, "system_prompt should be substantial"
        assert "svenska" in system_prompt.lower(), "system_prompt should mention Swedish"


class TestApiCatalogCategories:
    """Tests for specific API catalog category configurations."""
    
    def get_catalog(self):
        """Load and return the API catalog."""
        config_path = Path(__file__).parent.parent / "config" / "api_catalog.json"
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data["api_catalog"]
    
    def test_befolkning_category(self):
        """Test befolkning (population) category configuration."""
        catalog = self.get_catalog()
        befolkning = catalog.get("befolkning", {})
        
        # Skip if not present (may be in $ref structure or removed in v7.0+)
        if not befolkning:
            pytest.skip("befolkning category not in inline structure")
        
        assert "apis" in befolkning
        assert any("scb" in api["name"].lower() for api in befolkning["apis"]), \
            "befolkning should have SCB as a data source"
        assert befolkning.get("entity_required") == True, \
            "befolkning should require an entity (kommun)"
    
    def test_väder_category(self):
        """Test väder (weather) category configuration - supports $ref structure."""
        config_path = Path(__file__).parent.parent / "config" / "api_catalog.json"
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        catalog = data["api_catalog"]
        assert "väder" in catalog, "api_catalog should have 'väder' category"
        
        väder_config = catalog.get("väder", {})
        
        # Handle $ref structure (v7.0+)
        if isinstance(väder_config, dict) and "$ref" in väder_config:
            ref_file = väder_config["$ref"]
            ref_path = config_path.parent / ref_file
            with open(ref_path, 'r', encoding='utf-8') as f:
                väder = json.load(f)
        else:
            väder = väder_config
        
        assert "apis" in väder
        assert any("smhi" in api["name"].lower() for api in väder["apis"]), \
            "väder should have SMHI as a data source"
    
    def test_kris_category(self):
        """Test kris (crisis) category configuration."""
        catalog = self.get_catalog()
        kris = catalog.get("kris", {})
        
        # Skip if not present (may be in $ref structure)
        if not kris:
            pytest.skip("kris category not in inline structure")
        
        assert "apis" in kris
        assert any("krisinformation" in api["name"].lower() for api in kris["apis"]), \
            "kris should have Krisinformation.se as a data source"
    
    def test_böcker_category(self):
        """Test böcker (books) category configuration - Libris XL integration."""
        config_path = Path(__file__).parent.parent / "config" / "api_catalog.json"
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        catalog = data["api_catalog"]
        assert "böcker" in catalog, "api_catalog should have 'böcker' category"
        
        böcker_config = catalog.get("böcker", {})
        
        # Handle $ref structure (v7.0+)
        if isinstance(böcker_config, dict) and "$ref" in böcker_config:
            ref_file = böcker_config["$ref"]
            ref_path = config_path.parent / ref_file
            assert ref_path.exists(), f"Referenced file '{ref_file}' should exist"
            with open(ref_path, 'r', encoding='utf-8') as f:
                böcker = json.load(f)
        else:
            böcker = böcker_config
        
        # Verify Libris structure
        assert "apis" in böcker, "böcker should have 'apis' key"
        assert "personality_tags" in böcker, "böcker should have 'personality_tags'"
        assert "bibliotekarie" in böcker["personality_tags"], \
            "böcker should have 'bibliotekarie' personality tag"
        
        # Check for Libris APIs
        api_names = [api["name"] for api in böcker["apis"]]
        assert "libris_title_author_anything" in api_names, "böcker should have libris_title_author_anything API"
        assert "libris_isbn" in api_names, "böcker should have libris_isbn API"
        
        # Verify default_api is set
        assert "default_api" in böcker, "böcker should have default_api"
        assert böcker["default_api"] == "libris_title_author_anything", \
            "default_api should be libris_title_author_anything"
        
        # Verify provider info
        assert "provider" in böcker, "böcker should have provider information"
        provider = böcker["provider"]
        assert provider["name"] == "Kungliga Biblioteket (KB)", \
            "böcker provider should be Kungliga Biblioteket"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
