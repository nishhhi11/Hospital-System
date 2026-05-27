#ifndef AVL_TREE_H
#define AVL_TREE_H

#include "patient.h"
#include <string>
#include <algorithm>

struct AVLNode {
    Patient patient;
    AVLNode *left, *right;
    int height;

    AVLNode(Patient p) : patient(p), left(nullptr), right(nullptr), height(1) {}
};

class PatientRegistry {
private:
    AVLNode* root;

    int height(AVLNode* node) { return node ? node->height : 0; }

    int getBalance(AVLNode* node) {
        return node ? height(node->left) - height(node->right) : 0;
    }

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

    AVLNode* insert(AVLNode* node, Patient p) {
        if (!node) return new AVLNode(p);

        if (p.id < node->patient.id)
            node->left = insert(node->left, p);
        else if (p.id > node->patient.id)
            node->right = insert(node->right, p);
        else
            return node;

        node->height = 1 + std::max(height(node->left), height(node->right));
        int balance = getBalance(node);

        if (balance > 1 && p.id < node->left->patient.id)
            return rotateRight(node);
        if (balance < -1 && p.id > node->right->patient.id)
            return rotateLeft(node);
        if (balance > 1 && p.id > node->left->patient.id) {
            node->left = rotateLeft(node->left);
            return rotateRight(node);
        }
        if (balance < -1 && p.id < node->right->patient.id) {
            node->right = rotateRight(node->right);
            return rotateLeft(node);
        }
        return node;
    }

    Patient* search(AVLNode* node, std::string id) {
        if (!node) return nullptr;
        if (node->patient.id == id) return &(node->patient);
        if (id < node->patient.id) return search(node->left, id);
        return search(node->right, id);
    }

public:
    PatientRegistry() : root(nullptr) {}

    void add(Patient p) { root = insert(root, p); }

    Patient* find(std::string id) { return search(root, id); }
};

#endif
