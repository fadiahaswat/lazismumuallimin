// DOM manipulation utilities for common operations

/**
 * Show or hide an element by its ID
 * @param {string} id - Element ID
 * @param {boolean} show - True to show, false to hide
 */
export function toggleElement(id, show = true) {
    const element = document.getElementById(id);
    if (!element) return;
    
    if (show) {
        element.classList.remove('hidden');
    } else {
        element.classList.add('hidden');
    }
}

/**
 * Show an element by its ID
 * @param {string} id - Element ID
 */
export function showElement(id) {
    toggleElement(id, true);
}

/**
 * Hide an element by its ID
 * @param {string} id - Element ID
 */
export function hideElement(id) {
    toggleElement(id, false);
}

/**
 * Safely set element content/property
 * @param {string} id - Element ID
 * @param {string} property - Property name (innerText, innerHTML, src, etc)
 * @param {any} value - Value to set
 */
export function safeSetElement(id, property, value) {
    const element = document.getElementById(id);
    if (element) {
        element[property] = value;
    }
}

/**
 * Open a modal with animation
 * @param {string} modalId - Modal element ID
 * @param {string} panelId - Modal panel element ID (optional, for scale animation)
 */
export function openModal(modalId, panelId = null) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('hidden');
    
    if (panelId) {
        const panel = document.getElementById(panelId);
        if (panel) {
            setTimeout(() => {
                panel.classList.remove('scale-95');
                panel.classList.add('scale-100');
            }, 10);
        }
    }
}

/**
 * Close a modal with animation
 * @param {string} modalId - Modal element ID
 * @param {string} panelId - Modal panel element ID (optional, for scale animation)
 * @param {number} delay - Delay before hiding (default: 200ms)
 */
export function closeModal(modalId, panelId = null, delay = 200) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    if (panelId) {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.remove('scale-100');
            panel.classList.add('scale-95');
        }
    }
    
    setTimeout(() => {
        modal.classList.add('hidden');
    }, delay);
}

/**
 * Add a class to an element
 * @param {string} id - Element ID
 * @param {string} className - Class name to add
 */
export function addClass(id, className) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.add(className);
    }
}

/**
 * Remove a class from an element
 * @param {string} id - Element ID
 * @param {string} className - Class name to remove
 */
export function removeClass(id, className) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.remove(className);
    }
}

/**
 * Toggle a class on an element
 * @param {string} id - Element ID
 * @param {string} className - Class name to toggle
 */
export function toggleClass(id, className) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.toggle(className);
    }
}
