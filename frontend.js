const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api/activities' 
    : 'https://daily-tracker-fikj.onrender.com/api/activities';

// DOM Elements
const activityForm = document.getElementById('activity-form');
const activityInput = document.getElementById('activity-input');
const activityList = document.getElementById('activity-list');
const emptyState = document.getElementById('empty-state');
const loadingSpinner = document.getElementById('loading-spinner');

// App State
let activities = [];

// Initialize App
document.addEventListener('DOMContentLoaded', fetchActivities);

// Event Listeners
activityForm.addEventListener('submit', addActivity);

// Fetch all activities from backend
async function fetchActivities() {
    showLoading(true);
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch activities');
        
        activities = await response.json();
        renderActivities();
    } catch (error) {
        console.error('Error fetching activities:', error);
        // Show a visual error state if needed
    } finally {
        showLoading(false);
    }
}

// Add a new activity
async function addActivity(e) {
    e.preventDefault();
    const activityName = activityInput.value.trim();
    
    if (!activityName) return;

    const newActivity = { activity_name: activityName };
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newActivity)
        });
        
        if (!response.ok) throw new Error('Failed to add activity');
        
        const data = await response.json();
        
        // Add to our state array
        activities.unshift({
            id: data.id,
            activity_name: data.activity_name,
            is_completed: data.is_completed,
            created_at: new Date().toISOString()
        });
        
        // Clear input and re-render
        activityInput.value = '';
        renderActivities();
    } catch (error) {
        console.error('Error adding activity:', error);
    }
}

// Toggle completion status
async function toggleCompletion(id, currentStatus) {
    const newStatus = currentStatus === 1 ? 0 : 1;
    
    // Optimistic update in state
    const activityIndex = activities.findIndex(a => a.id === id);
    if (activityIndex > -1) {
        activities[activityIndex].is_completed = newStatus;
        renderActivities(); // Re-render immediately for snappy feel
    }
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_completed: newStatus })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update activity');
        }
    } catch (error) {
        console.error('Error toggling completion:', error);
        // Revert optimistic update on failure
        if (activityIndex > -1) {
            activities[activityIndex].is_completed = currentStatus;
            renderActivities();
        }
    }
}

// Delete an activity
async function deleteActivity(id) {
    // Find the element to add a fade-out class before removing from DOM
    const itemElement = document.querySelector(`[data-id="${id}"]`);
    if (itemElement) {
        itemElement.classList.add('fade-out');
    }
    
    // Wait for animation to finish before updating state
    setTimeout(async () => {
        // Optimistic state update
        const originalActivities = [...activities];
        activities = activities.filter(a => a.id !== id);
        renderActivities();
        
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete activity');
        } catch (error) {
            console.error('Error deleting activity:', error);
            // Revert on failure
            activities = originalActivities;
            renderActivities();
        }
    }, 300); // 300ms matches the CSS transition time
}

// Render activities to the DOM
function renderActivities() {
    // Update empty state visibility
    if (activities.length === 0) {
        emptyState.style.display = 'block';
        activityList.style.display = 'none';
        return;
    } else {
        emptyState.style.display = 'none';
        activityList.style.display = 'flex';
    }

    // Clear list
    activityList.innerHTML = '';
    
    // Create elements for each activity
    activities.forEach(activity => {
        const li = document.createElement('li');
        li.className = `activity-item glass-panel ${activity.is_completed ? 'completed' : ''}`;
        li.dataset.id = activity.id;
        
        const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        const trashIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

        li.innerHTML = `
            <div class="activity-content" onclick="toggleCompletion(${activity.id}, ${activity.is_completed})">
                <div class="checkbox">
                    ${checkIcon}
                </div>
                <span class="activity-text">${escapeHTML(activity.activity_name)}</span>
            </div>
            <button class="delete-btn" onclick="deleteActivity(${activity.id})" aria-label="Delete activity">
                ${trashIcon}
            </button>
        `;
        
        activityList.appendChild(li);
    });
}

// Helper to prevent XSS
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showLoading(isLoading) {
    if (isLoading) {
        loadingSpinner.style.display = 'flex';
        activityList.style.display = 'none';
        emptyState.style.display = 'none';
    } else {
        loadingSpinner.style.display = 'none';
    }
}
