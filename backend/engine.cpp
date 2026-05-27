#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <fstream>
#include <memory>
#include <iomanip>
#include <ctime>

enum Severity { CRITICAL, URGENT, MODERATE, STABLE };

std::string severityToString(Severity s) {
    switch(s) {
        case CRITICAL: return "Critical";
        case URGENT: return "Urgent";
        case MODERATE: return "Moderate";
        case STABLE: return "Stable";
        default: return "Unknown";
    }
}

Severity stringToSeverity(std::string s) {
    if (s == "Critical") return CRITICAL;
    if (s == "Urgent") return URGENT;
    if (s == "Moderate") return MODERATE;
    return STABLE;
}

struct Vitals {
    std::string bp = "120/80";
    int hr = 75;
    int spo2 = 98;
    float temp = 37.0;
};

struct Patient {
    std::string id;
    std::string name;
    int age;
    std::string gender;
    Severity severity;
    std::string arrival_time;
    std::string status;
    std::string doctor = "Unassigned";
    std::string chief_complaint = "";
    std::string notes = "";
    std::string assigned_bed = "";
    Vitals vitals;

    int getPriority() const { return 4 - static_cast<int>(severity); }
};

struct Bed {
    std::string id;
    std::string room;
    std::string type;
    std::string status; 
    std::string patient_id = "";
    int floor;
};

struct Alert {
    std::string id;
    std::string level;
    std::string message;
    std::string time;
    std::string category;
    bool read = false;
};

struct AVLNode {
    std::shared_ptr<Patient> patient;
    AVLNode *left, *right;
    int height;
    AVLNode(std::shared_ptr<Patient> p) : patient(p), left(nullptr), right(nullptr), height(1) {}
};

class AVLTree {
    AVLNode* root = nullptr;
    int height(AVLNode* n) { return n ? n->height : 0; }
    int getBalance(AVLNode* n) { return n ? height(n->left) - height(n->right) : 0; }

    AVLNode* rotateRight(AVLNode* y) {
        AVLNode* x = y->left;
        AVLNode* T2 = x->right;
        x->right = y;
        y->left = T2;
        y->height = std::max(height(y->left), height(y->right)) + 1;
        x->height = std::max(height(x->left), height(x->right)) + 1;
        return x;
    }

    AVLNode* rotateLeft(AVLNode* x) {
        AVLNode* y = x->right;
        AVLNode* T2 = y->left;
        y->left = x;
        x->right = T2;
        x->height = std::max(height(x->left), height(x->right)) + 1;
        y->height = std::max(height(y->left), height(y->right)) + 1;
        return y;
    }

    AVLNode* insert(AVLNode* node, std::shared_ptr<Patient> p) {
        if (!node) return new AVLNode(p);
        if (p->getPriority() < node->patient->getPriority())
            node->left = insert(node->left, p);
        else 
            node->right = insert(node->right, p);

        node->height = 1 + std::max(height(node->left), height(node->right));
        int balance = getBalance(node);

        if (balance > 1 && p->getPriority() < node->left->patient->getPriority()) return rotateRight(node);
        if (balance < -1 && p->getPriority() >= node->right->patient->getPriority()) return rotateLeft(node);
        if (balance > 1 && p->getPriority() >= node->left->patient->getPriority()) {
            node->left = rotateLeft(node->left);
            return rotateRight(node);
        }
        if (balance < -1 && p->getPriority() < node->right->patient->getPriority()) {
            node->right = rotateRight(node->right);
            return rotateLeft(node);
        }
        return node;
    }

    void toJson(AVLNode* n) {
        if (!n) { std::cout << "null"; return; }
        std::cout << "{" << "\"id\":\"" << n->patient->id << "\"," << "\"name\":\"" << n->patient->name << "\"," << "\"severity\":\"" << severityToString(n->patient->severity) << "\"," << "\"height\":" << n->height << "," << "\"left\":"; toJson(n->left); std::cout << ",\"right\":"; toJson(n->right); std::cout << "}";
    }

public:
    void add(std::shared_ptr<Patient> p) { root = insert(root, p); }
    void printJson() { toJson(root); }
    void clear() { root = nullptr; }
};

