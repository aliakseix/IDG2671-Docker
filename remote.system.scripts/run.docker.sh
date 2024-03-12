#!/bin/bash

set -e

DEFAULT_WD="/home/tst/test-project"
COMPOSE_FILE="compose.yaml"

wd="${WD:-$DEFAULT_WD}"

cd "$wd"

docker compose -f "${wd}/${COMPOSE_FILE}" down
docker compose -f "${wd}/${COMPOSE_FILE}" pull
docker compose -f "${wd}/${COMPOSE_FILE}" up -d

set +e