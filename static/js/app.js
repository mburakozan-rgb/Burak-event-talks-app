// State Management
let allReleases = [];
let filteredReleases = [];
let selectedReleaseId = null;
let currentFilter = 'all';
let searchQuery = '';

// DOM Elements
const feedContainer = document.getElementById('feed-container');
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const filterChips = document.querySelectorAll('.filter-chip');
const resultsCount = document.getElementById('results-count');
const lastUpdated = document.getElementById('last-updated');

// Modal Elements
const tweetDialog = document.getElementById('tweet-dialog');
const tweetTextarea = document.getElementById('tweet-textarea');
const includeLinkCheckbox = document.getElementById('include-link-checkbox');
const charCounter = document.getElementById('char-counter');
const liveTweetPreview = document.getElementById('live-tweet-preview');
const closeDialogX = document.getElementById('close-dialog-x');
const closeDialogBtn = document.getElementById('close-dialog-btn');
const postTweetBtn = document.getElementById('post-tweet-btn');

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();
  
  // Load data
  fetchReleases();
  
  // Event Listeners
  refreshBtn.addEventListener('click', fetchReleases);
  searchInput.addEventListener('input', handleSearch);
  clearSearchBtn.addEventListener('click', clearSearch);
  
  // Filter chips selection
  filterChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.getAttribute('data-filter');
      applyFiltersAndSearch();
    });
  });

  // Modal setup
  setupModalEvents();
});

// ==========================================================================
// API Calls & Data Fetching
// ==========================================================================
async function fetchReleases() {
  setLoading(true);
  try {
    const response = await fetch('/api/releases');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.success) {
      allReleases = data.releases;
      applyFiltersAndSearch();
      updateLastUpdatedTime();
      showToast('Release notes loaded successfully', 'success');
    } else {
      throw new Error(data.error || 'Failed to fetch release notes');
    }
  } catch (error) {
    console.error('Error fetching releases:', error);
    showToast(`Error: ${error.message}`, 'error');
    renderErrorState(error.message);
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  if (isLoading) {
    refreshIcon.classList.add('spinning');
    refreshBtn.disabled = true;
    
    // Show skeleton loader
    feedContainer.innerHTML = `
      <div class="skeleton-feed">
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      </div>
    `;
    resultsCount.textContent = 'Fetching release notes...';
  } else {
    refreshIcon.classList.remove('spinning');
    refreshBtn.disabled = false;
  }
}

function updateLastUpdatedTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  lastUpdated.textContent = `Refreshed at ${timeStr}`;
}

// ==========================================================================
// Search & Filtering Logic
// ==========================================================================
function handleSearch(e) {
  searchQuery = e.target.value.toLowerCase().trim();
  if (searchQuery) {
    clearSearchBtn.style.display = 'flex';
  } else {
    clearSearchBtn.style.display = 'none';
  }
  applyFiltersAndSearch();
}

function clearSearch() {
  searchInput.value = '';
  searchQuery = '';
  clearSearchBtn.style.display = 'none';
  applyFiltersAndSearch();
  searchInput.focus();
}

function applyFiltersAndSearch() {
  filteredReleases = allReleases.filter(release => {
    // 1. Filter by category
    const matchesFilter = currentFilter === 'all' || release.type.toLowerCase() === currentFilter.toLowerCase();
    
    // 2. Filter by search query
    const matchesSearch = !searchQuery || 
      release.type.toLowerCase().includes(searchQuery) ||
      release.date.toLowerCase().includes(searchQuery) ||
      release.text.toLowerCase().includes(searchQuery) ||
      release.html.toLowerCase().includes(searchQuery);
      
    return matchesFilter && matchesSearch;
  });
  
  renderReleases();
}

