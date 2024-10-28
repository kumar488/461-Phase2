#!/bin/bash
sudo apt-get update -y
sudo apt-get install -y nodejs npm

# Navigate to the application directory
cd /home/ec2-user/461-Phase2

# Install dependencies
./run install

