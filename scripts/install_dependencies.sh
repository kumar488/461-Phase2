#!/bin/bash

# Debugging information
echo "Current working directory: $(pwd)"
echo "Listing files in current directory:"
ls -la

sudo yum -y update
sudo yum -y install ruby wget python3-pip

# Navigate to the application directory
# cd /home/ec2-user/461-Phase2

# # Install dependencies
# chmod +x run
# ./run install

