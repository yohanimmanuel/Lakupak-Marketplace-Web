#!/bin/sh
set -e
# Marketplace Web has no Prisma migrations or sidecar processes.
# Keep an entrypoint for parity with Laku-Dashboard and future hooks.
exec "$@"
