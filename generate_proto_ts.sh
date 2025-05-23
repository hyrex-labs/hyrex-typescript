#!/bin/bash
set -e

# Directory containing proto files
PROTO_DIR="./dispatchers/platform/proto"

# Output directory for generated files
OUTPUT_DIR="./dispatchers/platform/generated"

# Create output directory if it doesn't exist
mkdir -p ${OUTPUT_DIR}

echo "Generating TypeScript code from proto files..."

# Find the protoc executable from grpc-tools
PROTOC="./node_modules/.bin/grpc_tools_node_protoc"

# Generate JavaScript/TypeScript files
${PROTOC} \
  --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
  --js_out=import_style=commonjs,binary:${OUTPUT_DIR} \
  --grpc_out=grpc_js:${OUTPUT_DIR} \
  --ts_out=service=grpc-node,mode=grpc-js:${OUTPUT_DIR} \
  -I ${PROTO_DIR} \
  -I ./node_modules/google-protobuf/src \
  ${PROTO_DIR}/*.proto

echo "TypeScript clients generated successfully in ${OUTPUT_DIR}"