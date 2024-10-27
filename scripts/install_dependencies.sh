#!/bin/bash
sudo apt-get update -y
sudo apt-get install -y nodejs npm

# Navigate to the application directory
cd /home/ec2-user/myprogram

# Install dependencies
./run install

