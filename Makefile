.PHONY: help install dev start stop logs test health

help:
	@echo "AI Commerce Broker - Available commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Run in development mode"
	@echo "  make start      - Start with docker-compose (production)"
	@echo "  make stop       - Stop all containers"
	@echo "  make logs       - View container logs"
	@echo "  make health     - Check broker health"
	@echo "  make test       - Run basic API tests"
	@echo ""

install:
	npm install

dev:
	NODE_ENV=development npm start

start:
	docker-compose up -d
	@echo "Broker starting... Check status with 'make health'"

stop:
	docker-compose down

logs:
	docker-compose logs -f broker

health:
	@curl -s http://localhost:3000/health | jq . || echo "Broker is not responding"

test: health
	@echo "\n=== Testing API Endpoints ===\n"
	@echo "1. Creating API key..."
	@curl -s -X POST http://localhost:3000/v1/create-apikey \
	  -H "Content-Type: application/json" \
	  -d '{"owner":"test@example.com","secret":"dev_secret_change_in_prod"}' | jq . || echo "Failed to create API key"

test-broker:
	@echo "\n2. Testing broker endpoint (requires active key from above)...\n"
	@echo "Get an API key first with: curl -X POST http://localhost:3000/v1/create-apikey -H 'Content-Type: application/json' -d '{\"owner\":\"test@example.com\",\"secret\":\"dev_secret_change_in_prod\"}'"
