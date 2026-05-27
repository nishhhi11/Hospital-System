#ifndef PRIORITY_QUEUE_H
#define PRIORITY_QUEUE_H

#include "patient.h"
#include <vector>
#include <algorithm>

class TriageQueue {
private:
    std::vector<Patient> heap;

    void heapifyUp(int index) {
        while (index > 0) {
            int parent = (index - 1) / 2;
            if (heap[index].getSeverityScore() > heap[parent].getSeverityScore()) {
                std::swap(heap[index], heap[parent]);
                index = parent;
            } else {
                break;
            }
        }
    }

    void heapifyDown(int index) {
        int size = heap.size();
        while (true) {
            int left = 2 * index + 1;
            int right = 2 * index + 2;
            int largest = index;

            if (left < size && heap[left].getSeverityScore() > heap[largest].getSeverityScore()) {
                largest = left;
            }
            if (right < size && heap[right].getSeverityScore() > heap[largest].getSeverityScore()) {
                largest = right;
            }

            if (largest != index) {
                std::swap(heap[index], heap[largest]);
                index = largest;
            } else {
                break;
            }
        }
    }

public:
    void push(const Patient& p) {
        heap.push_back(p);
        heapifyUp(heap.size() - 1);
    }

    Patient pop() {
        if (heap.empty()) return {};
        Patient top = heap[0];
        heap[0] = heap.back();
        heap.pop_back();
        if (!heap.empty()) heapifyDown(0);
        return top;
    }

    const std::vector<Patient>& getPatients() const {
        return heap;
    }

    bool empty() const {
        return heap.empty();
    }
};

#endif
