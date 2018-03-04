#!/bin/bash

aws dynamodb update-table  --table-name legislators-contact-info-dev \
  --attribute-definitions AttributeName=leg_state,AttributeType=S AttributeName=leg_type,AttributeType=S \
  --global-secondary-index-updates \
      "Create={"IndexName"="leg-state-type-index", "KeySchema"=[ {"AttributeName"="leg_state", "KeyType"="HASH" },{"AttributeName"="leg_type", "KeyType"="RANGE" }], "Projection"={"ProjectionType"="ALL"}, "ProvisionedThroughput"= {"ReadCapacityUnits"=5, "WriteCapacityUnits"=5}   }"

