#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " Setting Up Web3 ZKP Health Insurance Hackathon Project"
echo "=========================================================="

# 1. Python venv
echo -e "\n[1/3] Setting up Python Virtual Environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Virtual environment created at ./venv"
else
    echo "Virtual environment already exists."
fi

# 2. Python requirements
echo -e "\n[2/3] Installing Python dependencies from requirements.txt..."
./venv/bin/python -m pip install --upgrade pip
./venv/bin/pip install -r requirements.txt
echo "Python dependencies installed!"

# 3. Node.js packages
echo -e "\n[3/3] Installing Node.js & ZKP packages (npm install)..."
npm install
echo "Node.js packages installed!"

echo "=========================================================="
echo "  Setup Complete! To activate Python venv, run:"
echo "source venv/bin/activate"
echo "=========================================================="
