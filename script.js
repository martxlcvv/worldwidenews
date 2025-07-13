// 🔑 API Key Management
const apiKeys = [
  'dbd4560e83d50c725b32f2b67a00b466', // Key 1
  '2ddab93e0b102fb34ed1b31b34cad921', // Key 2
  'd5b7d7b0c42487145baf2f8001b32e7f', // Key 3
  '2ba16141125476ebc07c28b5d5689a8c'  // Key 4
];

let currentKeyIndex = 0;

function getCurrentApiKey() {
  return apiKeys[currentKeyIndex];
}

function switchToNextApiKey() {
  if (currentKeyIndex < apiKeys.length - 1) {
    currentKeyIndex++;
    return true;
  }
  return false;
}

// 📦 DOM Elements
const container = document.getElementById('news-container');
const form = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const categoryButtons = document.querySelectorAll('#categories button');
const darkToggle = document.getElementById('dark-mode-toggle');

// 🌓 Dark Mode Restore
if (localStorage.getItem('dark-mode') === 'enabled') {
  document.body.classList.add('dark-mode');
}

// 🌓 Dark Mode Toggle
darkToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem(
    'dark-mode',
    document.body.classList.contains('dark-mode') ? 'enabled' : 'disabled'
  );
});

// 🔎 Search Form Submit
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (query !== '') {
    isSearchMode = true;
    loadNews(null, query);
    clearActiveButtons();
  }
});

// 🧭 Category Buttons
categoryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentCategory = button.getAttribute('data-category');
    isSearchMode = false;
    loadNews(currentCategory);
    setActiveButton(button);
    searchInput.value = '';
  });
});

// 📌 State Variables
let currentCategory = 'breaking-news';
let isSearchMode = false;

// 🧰 Helpers
function setActiveButton(activeBtn) {
  categoryButtons.forEach((btn) => btn.classList.remove('active'));
  activeBtn.classList.add('active');
}

function clearActiveButtons() {
  categoryButtons.forEach((btn) => btn.classList.remove('active'));
}

function formatDate(dateStr) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-US', options);
}

// 📰 Main News Loader
async function loadNews(category = 'breaking-news', searchQuery = '', level = 1) {
  container.innerHTML = '<p>🔄 Loading news...</p>';
  let endpoint = '';

  if (searchQuery) {
    endpoint = `https://gnews.io/api/v4/search?q=${encodeURIComponent(searchQuery)}&lang=en&max=10&apikey=${getCurrentApiKey()}`;
  } else {
    endpoint = `https://gnews.io/api/v4/top-headlines?lang=en&topic=${category}&max=10&apikey=${getCurrentApiKey()}`;
  }

  try {
    const res = await fetch(endpoint);
    const data = await res.json();

    // 🔁 API Key Rotation if Limit Hit
    if (data.errors && data.errors[0]?.includes("request limit")) {
      const switched = switchToNextApiKey();
      if (switched) {
        console.warn(`⚠️ API key #${currentKeyIndex + 1} reached limit. Switching to next...`);
        loadNews(category, searchQuery, level);
        return;
      } else {
        container.innerHTML = `
          <div style="text-align:center; margin:60px auto;">
            <p style="font-size:24px;">⛔ All API keys have reached their daily limit.</p>
            <p style="color:gray;">Please come back tomorrow after 8:00 AM (PH time) when limits reset.</p>
          </div>`;
        return;
      }
    }

    // ❌ No Articles Found
    if (!data.articles || data.articles.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; margin:60px auto;">
          <p style="font-size:24px;">❌ No news found${searchQuery ? ` for "<strong>${searchQuery}</strong>"` : ''}.</p>
          <p style="color:gray;">Try another keyword or come back later.</p>
        </div>`;
      return;
    }

    // ✅ Display Articles
    container.innerHTML = '';
    data.articles.forEach((article) => {
      const card = document.createElement('div');
      card.classList.add('news-card');

      const datePublished = formatDate(article.publishedAt);
      const imageUrl = article.image || 'https://via.placeholder.com/400x200?text=No+Image';
      const sourceName = article.source?.name || 'Unknown Source';

      card.innerHTML = `
        <img src="${imageUrl}" alt="${article.title || 'News Image'}">
        <div class="news-content">
          <h2>${article.title || 'No Title Available'}</h2>
          <p class="date">Published: ${datePublished}</p>
          <p class="source">Source: ${sourceName}</p>
          <p>${article.description || 'No description available.'}</p>
          <a href="${article.url}" target="_blank" rel="noopener noreferrer">Read more ➜</a>
        </div>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    container.innerHTML = `<p>⚠️ Network or API error. Please try again later.</p>`;
    console.error(err);
  }
}

// 🚀 Initial Load
window.addEventListener('load', () => {
  isSearchMode = false;
  loadNews(currentCategory);
});
