#!/bin/bash

# Create output directory if it doesn't exist
mkdir -p out

# Navigate to src to handle relative inputs correctly
cd src

# Run pdflatex with output directed to ../out
pdflatex -output-directory=../out main.tex

# Run bibtex on the aux file in the out directory
bibtex ../out/main.aux

# Run pdflatex twice more to resolve citations and cross-references
pdflatex -output-directory=../out main.tex
pdflatex -output-directory=../out main.tex

echo "Compilation complete. Output files are in the 'out' directory."
