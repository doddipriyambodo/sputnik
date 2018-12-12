#!/bin/bash

# Check to see if input has been provided:
if [ -z "$1" ]; then
    echo "Please provide the dist dir"
    echo "For example: ./00-cleanup.sh ./dist"
    exit 1
fi

set -e

echo "00-cleanup.sh-----------------------------------------------------------------"
echo "[Init] Clean old dist and old website dir"
echo "rm -rf $1"
rm -rf $1
echo "mkdir -p $1"
mkdir -p $1
# echo
# echo "[Init] Creating Console and Lambda dirs"
# echo "mkdir -p $1/console"
# mkdir -p $1/console
# echo "mkdir -p $1/lambda"
# mkdir -p $1/lambda
echo "------------------------------------------------------------------------------"
echo
exit 0