class TriageHeap {
    std::vector<std::shared_ptr<Patient>> heap;
    bool compare(std::shared_ptr<Patient> a, std::shared_ptr<Patient> b) {
        if (a->getPriority() != b->getPriority()) return a->getPriority() > b->getPriority();
        if (a->age != b->age) return a->age > b->age;
        return a->arrival_time < b->arrival_time;
    }
    void heapifyUp(int i) {
        while (i > 0 && compare(heap[i], heap[(i-1)/2])) { std::swap(heap[i], heap[(i-1)/2]); i = (i-1)/2; }
    }
    void heapifyDown(int i) {
        int largest = i;
        int l = 2*i + 1, r = 2*i + 2;
        if (l < heap.size() && compare(heap[l], heap[largest])) largest = l;
        if (r < heap.size() && compare(heap[r], heap[largest])) largest = r;
        if (largest != i) { std::swap(heap[i], heap[largest]); heapifyDown(largest); }
    }
public:
    void push(std::shared_ptr<Patient> p) { heap.push_back(p); heapifyUp(heap.size() - 1); }
    const std::vector<std::shared_ptr<Patient>>& getAll() const { return heap; }
    std::shared_ptr<Patient> find(std::string id) { for (auto& p : heap) if (p->id == id) return p; return nullptr; }
    void clear() { heap.clear(); }
    void rebuild() { for (int i = heap.size() / 2 - 1; i >= 0; i--) heapifyDown(i); }
};

TriageHeap triage;
AVLTree registry;
std::vector<Bed> beds;
std::vector<Alert> alerts;

void initBeds() {
    beds = {
        {"T-01", "Trauma Bay 1", "Trauma", "Available", "", 1}, {"T-02", "Trauma Bay 2", "Trauma", "Available", "", 1}, {"T-03", "Trauma Bay 3", "Trauma", "Available", "", 1}, {"T-04", "Trauma Bay 4", "Trauma", "Available", "", 1},
        {"I-01", "ICU Bay 1", "ICU", "Available", "", 2}, {"I-02", "ICU Bay 2", "ICU", "Available", "", 2}, {"I-03", "ICU Bay 3", "ICU", "Available", "", 2}, {"I-04", "ICU Bay 4", "ICU", "Available", "", 2},
        {"G-01", "General 1", "General", "Available", "", 3}, {"G-02", "General 2", "General", "Available", "", 3}, {"G-03", "General 3", "General", "Available", "", 3}, {"G-04", "General 4", "General", "Available", "", 3},
        {"G-05", "General 5", "General", "Available", "", 3}, {"G-06", "General 6", "General", "Available", "", 3}, {"G-07", "General 7", "General", "Available", "", 3}, {"G-08", "General 8", "General", "Available", "", 3},
        {"O-01", "Observation 1", "Observation", "Available", "", 4}, {"O-02", "Observation 2", "Observation", "Available", "", 4}, {"O-03", "Observation 3", "Observation", "Available", "", 4}, {"O-04", "Observation 4", "Observation", "Available", "", 4}
    };
}

bool dfs_assign_bed(std::shared_ptr<Patient> p, int current_floor) {
    if (current_floor > 4) return false;
    for (auto& bed : beds) {
        if (bed.floor == current_floor && bed.status == "Available") {
            p->assigned_bed = bed.id;
            p->status = "In Treatment";
            return true;
        }
    }
    return dfs_assign_bed(p, current_floor + 1);
}

void updateBedStates() {
    for (auto& b : beds) { b.status = "Available"; b.patient_id = ""; }
    for (auto& p : triage.getAll()) {
        if (!p->assigned_bed.empty() && p->assigned_bed != "none") {
            for (auto& b : beds) { if (b.id == p->assigned_bed) { b.status = "Occupied"; b.patient_id = p->id; break; } }
        }
    }
}

