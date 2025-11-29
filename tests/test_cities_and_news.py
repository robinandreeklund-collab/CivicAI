"""
Tests for Swedish Cities and RSS Feeds features
Tests the dashboard-controlled city weather and news feed functionality

Note: Most tests require torch to be installed since they import from server.py.
In CI environments without GPU/torch, those tests will be skipped.
"""

import pytest
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock
import json
import tempfile
import shutil
from datetime import datetime

# Add ml_service to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'ml_service'))

# Check if torch is available
torch_available = False
try:
    import torch
    torch_available = True
except ImportError:
    pass

# Create a skip marker for tests that require torch
requires_torch = pytest.mark.skipif(not torch_available, reason="torch not installed")


@requires_torch
class TestSeasonDetection:
    """Test current season detection"""
    
    def test_get_current_season_returns_string(self):
        """Test that season detection returns a valid string"""
        from server import get_current_season
        
        result = get_current_season()
        assert isinstance(result, str)
        assert "Vi är mitt i" in result
    
    def test_get_current_season_valid_season(self):
        """Test that detected season is valid"""
        from server import get_current_season
        
        result = get_current_season()
        valid_seasons = ["vintern", "våren", "sommaren", "hösten"]
        assert any(season in result for season in valid_seasons)


@requires_torch
class TestSwedishCitiesLoading:
    """Test Swedish cities configuration loading"""
    
    @pytest.fixture
    def temp_config_dir(self):
        """Create a temporary config directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir)
    
    def test_load_swedish_cities_from_file(self, temp_config_dir):
        """Test loading cities from config file"""
        from server import load_swedish_cities, CITIES_CONFIG_FILE
        
        test_file = temp_config_dir / "swedish_cities.json"
        test_cities = {
            "cities": {
                "stockholm": {"lon": 18.07, "lat": 59.33},
                "malmö": {"lon": 13.00, "lat": 55.61}
            }
        }
        test_file.write_text(json.dumps(test_cities), encoding="utf-8")
        
        with patch('server.CITIES_CONFIG_FILE', test_file):
            result = load_swedish_cities()
            assert "stockholm" in result
            assert "malmö" in result
            assert result["stockholm"]["lon"] == 18.07
    
    def test_load_swedish_cities_default_when_missing(self, temp_config_dir):
        """Test that default cities are returned when file is missing"""
        from server import load_swedish_cities
        
        missing_file = temp_config_dir / "missing.json"
        
        with patch('server.CITIES_CONFIG_FILE', missing_file):
            result = load_swedish_cities()
            assert isinstance(result, dict)
            assert len(result) > 0
            assert "stockholm" in result


@requires_torch
class TestRssFeedsLoading:
    """Test RSS feeds configuration loading"""
    
    @pytest.fixture
    def temp_config_dir(self):
        """Create a temporary config directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir)
    
    def test_load_rss_feeds_from_file(self, temp_config_dir):
        """Test loading feeds from config file"""
        from server import load_rss_feeds, RSS_FEEDS_FILE
        
        test_file = temp_config_dir / "rss_feeds.json"
        test_feeds = {
            "feeds": [
                {"name": "Test Feed", "url": "https://example.com/rss"}
            ]
        }
        test_file.write_text(json.dumps(test_feeds), encoding="utf-8")
        
        with patch('server.RSS_FEEDS_FILE', test_file):
            result = load_rss_feeds()
            assert len(result) == 1
            assert result[0]["name"] == "Test Feed"
    
    def test_load_rss_feeds_default_when_missing(self, temp_config_dir):
        """Test that default feeds are returned when file is missing"""
        from server import load_rss_feeds
        
        missing_file = temp_config_dir / "missing.json"
        
        with patch('server.RSS_FEEDS_FILE', missing_file):
            result = load_rss_feeds()
            assert isinstance(result, list)
            assert len(result) > 0


@requires_torch
class TestWeatherCityDetection:
    """Test weather city detection from user messages"""
    
    def test_check_weather_city_detects_city(self):
        """Test that city names are detected in weather questions"""
        from server import check_weather_city
        
        with patch('server.SWEDISH_CITIES', {"stockholm": {}, "malmö": {}, "luleå": {}}):
            assert check_weather_city("Hur är vädret i malmö?") == "malmö"
            assert check_weather_city("Vad blir det för väder i luleå imorgon?") == "luleå"
    
    def test_check_weather_city_default_stockholm(self):
        """Test that Stockholm is default when no city specified"""
        from server import check_weather_city
        
        with patch('server.SWEDISH_CITIES', {"stockholm": {}, "malmö": {}}):
            assert check_weather_city("Hur är vädret imorgon?") == "stockholm"
    
    def test_check_weather_city_returns_none_for_non_weather(self):
        """Test that None is returned for non-weather questions"""
        from server import check_weather_city
        
        with patch('server.SWEDISH_CITIES', {"stockholm": {}}):
            assert check_weather_city("Vem är du?") is None
            assert check_weather_city("Vad är klockan?") is None


