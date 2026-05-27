#ifndef PATIENT_H
#define PATIENT_H

#include <string>
#include <vector>

enum class Severity {
    CRITICAL = 0,
    URGENT = 1,
    MODERATE = 2,
    STABLE = 3
};

struct Vitals {
    std::string bp;
    int hr;
    int spo2;
    float temp;
};

struct Patient {
    std::string id;
    std::string name;
    int age;
    char gender;
    std::string chief_complaint;
    Severity severity;
    std::string arrival_time;
    std::string assigned_bed;
    std::string doctor;
    std::string notes;
    Vitals vitals;
    std::string status;

    // Helper to get severity score for priority queue
    int getSeverityScore() const {
        return 4 - static_cast<int>(severity);
    }
};

#endif