void generateAlerts() {
    alerts.clear();
    for (auto& p : triage.getAll()) {
        if (p->severity == CRITICAL) { alerts.push_back({"A-" + std::to_string(alerts.size() + 1), "critical", "Critical Patient: " + p->name, "Now", "Code"}); }
    }
}

struct Action {
    std::string type;
    std::shared_ptr<Patient> p;
    std::string old_val;
};

std::vector<Action> undo_stack;

void loadUndo() {
    std::ifstream in("undo.db");
    if (!in) return;
    std::string type, id, name, gender, severity, arrival, status, bed, old_val;
    int age;
    undo_stack.clear();
    while (in >> type >> id >> std::quoted(name) >> age >> gender >> severity >> arrival >> std::quoted(status) >> bed >> std::quoted(old_val)) {
        auto p = std::make_shared<Patient>();
        p->id = id; p->name = name; p->age = age; p->gender = gender; p->severity = stringToSeverity(severity); p->arrival_time = arrival; p->status = status; p->assigned_bed = (bed == "none" ? "" : bed);
        undo_stack.push_back({type, p, old_val});
    }
}

void saveUndo() {
    std::ofstream out("undo.db");
    for (auto& a : undo_stack) {
        out << a.type << " " << a.p->id << " " << std::quoted(a.p->name) << " " << a.p->age << " " << a.p->gender << " " << severityToString(a.p->severity) << " " << a.p->arrival_time << " " << std::quoted(a.p->status) << " " << (a.p->assigned_bed.empty() ? "none" : a.p->assigned_bed) << " " << std::quoted(a.old_val) << "\n";
    }
}

void pushUndo(std::string type, std::shared_ptr<Patient> p, std::string old_val = "none") {
    loadUndo();
    undo_stack.push_back({type, p, old_val});
    if (undo_stack.size() > 5) {
        undo_stack.erase(undo_stack.begin()); // Keep only last 5
    }
    saveUndo();
}

void load() {
    std::ifstream in("patients.db");
    if (!in) return;
    std::string id, name, gender, severity, arrival, status, bed, cc, doc, notes, bp;
    int age, hr, spo2;
    float temp;
    while (in >> id >> std::quoted(name) >> age >> gender >> severity >> arrival >> std::quoted(status) >> bed >> std::quoted(cc) >> std::quoted(doc) >> std::quoted(notes) >> std::quoted(bp) >> hr >> spo2 >> temp) {
        auto p = std::make_shared<Patient>();
        p->id = id; p->name = name; p->age = age; p->gender = gender; p->severity = stringToSeverity(severity); 
        p->arrival_time = arrival; p->status = status; p->assigned_bed = (bed == "none" ? "" : bed);
        p->chief_complaint = cc; p->doctor = doc; p->notes = notes; 
        p->vitals.bp = bp; p->vitals.hr = hr; p->vitals.spo2 = spo2; p->vitals.temp = temp;
        triage.push(p); registry.add(p);
    }
    updateBedStates(); generateAlerts();
}

void save() {
    std::ofstream out("patients.db");
    for (auto& p : triage.getAll()) {
        out << p->id << " " << std::quoted(p->name) << " " << p->age << " " << p->gender << " " << severityToString(p->severity) << " " << p->arrival_time << " " << std::quoted(p->status) << " " << (p->assigned_bed.empty() ? "none" : p->assigned_bed) << " " << std::quoted(p->chief_complaint) << " " << std::quoted(p->doctor) << " " << std::quoted(p->notes) << " " << std::quoted(p->vitals.bp) << " " << p->vitals.hr << " " << p->vitals.spo2 << " " << p->vitals.temp << "\n";
    }
}

bool checkArgs(int argc, int expected, const std::string& cmd) {
    if (argc < expected) {
        std::cerr << "{\"error\":\"Missing arguments for " << cmd << ". Expected " << (expected - 1) << "\"}" << std::endl;
        return false;
    }
    return true;
}

struct MedicalEvent {
    std::string id;
    std::string patient_id;
    std::string patient_name;
    std::string type;
    std::string title;
    std::string date;
    std::string time;
    Severity priority;
    std::string department;
    std::string doctor;
    std::string status;

