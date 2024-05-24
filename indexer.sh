#!/bin/bash

__usage="
Usage: $(basename $0) [OPTIONS]

Options:
  -h,     --help                Display usage
  -r,     --run-all             Start all containers
  -db,    --run-db              Start database and database manager containers
  -indx,  --run-indexer         Start indexer container
  -xdb,   --shutdown-db         Shutdown database and database manager containers
  -xind,  --shutdown-indexer    Shutdown indexer container
  -x,     --shutdown-all        Shutdown all containers
  -c,     --clean               Delete containers (Somewhat dangerous)
"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        # -t|--target) target="$2"; shift ;;
        # -u|--uglify) uglify=1 ;;
        -h|--help) echo "$__usage" ;;
        -r|--run-all) docker compose up -d ;;
        -db|--run-db) docker compose up -d db db-manager ;;
        -ind|--run-indexer) docker compose up -d indexer ;;
        -devind|--dev-indexer) docker compose up indexer ;;
        -xdb|--shutdown-db) docker compose stop db db-manager ;;
        -xind|--shutdown-indexer) docker compose stop indexer ;;
        -x|--shutdown-all) docker compose stop ;;
        -c|--clean) docker compose stop; docker rm $(docker ps -a -q) ;;
        *) echo "Unknown parameter: $1" ;;
    esac
    shift
done

# echo "Where to deploy: $target"
# echo "Should uglify  : $uglify"
