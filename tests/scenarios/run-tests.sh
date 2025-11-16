#!/bin/bash

###############################################################################
# Scenario Test Runner Script
# 
# This script provides convenient commands to run scenario tests with
# various options and configurations.
###############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Function to print header
print_header() {
    echo ""
    print_color "$BLUE" "============================================"
    print_color "$BLUE" "$1"
    print_color "$BLUE" "============================================"
    echo ""
}

# Check if jest is installed
if ! command -v jest &> /dev/null; then
    print_color "$RED" "Error: Jest is not installed"
    print_color "$YELLOW" "Please run: npm install --save-dev jest ts-jest @types/jest"
    exit 1
fi

# Parse command line arguments
CATEGORY=""
COVERAGE=false
WATCH=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --category|-c)
            CATEGORY="$2"
            shift 2
            ;;
        --coverage)
            COVERAGE=true
            shift
            ;;
        --watch|-w)
            WATCH=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "Usage: ./run-tests.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -c, --category CATEGORY    Run tests for specific category (cardiovascular, neurological, trauma, medical)"
            echo "  --coverage                 Generate coverage report"
            echo "  -w, --watch                Run in watch mode"
            echo "  -v, --verbose              Verbose output"
            echo "  -h, --help                 Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./run-tests.sh                              # Run all tests"
            echo "  ./run-tests.sh -c cardiovascular           # Run only cardiovascular tests"
            echo "  ./run-tests.sh --coverage                  # Run all tests with coverage"
            echo "  ./run-tests.sh -c trauma --watch           # Run trauma tests in watch mode"
            exit 0
            ;;
        *)
            print_color "$RED" "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Build jest command
JEST_CMD="jest"

if [ ! -z "$CATEGORY" ]; then
    case $CATEGORY in
        cardiovascular)
            JEST_CMD="$JEST_CMD cardiovascular/CardiovascularScenarios.test.ts"
            ;;
        neurological)
            JEST_CMD="$JEST_CMD neurological/NeurologicalScenarios.test.ts"
            ;;
        trauma)
            JEST_CMD="$JEST_CMD trauma/TraumaScenarios.test.ts"
            ;;
        medical)
            JEST_CMD="$JEST_CMD medical/MedicalScenarios.test.ts"
            ;;
        *)
            print_color "$RED" "Unknown category: $CATEGORY"
            print_color "$YELLOW" "Valid categories: cardiovascular, neurological, trauma, medical"
            exit 1
            ;;
    esac
fi

if [ "$COVERAGE" = true ]; then
    JEST_CMD="$JEST_CMD --coverage"
fi

if [ "$WATCH" = true ]; then
    JEST_CMD="$JEST_CMD --watch"
fi

if [ "$VERBOSE" = true ]; then
    JEST_CMD="$JEST_CMD --verbose"
fi

# Print test configuration
print_header "Running EMS MedHx Scenario Tests"

if [ ! -z "$CATEGORY" ]; then
    print_color "$GREEN" "Category: $CATEGORY"
else
    print_color "$GREEN" "Category: All"
fi

print_color "$GREEN" "Coverage: $COVERAGE"
print_color "$GREEN" "Watch Mode: $WATCH"
print_color "$GREEN" "Verbose: $VERBOSE"
echo ""

# Run tests
print_color "$BLUE" "Executing: $JEST_CMD"
echo ""

eval $JEST_CMD

# Check exit status
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    print_color "$GREEN" "✓ All tests passed!"
else
    print_color "$RED" "✗ Some tests failed"
fi

exit $EXIT_CODE