@requires_torch
class TestNewsTriggerDetection:
    """Test news trigger detection"""
    
    def test_check_news_trigger_detects_news(self):
        """Test that news-related questions are detected"""
        from server import check_news_trigger
        
        assert check_news_trigger("Vad är det senaste nyheterna?") == True
        assert check_news_trigger("Vad hände idag?") == True
        assert check_news_trigger("Ge mig de senaste nyheterna") == True
    
    def test_check_news_trigger_rejects_non_news(self):
        """Test that non-news questions return False"""
        from server import check_news_trigger
        
        assert check_news_trigger("Vem är du?") == False
        assert check_news_trigger("Vad är klockan?") == False


@requires_torch
class TestFormatNewsForContext:
    """Test news formatting"""
    
    def test_format_news_with_items(self):
        """Test formatting news items"""
        from server import format_news_for_context
        
        news = [
            {"title": "Test News 1", "link": "https://example.com/1", "source": "SVT"},
            {"title": "Test News 2", "link": "https://example.com/2", "source": "Omni"}
        ]
        
        result = format_news_for_context(news)
        
        assert "Senaste nyheterna" in result
        assert "Test News 1" in result
        assert "Test News 2" in result
        assert "SVT" in result
    
    def test_format_news_empty_list(self):
        """Test formatting with empty list"""
        from server import format_news_for_context
        
        assert format_news_for_context([]) == ""


# Tests that don't require torch - these will run in CI
class TestCitiesConfigFileNoTorch:
    """Test config file existence and content without importing server.py"""
    
    def test_cities_config_file_exists(self):
        """Test that the cities config file exists"""
        config_file = Path(__file__).parent.parent / "config" / "swedish_cities.json"
        assert config_file.exists(), f"Config file should exist at {config_file}"
    
    def test_cities_config_file_valid_json(self):
        """Test that the cities config file is valid JSON"""
        config_file = Path(__file__).parent.parent / "config" / "swedish_cities.json"
        content = config_file.read_text(encoding="utf-8")
        data = json.loads(content)
        assert isinstance(data, dict)
    
    def test_cities_config_file_has_cities_key(self):
        """Test that the config file has a 'cities' key"""
        config_file = Path(__file__).parent.parent / "config" / "swedish_cities.json"
        content = config_file.read_text(encoding="utf-8")
        data = json.loads(content)
        assert "cities" in data
        assert isinstance(data["cities"], dict)
    
    def test_cities_config_file_has_default_cities(self):
        """Test that the config file contains some default cities"""
        config_file = Path(__file__).parent.parent / "config" / "swedish_cities.json"
        content = config_file.read_text(encoding="utf-8")
        data = json.loads(content)
        assert len(data["cities"]) > 0
        assert "stockholm" in data["cities"]


class TestRssFeedsConfigFileNoTorch:
    """Test RSS config file existence and content without importing server.py"""
    
    def test_rss_config_file_exists(self):
        """Test that the RSS config file exists"""
        config_file = Path(__file__).parent.parent / "config" / "rss_feeds.json"
        assert config_file.exists(), f"Config file should exist at {config_file}"
    
    def test_rss_config_file_valid_json(self):
        """Test that the RSS config file is valid JSON"""
        config_file = Path(__file__).parent.parent / "config" / "rss_feeds.json"
        content = config_file.read_text(encoding="utf-8")
        data = json.loads(content)
        assert isinstance(data, dict)
    
    def test_rss_config_file_has_feeds_key(self):
        """Test that the config file has a 'feeds' key"""
        config_file = Path(__file__).parent.parent / "config" / "rss_feeds.json"
        content = config_file.read_text(encoding="utf-8")
        data = json.loads(content)
        assert "feeds" in data
        assert isinstance(data["feeds"], list)
    
    def test_rss_config_file_has_default_feeds(self):
        """Test that the config file contains some default feeds"""
        config_file = Path(__file__).parent.parent / "config" / "rss_feeds.json"
        content = config_file.read_text(encoding="utf-8")
        data = json.loads(content)
        assert len(data["feeds"]) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