// ==========================================================================
// Rendering Functions
// ==========================================================================
function renderReleases() {
  if (filteredReleases.length === 0) {
    resultsCount.textContent = '0 updates found';
    feedContainer.innerHTML = `
      <div class="no-results">
        <i data-lucide="alert-circle"></i>
        <h3>No updates match your criteria</h3>
        <p>Try refining your search query or changing the category filter.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  resultsCount.textContent = `${filteredReleases.length} update${filteredReleases.length === 1 ? '' : 's'} found`;
  
  feedContainer.innerHTML = filteredReleases.map(release => {
    const isSelected = selectedReleaseId === release.id;
    const badgeClass = getBadgeClass(release.type);
    
    return `
      <div class="update-card ${isSelected ? 'selected' : ''}" data-id="${release.id}" onclick="selectCard('${release.id}')">
        <div class="card-header">
          <div class="card-meta-left">
            <span class="badge ${badgeClass}">${escapeHtml(release.type)}</span>
            <span class="card-date">${escapeHtml(release.date)}</span>
          </div>
          <a href="${release.link}" target="_blank" rel="noopener" class="btn-card-action" onclick="event.stopPropagation()" title="View on official Google site">
            <i data-lucide="external-link" style="width: 14px; height: 14px;"></i>
          </a>
        </div>
        
        <div class="card-content">
          ${release.html}
        </div>
        
        <div class="card-actions">
          <button class="btn-card-action" onclick="copyToClipboard(event, '${release.id}')" title="Copy text to clipboard">
            <i data-lucide="copy" style="width: 14px; height: 14px;"></i>
            <span>Copy</span>
          </button>
          <button class="btn-card-action highlight" onclick="openTweetComposer(event, '${release.id}')" title="Tweet about this update">
            <i data-lucide="twitter" style="width: 14px; height: 14px;"></i>
            <span>Tweet</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  // Re-create icons for the dynamically rendered elements
  lucide.createIcons();
}

function renderErrorState(message) {
  feedContainer.innerHTML = `
    <div class="no-results" style="border-color: rgba(239, 68, 68, 0.2);">
      <i data-lucide="wifi-off" style="color: var(--error);"></i>
      <h3>Unable to connect</h3>
      <p>${escapeHtml(message)}</p>
      <button class="btn btn-secondary" onclick="fetchReleases()" style="margin-top: 8px;">
        <i data-lucide="refresh-cw" style="width: 16px; height: 16px;"></i>
        <span>Try Again</span>
      </button>
    </div>
  `;
  lucide.createIcons();
}

function getBadgeClass(type) {
  const t = type.toLowerCase();
  if (t.includes('feature')) return 'badge-feature';
  if (t.includes('announcement')) return 'badge-announcement';
  if (t.includes('issue')) return 'badge-issue';
  if (t.includes('breaking')) return 'badge-breaking';
  if (t.includes('change')) return 'badge-change';
  return 'badge-general';
}

function selectCard(id) {
  selectedReleaseId = selectedReleaseId === id ? null : id;
  
  // Update card UI classes
  const cards = document.querySelectorAll('.update-card');
  cards.forEach(card => {
    if (card.getAttribute('data-id') === selectedReleaseId) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
}

// ==========================================================================
// Tweet Composer Dialog Logic
// ==========================================================================
let currentDraftRelease = null;

function openTweetComposer(event, id) {
  event.stopPropagation(); // Prevent card selection toggle when clicking action button
  
  const release = allReleases.find(r => r.id === id);
  if (!release) return;
  
  currentDraftRelease = release;
  selectedReleaseId = id;
  
  // Style card selection visually
  selectCard(id);
  
  // Draft default tweet structure
  // Twitter limit is 280 chars. Let's craft a beautiful default text
  const cleanText = release.text;
  
  // Draft template: BigQuery [Type] (Date): "Snippet..." #BigQuery #GoogleCloud
  const typeTag = `BigQuery [${release.type}] (${release.date}): `;
  const hashtags = `\n\n#BigQuery #GoogleCloud`;
  
  // Calculate remaining characters for the description
  // Twitter counts URLs as 23 characters
  const urlLength = 23;
  const linkSpace = includeLinkCheckbox.checked ? (1 + urlLength) : 0;
  
  const reservedLength = typeTag.length + hashtags.length + linkSpace;
  const maxDescLength = 280 - reservedLength - 4; // -4 for quotation marks and ellipsis
  
  let description = cleanText;
  if (description.length > maxDescLength) {
    description = description.substring(0, maxDescLength - 3) + '...';
  }
  
  // Fill the draft into the textarea
  tweetTextarea.value = `"${description}"`;
  
  // Update live preview & character counter
  updateTweetPreview();
  
  // Open the native HTML dialog
  tweetDialog.showModal();
}

function updateTweetPreview() {
  if (!currentDraftRelease) return;
  
  const rawText = tweetTextarea.value;
  const url = currentDraftRelease.link;
  const showLink = includeLinkCheckbox.checked;
  const hashtags = ` #BigQuery #GoogleCloud`;
  
  let finalTweet = `BigQuery [${currentDraftRelease.type}] (${currentDraftRelease.date}):\n${rawText}${hashtags}`;
  
  // Update Live Preview box
  // Highlight hashtags and links
  let formattedHtml = escapeHtml(finalTweet)
    .replace(/(#\w+)/g, '<span class="hashtag">$1</span>');
    
  if (showLink) {
    finalTweet += ` ${url}`;
    formattedHtml += ` <span class="link">${escapeHtml(url)}</span>`;
  }
  
  liveTweetPreview.innerHTML = formattedHtml;
  
  // Calculate exact Twitter character count
  // Twitter handles URLs by shortening them to exactly 23 characters
  let twitterCount = `BigQuery [${currentDraftRelease.type}] (${currentDraftRelease.date}):\n${rawText}${hashtags}`.length;
  if (showLink) {
    twitterCount += 1 + 23; // space + shortened link length
  }
  
  charCounter.textContent = `${twitterCount} / 280`;
  
  // Handle warnings & validation states
  charCounter.className = 'char-counter';
  if (twitterCount > 280) {
    charCounter.classList.add('danger');
    postTweetBtn.disabled = true;
    postTweetBtn.style.opacity = 0.5;
    postTweetBtn.style.cursor = 'not-allowed';
  } else {
    postTweetBtn.disabled = false;
    postTweetBtn.style.opacity = 1;
    postTweetBtn.style.cursor = 'pointer';
    if (twitterCount > 260) {
      charCounter.classList.add('warning');
    }
  }
}

function setupModalEvents() {
  // Listen for text changes
  tweetTextarea.addEventListener('input', updateTweetPreview);
  
  // Listen for checkbox toggle
  includeLinkCheckbox.addEventListener('change', updateTweetPreview);
  
  // Close actions
  const closeDialog = () => {
    tweetDialog.close();
  };
  
  closeDialogX.addEventListener('click', closeDialog);
  closeDialogBtn.addEventListener('click', closeDialog);
  
  // Platform "light-dismiss" native modal fallback (for unsupported browsers or mouse click outside)
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    tweetDialog.addEventListener('click', (event) => {
      if (event.target !== tweetDialog) return;
      
      const rect = tweetDialog.getBoundingClientRect();
      const isDialogContent = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      
      if (!isDialogContent) {
        tweetDialog.close();
      }
    });
  }

  // Handle post/intent dispatch
  postTweetBtn.addEventListener('click', () => {
    if (!currentDraftRelease) return;
    
    const rawText = tweetTextarea.value;
    const url = currentDraftRelease.link;
    const showLink = includeLinkCheckbox.checked;
    const hashtags = ` #BigQuery #GoogleCloud`;
    
    // Construct final tweet text for Intent URL
    let finalTweet = `BigQuery [${currentDraftRelease.type}] (${currentDraftRelease.date}):\n${rawText}${hashtags}`;
    
    let twitterIntentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(finalTweet)}`;
    if (showLink) {
      // Adding URL parameter allows X.com to format the link preview properly
      twitterIntentUrl += `&url=${encodeURIComponent(url)}`;
    }
    
    // Open Twitter Intent Composer in a new tab
    window.open(twitterIntentUrl, '_blank', 'noopener,noreferrer');
    
    // Close modal and show success toast
    tweetDialog.close();
    showToast('Redirected to Twitter to share your tweet!', 'info');
  });
}

// ==========================================================================
// Clipboard Operations & Helper Utilities
// ==========================================================================
function copyToClipboard(event, id) {
  event.stopPropagation(); // Avoid card selection trigger
  const release = allReleases.find(r => r.id === id);
  if (!release) return;
  
  const textToCopy = `BigQuery [${release.type}] (${release.date}):\n${release.text}\n\nRead more: ${release.link}`;
  
  navigator.clipboard.writeText(textToCopy)
    .then(() => {
      showToast('Formatted update copied to clipboard!', 'success');
    })
    .catch(err => {
      console.error('Failed to copy: ', err);
      showToast('Failed to copy text', 'error');
    });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-triangle';
  
  toast.innerHTML = `
    <div class="toast-icon">
      <i data-lucide="${iconName}" style="width: 18px; height: 18px;"></i>
    </div>
    <div class="toast-message">${escapeHtml(message)}</div>
  `;
  
  container.appendChild(toast);
  lucide.createIcons();
  
  // Fade in animation trigger
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Auto remove toast after 3.5 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

function escapeHtml(string) {
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
