#!/bin/bash

set -e

wd="$(cd "$(dirname "$0")" && pwd)"

bash "${wd}/cp.compose.yaml.sh"
bash "${wd}/run.docker.sh"

set +e