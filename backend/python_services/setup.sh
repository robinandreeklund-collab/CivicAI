#!/bin/bash
# Setup script for CivicAI Python NLP Pipeline

echo "=========================================="
echo "CivicAI Python NLP Pipeline Setup"
echo "=========================================="
echo ""

# Check if Python 3.8+ is available
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $python_version"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "=========================================="
echo "Downloading spaCy language models..."
echo "=========================================="
echo ""

# Download Swedish spaCy model
echo "Downloading Swedish spaCy model..."
python -m spacy download sv_core_news_sm

# Fallback to English if Swedish fails
if [ $? -ne 0 ]; then
    echo "Swedish model not available, downloading English..."
    python -m spacy download en_core_web_sm
fi

echo ""
echo "=========================================="
echo "Downloading TextBlob corpora..."
echo "=========================================="
echo ""

python -m textblob.download_corpora

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "To start the Python NLP service:"
echo "  1. source venv/bin/activate"
echo "  2. python nlp_pipeline.py"
echo ""
echo "The service will run on http://localhost:5001"
echo "=========================================="
