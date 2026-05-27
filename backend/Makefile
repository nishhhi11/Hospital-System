CXX = g++
CXXFLAGS = -O3 -std=c++17 -Wall

all: engine

engine: engine.cpp
	$(CXX) $(CXXFLAGS) -o engine engine.cpp

clean:
	rm -f engine

run: engine
	python3 app.py