    // Helper to get priority level (lower is more urgent)
    int getPriorityLevel() const { return static_cast<int>(priority); }
};

class AlertMinHeap {
    std::vector<std::shared_ptr<MedicalEvent>> heap;

    void heapifyUp(int i) {
        while (i > 0) {
            int p = (i - 1) / 2;
            if (compare(heap[i], heap[p])) {
                std::swap(heap[i], heap[p]);
                i = p;
            } else break;
        }
    }

    void heapifyDown(int i) {
        int smallest = i;
        int l = 2 * i + 1;
        int r = 2 * i + 2;
        int n = heap.size();
        if (l < n && compare(heap[l], heap[smallest])) smallest = l;
        if (r < n && compare(heap[r], heap[smallest])) smallest = r;
        if (smallest != i) {
            std::swap(heap[i], heap[smallest]);
            heapifyDown(smallest);
        }
    }

    // Min-heap comparison: true if 'a' is MORE URGENT than 'b'
    // Priority: CRITICAL (0) < URGENT (1) < MODERATE (2) < STABLE (3)
    bool compare(const std::shared_ptr<MedicalEvent>& a, const std::shared_ptr<MedicalEvent>& b) const {
        if (a->getPriorityLevel() != b->getPriorityLevel()) {
            return a->getPriorityLevel() < b->getPriorityLevel(); // Smaller value = more urgent
        }
        // If same priority, compare by Date/Time (earliest first)
        if (a->date != b->date) return a->date < b->date;
        return a->time < b->time;
    }

public:
    void push(std::shared_ptr<MedicalEvent> e) {
        heap.push_back(e);
        heapifyUp(heap.size() - 1);
    }
    
    void remove(std::string id) {
        for (size_t i = 0; i < heap.size(); ++i) {
            if (heap[i]->id == id) {
                heap[i] = heap.back();
                heap.pop_back();
                if (i < heap.size()) {
                    heapifyDown(i);
                    heapifyUp(i);
                }
                break;
            }
        }
    }

    const std::vector<std::shared_ptr<MedicalEvent>>& getAll() const { return heap; }
    void clear() { heap.clear(); }
};

AlertMinHeap alertQueue;

void loadEvents() {
    std::ifstream in("events.db");
    if (!in) return;
    std::string id, pid, pname, type, title, date, time, prio, dept, doc, status;
    while (in >> id >> pid >> std::quoted(pname) >> std::quoted(type) >> std::quoted(title) >> date >> time >> prio >> std::quoted(dept) >> std::quoted(doc) >> std::quoted(status)) {
        auto e = std::make_shared<MedicalEvent>();
        e->id = id; e->patient_id = pid; e->patient_name = pname; e->type = type; e->title = title;
        e->date = date; e->time = time; e->priority = stringToSeverity(prio); e->department = dept;
        e->doctor = doc; e->status = status;
        alertQueue.push(e);
    }
}

void saveEvents() {
    std::ofstream out("events.db");
    for (auto& e : alertQueue.getAll()) {
        out << e->id << " " << e->patient_id << " " << std::quoted(e->patient_name) << " " 
            << std::quoted(e->type) << " " << std::quoted(e->title) << " " << e->date << " " 
            << e->time << " " << severityToString(e->priority) << " " << std::quoted(e->department) 
            << " " << std::quoted(e->doctor) << " " << std::quoted(e->status) << "\n";
    }
}


