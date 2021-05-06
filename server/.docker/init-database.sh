#!/bin/bash

psql -U postgres -c "CREATE DATABASE location_share"
psql -U postgres -c "CREATE DATABASE location_share_test"