// NutriRoot - Admin Messages Management

const messagesTableBody = document.getElementById('messagesTableBody');
const messageSearchInput = document.getElementById('messageSearchInput');
const messageModal = document.getElementById('messageModal');

let allMessages = [];

// Initialize
function initMessages() {
    loadMessages();
}

// Load Messages from Firestore
async function loadMessages() {
    try {
        const snapshot = await db.collection('messages').orderBy('timestamp', 'desc').get();
        allMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        renderMessagesTable(allMessages);
    } catch (error) {
        console.error('Error loading messages:', error);
        showNotification('Error', 'Failed to load messages.', 'error');
    }
}

// Render Table
function renderMessagesTable(messages) {
    if (!messagesTableBody) return;
    messagesTableBody.innerHTML = '';

    if (messages.length === 0) {
        messagesTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No messages found.</td></tr>';
        return;
    }

    messages.forEach(msg => {
        const tr = document.createElement('tr');

        // Format Date
        let dateStr = 'N/A';
        if (msg.timestamp) {
            dateStr = new Date(msg.timestamp.toDate()).toLocaleString();
        }

        // Truncate Message
        let preview = msg.message || '';
        if (preview.length > 50) preview = preview.substring(0, 50) + '...';

        tr.innerHTML = `
            <td>${dateStr}</td>
            <td><strong>${msg.name || 'Unknown'}</strong></td>
            <td>${msg.email || 'No Email'}</td>
            <td>${msg.subject || 'No Subject'}</td>
            <td style="color: #666;">${preview}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon" onclick="openMessageModal('${msg.id}')" title="View Message">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    <!-- Delete could be added here if needed -->
                </div>
            </td>
        `;
        messagesTableBody.appendChild(tr);
    });
}

// Search
function handleMessageSearch() {
    const term = messageSearchInput.value.toLowerCase();
    const filtered = allMessages.filter(msg =>
        (msg.name && msg.name.toLowerCase().includes(term)) ||
        (msg.email && msg.email.toLowerCase().includes(term)) ||
        (msg.subject && msg.subject.toLowerCase().includes(term))
    );
    renderMessagesTable(filtered);
}

// Modal
function openMessageModal(id) {
    const msg = allMessages.find(m => m.id === id);
    if (!msg) return;

    document.getElementById('msgModalSubject').textContent = msg.subject;
    document.getElementById('msgModalSender').textContent = `From: ${msg.name} <${msg.email}>`;

    if (msg.timestamp) {
        document.getElementById('msgModalDate').textContent = new Date(msg.timestamp.toDate()).toLocaleString();
    } else {
        document.getElementById('msgModalDate').textContent = '';
    }

    document.getElementById('msgModalBody').textContent = msg.message;

    // Setup Reply Button (mailto)
    const replyBtn = document.getElementById('replyBtn');
    const subject = `Re: ${msg.subject}`;
    const body = `\n\nOn ${new Date(msg.timestamp?.toDate()).toLocaleDateString()}, ${msg.name} wrote:\n> ${msg.message}`;
    replyBtn.href = `mailto:${msg.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    messageModal.classList.add('active');
}

function closeMessageModal() {
    messageModal.classList.remove('active');
}

// Init on Load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initMessages, 1000); // Wait for firebase
});

// Helper Notification (Reused)
function showNotification(title, message, type = 'info') {
    // Basic implementation since we might rely on the one in index or admin-crops
    // Check if container exists
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`; // Assumes css/admin.css has toast styles
    // ... simplified toast content ...
    toast.innerHTML = `<div class="toast-content"><strong>${title}</strong><br>${message}</div>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

window.handleMessageSearch = handleMessageSearch;
window.openMessageModal = openMessageModal;
window.closeMessageModal = closeMessageModal;