int main(int argc, char* argv[]) {
    initBeds();
    load();
    loadEvents();
    if (argc < 2) { std::cerr << "{\"error\":\"No command provided\"}" << std::endl; return 1; }
    std::string cmd = argv[1];
    
    try {
        if (cmd == "add") {
            if (!checkArgs(argc, 14, "add")) return 1;
            auto p = std::make_shared<Patient>();
            p->id = argv[2]; p->name = argv[3]; p->age = std::stoi(argv[4]); p->gender = argv[5]; p->chief_complaint = argv[6]; p->severity = stringToSeverity(argv[7]); p->arrival_time = argv[8]; p->notes = argv[9]; p->vitals.bp = argv[10]; p->vitals.hr = std::stoi(argv[11]); p->vitals.spo2 = std::stoi(argv[12]); p->vitals.temp = std::stof(argv[13]); p->status = "Waiting";
            dfs_assign_bed(p, 1);
            pushUndo("ADD", p);
            triage.push(p); registry.add(p); save();
            std::cout << "{\"status\":\"success\"}" << std::endl;
        } else if (cmd == "update") {
            if (!checkArgs(argc, 13, "update")) return 1;
            auto p = triage.find(argv[2]);
            if (p) {
                p->name = argv[3]; p->age = std::stoi(argv[4]); p->gender = argv[5]; p->chief_complaint = argv[6]; p->severity = stringToSeverity(argv[7]); p->notes = argv[8]; p->vitals.bp = argv[9]; p->vitals.hr = std::stoi(argv[10]); p->vitals.spo2 = std::stoi(argv[11]); p->vitals.temp = std::stof(argv[12]);
                save(); std::cout << "{\"status\":\"success\"}" << std::endl;
            } else { std::cout << "{\"error\":\"Not found\"}" << std::endl; }
        } else if (cmd == "add_event") {
            if (!checkArgs(argc, 13, "add_event")) return 1;
            auto e = std::make_shared<MedicalEvent>();
            e->id = argv[2]; e->patient_id = argv[3]; e->patient_name = argv[4]; e->type = argv[5];
            e->title = argv[6]; e->date = argv[7]; e->time = argv[8]; e->priority = stringToSeverity(argv[9]);
            e->department = argv[10]; e->doctor = argv[11]; e->status = argv[12];
            alertQueue.push(e); saveEvents();
            std::cout << "{\"status\":\"success\"}" << std::endl;
        } else if (cmd == "get_events") {
            auto events = alertQueue.getAll();
            std::vector<std::shared_ptr<MedicalEvent>> valid_events;
            bool needed_cleanup = false;
            for (auto& e : events) {
                auto p = triage.find(e->patient_id);
                if (p) {
                    if (e->patient_name != p->name) {
                        e->patient_name = p->name;
                        needed_cleanup = true;
                    }
                    valid_events.push_back(e);
                } else {
                    needed_cleanup = true;
                }
            }
            if (needed_cleanup) {
                alertQueue.clear();
                for (auto& e : valid_events) alertQueue.push(e);
                saveEvents();
            }
            
            // Sort to output exact heap Priority Order
            std::sort(valid_events.begin(), valid_events.end(), [](const std::shared_ptr<MedicalEvent>& a, const std::shared_ptr<MedicalEvent>& b) {
                if (a->getPriorityLevel() != b->getPriorityLevel()) return a->getPriorityLevel() < b->getPriorityLevel();
                if (a->date != b->date) return a->date < b->date;
                return a->time < b->time;
            });
            std::cout << "[";
            for (size_t i = 0; i < valid_events.size(); ++i) {
                std::cout << "{" << "\"id\":\"" << valid_events[i]->id << "\"," << "\"patient_id\":\"" << valid_events[i]->patient_id << "\"," 
                          << "\"patient_name\":\"" << valid_events[i]->patient_name << "\"," << "\"type\":\"" << valid_events[i]->type << "\"," 
                          << "\"title\":\"" << valid_events[i]->title << "\"," << "\"date\":\"" << valid_events[i]->date << "\"," 
                          << "\"time\":\"" << valid_events[i]->time << "\"," << "\"priority\":\"" << severityToString(valid_events[i]->priority) << "\"," 
                          << "\"department\":\"" << valid_events[i]->department << "\"," << "\"doctor\":\"" << valid_events[i]->doctor << "\"," 
                          << "\"status\":\"" << valid_events[i]->status << "\"}";
                if (i < valid_events.size() - 1) std::cout << ",";
            }
            std::cout << "]" << std::endl;
        } else if (cmd == "delete_event") {
            if (!checkArgs(argc, 3, "delete_event")) return 1;
            alertQueue.remove(argv[2]); saveEvents();
            std::cout << "{\"status\":\"success\"}" << std::endl;
        } else if (cmd == "update_event_status") {
            if (!checkArgs(argc, 4, "update_event_status")) return 1;
            std::string target_id = argv[2];
            std::string new_status = argv[3];
            bool found = false;
            for (auto& e : alertQueue.getAll()) {
                if (e->id == target_id) { e->status = new_status; found = true; break; }
            }
            if (found) { saveEvents(); std::cout << "{\"status\":\"success\"}" << std::endl; }
            else std::cout << "{\"error\":\"Event not found\"}" << std::endl;
        } else if (cmd == "triage") {
            auto patients = triage.getAll();
            // Sort by priority for the general patient list UI
            std::sort(patients.begin(), patients.end(), [](const std::shared_ptr<Patient>& a, const std::shared_ptr<Patient>& b) {
                if (a->getPriority() != b->getPriority()) return a->getPriority() > b->getPriority();
                return a->arrival_time < b->arrival_time; // Earlier arrival first for same priority
            });
            std::cout << "[";
            for (size_t i = 0; i < patients.size(); ++i) {
                std::cout << "{" << "\"id\":\"" << patients[i]->id << "\"," << "\"name\":\"" << patients[i]->name << "\"," << "\"age\":" << patients[i]->age << "," << "\"gender\":\"" << patients[i]->gender << "\"," << "\"chief_complaint\":\"" << patients[i]->chief_complaint << "\"," << "\"severity\":\"" << severityToString(patients[i]->severity) << "\"," << "\"arrival_time\":\"" << patients[i]->arrival_time << "\"," << "\"status\":\"" << patients[i]->status << "\"," << "\"doctor\":\"" << patients[i]->doctor << "\"," << "\"notes\":\"" << patients[i]->notes << "\"," << "\"assigned_bed\":\"" << patients[i]->assigned_bed << "\"," << "\"vitals\":{" << "\"bp\":\"" << patients[i]->vitals.bp << "\"," << "\"hr\":" << patients[i]->vitals.hr << "," << "\"spo2\":" << patients[i]->vitals.spo2 << "," << "\"temp\":" << patients[i]->vitals.temp << "}}";
                if (i < patients.size() - 1) std::cout << ",";
            }
            std::cout << "]" << std::endl;
        } else if (cmd == "heap") {
            auto patients = triage.getAll(); // Raw heap order
            std::cout << "[";
            for (size_t i = 0; i < patients.size(); ++i) {
                std::cout << "{" << "\"id\":\"" << patients[i]->id << "\"," << "\"name\":\"" << patients[i]->name << "\"," << "\"severity\":\"" << severityToString(patients[i]->severity) << "\"}";
                if (i < patients.size() - 1) std::cout << ",";
            }
            std::cout << "]" << std::endl;
        } else if (cmd == "avl") {
            registry.printJson(); std::cout << std::endl;
        } else if (cmd == "beds") {
            updateBedStates(); std::cout << "[";
            for (size_t i = 0; i < beds.size(); ++i) {
                std::string occ = "Available"; if (!beds[i].patient_id.empty()) { auto p = triage.find(beds[i].patient_id); if (p) occ = p->name; }
                std::cout << "{" << "\"id\":\"" << beds[i].id << "\"," << "\"room\":\"" << beds[i].room << "\"," << "\"type\":\"" << beds[i].type << "\"," << "\"status\":\"" << beds[i].status << "\"," << "\"patient_id\":\"" << beds[i].patient_id << "\"," << "\"patient_name\":\"" << occ << "\"," << "\"floor\":" << beds[i].floor << "}";
                if (i < beds.size() - 1) std::cout << ",";
            }
            std::cout << "]" << std::endl;
        } else if (cmd == "alerts") {
            generateAlerts(); std::cout << "[";
            for (size_t i = 0; i < alerts.size(); ++i) {
                std::cout << "{" << "\"id\":\"" << alerts[i].id << "\"," << "\"level\":\"" << alerts[i].level << "\"," << "\"message\":\"" << alerts[i].message << "\"," << "\"time\":\"" << alerts[i].time << "\"," << "\"category\":\"" << alerts[i].category << "\"," << "\"read\":" << (alerts[i].read ? "true" : "false") << "}";
                if (i < alerts.size() - 1) std::cout << ",";
            }
            std::cout << "]" << std::endl;
        } else if (cmd == "assign_bed") {
            if (!checkArgs(argc, 4, "assign_bed")) return 1;
            auto p = triage.find(argv[2]);
            if (p) { pushUndo("ASSIGN_BED", p, p->assigned_bed); p->assigned_bed = argv[3]; p->status = "In Treatment"; save(); std::cout << "{\"status\":\"success\"}" << std::endl; }
            else std::cout << "{\"error\":\"Patient not found\"}" << std::endl;
        } else if (cmd == "discharge_bed") {
            if (!checkArgs(argc, 3, "discharge_bed")) return 1;
            bool found = false;
            for (auto& p : triage.getAll()) { if (p->assigned_bed == argv[2]) { pushUndo("DISCHARGE_BED", p, p->assigned_bed); p->assigned_bed = ""; p->status = "Waiting"; found = true; } }
            if (found) { save(); std::cout << "{\"status\":\"success\"}" << std::endl; }
            else std::cout << "{\"error\":\"Bed not occupied\"}" << std::endl;
        } else if (cmd == "get") {
            if (!checkArgs(argc, 3, "get")) return 1;
            auto p = triage.find(argv[2]);
            if (p) std::cout << "{" << "\"id\":\"" << p->id << "\"," << "\"name\":\"" << p->name << "\"," << "\"age\":" << p->age << "," << "\"gender\":\"" << p->gender << "\"," << "\"chief_complaint\":\"" << p->chief_complaint << "\"," << "\"severity\":\"" << severityToString(p->severity) << "\"," << "\"arrival_time\":\"" << p->arrival_time << "\"," << "\"status\":\"" << p->status << "\"," << "\"doctor\":\"" << p->doctor << "\"," << "\"notes\":\"" << p->notes << "\"," << "\"assigned_bed\":\"" << p->assigned_bed << "\"," << "\"vitals\":{" << "\"bp\":\"" << p->vitals.bp << "\"," << "\"hr\":" << p->vitals.hr << "," << "\"spo2\":" << p->vitals.spo2 << "," << "\"temp\":" << p->vitals.temp << "}}" << std::endl;
            else std::cout << "{\"error\":\"Not found\"}" << std::endl;
        } else if (cmd == "update_severity") {
            if (!checkArgs(argc, 4, "update_severity")) return 1;
            auto p = triage.find(argv[2]);
            if (p) { pushUndo("UPDATE_SEVERITY", p, severityToString(p->severity)); p->severity = stringToSeverity(argv[3]); triage.rebuild(); save(); std::cout << "{\"status\":\"success\"}" << std::endl; }
            else std::cout << "{\"error\":\"Not found\"}" << std::endl;
        } else if (cmd == "search") {
            if (!checkArgs(argc, 4, "search")) return 1;
            std::string mode = argv[2];
            std::vector<std::shared_ptr<Patient>> all = triage.getAll();
            std::vector<std::shared_ptr<Patient>> results;
            if (mode == "id") {
                std::sort(all.begin(), all.end(), [](auto a, auto b) { return a->id < b->id; });
                int l = 0, r = all.size() - 1;
                while (l <= r) {
                    int m = l + (r - l) / 2;
                    if (all[m]->id == argv[3]) { results.push_back(all[m]); break; }
                    if (all[m]->id < argv[3]) l = m + 1;
                    else r = m - 1;
                }
            } else if (mode == "name") {
                if (!checkArgs(argc, 5, "search")) return 1;
                std::string start_char = argv[3];
                std::string end_char = argv[4];
                for (auto& p : all) {
                    if (p->name >= start_char && p->name <= end_char) results.push_back(p);
                }
            }
            std::cout << "[";
            for (size_t i = 0; i < results.size(); ++i) {
                std::cout << "{" << "\"id\":\"" << results[i]->id << "\"," << "\"name\":\"" << results[i]->name << "\"," << "\"severity\":\"" << severityToString(results[i]->severity) << "\"}";
                if (i < results.size() - 1) std::cout << ",";
            }
            std::cout << "]" << std::endl;
        } else if (cmd == "predict_wait_time") {
            if (!checkArgs(argc, 3, "predict_wait_time")) return 1;
            std::string id = argv[2];
            auto all = triage.getAll();
            std::sort(all.begin(), all.end(), [](auto a, auto b) {
                if (a->getPriority() != b->getPriority()) return a->getPriority() > b->getPriority();
                if (a->age != b->age) return a->age > b->age;
                return a->arrival_time < b->arrival_time;
            });
            int pos = -1;
            for (size_t i = 0; i < all.size(); i++) {
                if (all[i]->id == id) { pos = i; break; }
            }
            if (pos != -1) {
                int wait_time = pos * 15 + 5;
                std::cout << "{\"wait_time\":" << wait_time << "}" << std::endl;
            } else {
                std::cout << "{\"error\":\"Not found\"}" << std::endl;
            }
        } else if (cmd == "delete") {
            if (!checkArgs(argc, 3, "delete")) return 1;
            std::string target_id = argv[2];
            std::vector<std::shared_ptr<Patient>> all = triage.getAll();
            bool found = false; triage.clear(); registry.clear();
            for (auto& p : all) { 
                if (p->id != target_id) { triage.push(p); registry.add(p); } 
                else { found = true; pushUndo("DELETE", p); } 
            }
            if (found) { save(); std::cout << "{\"status\":\"success\"}" << std::endl; }
            else std::cout << "{\"error\":\"Not found\"}" << std::endl;
        } else if (cmd == "undo") {
            loadUndo();
            if (undo_stack.empty()) {
                std::cout << "{\"error\":\"Nothing to undo\"}" << std::endl;
                return 0;
            }
            Action top = undo_stack.back();
            undo_stack.pop_back();
            saveUndo();
            
            if (top.type == "ADD") {
                // To undo ADD, delete the patient
                std::vector<std::shared_ptr<Patient>> all = triage.getAll();
                triage.clear(); registry.clear();
                for (auto& p : all) { if (p->id != top.p->id) { triage.push(p); registry.add(p); } }
            } else if (top.type == "DELETE") {
                // To undo DELETE, add the patient back
                triage.push(top.p); registry.add(top.p);
            } else if (top.type == "UPDATE_SEVERITY") {
                auto p = triage.find(top.p->id);
                if (p) p->severity = stringToSeverity(top.old_val);
            } else if (top.type == "ASSIGN_BED") {
                auto p = triage.find(top.p->id);
                if (p) { p->assigned_bed = (top.old_val == "none" ? "" : top.old_val); p->status = (p->assigned_bed.empty() ? "Waiting" : "In Treatment"); }
            } else if (top.type == "DISCHARGE_BED") {
                auto p = triage.find(top.p->id);
                if (p) { p->assigned_bed = top.old_val; p->status = "In Treatment"; }
            }
            save();
            std::cout << "{\"status\":\"success\", \"restored_action\":\"" << top.type << "\", \"patient\":\"" << top.p->name << "\"}" << std::endl;
        } else if (cmd == "stack") {
            loadUndo();
            std::cout << "[";
            for (size_t i = 0; i < undo_stack.size(); ++i) {
                std::cout << "{\"type\":\"" << undo_stack[i].type << "\",\"patient\":\"" << undo_stack[i].p->name << "\",\"old_val\":\"" << undo_stack[i].old_val << "\"}";
                if (i < undo_stack.size() - 1) std::cout << ",";
            }
            std::cout << "]" << std::endl;
        }
    } catch (const std::exception& e) {
        std::cerr << "{\"error\":\"Exception: " << e.what() << "\"}" << std::endl;
        return 1;
    }
    return 0;
}
