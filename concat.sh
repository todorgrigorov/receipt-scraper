#!/bin/bash
set -e

mkdir -p out
jq -s '.' src/lidl/out/*.json > out/receipts.json
