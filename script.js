// CineAlgo - Movie Discovery Application
class CineAlgo {
    constructor() {
        // Initialize all components
        this.initChatbot();
        this.initMovieSearch();
        this.initWatchlist();
        this.initNavigation();
    }

    // CHATBOT FUNCTIONALITY
    initChatbot() {
        this.chatToggle = document.getElementById('chatToggle');
        this.chatWindow = document.getElementById('chatWindow');
        this.chatClose = document.getElementById('chatClose');
        this.chatInput = document.getElementById('chatInput');
        this.chatSend = document.getElementById('chatSend');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatLoading = document.getElementById('chatLoading');

        this.isOpen = false;
        this.isLoading = false;

        // Gemini API
        this.GEMINI_API_KEY = 'AIzaSyBGV9RSbf6k_ptggm8P9R_Nphpaa5kydWo';
        this.GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.GEMINI_API_KEY}`;

        this.setupChatbotEvents();
        console.log('Chatbot initialized');
    }

    setupChatbotEvents() {
        if (this.chatToggle) {
            this.chatToggle.addEventListener('click', () => this.toggleChat());
        }
        if (this.chatClose) {
            this.chatClose.addEventListener('click', () => this.closeChat());
        }
        if (this.chatSend) {
            this.chatSend.addEventListener('click', () => this.sendMessage());
        }
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        this.isOpen = true;
        this.chatWindow.classList.add('active');
        this.chatToggle.style.transform = 'scale(0.8)';
        setTimeout(() => this.chatInput.focus(), 300);
    }

    closeChat() {
        this.isOpen = false;
        this.chatWindow.classList.remove('active');
        this.chatToggle.style.transform = 'scale(1)';
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || this.isLoading) return;

        this.addMessage(message, 'user');
        this.chatInput.value = '';
        this.showChatLoading();

        try {
            const response = await this.getGeminiResponse(message);
            this.hideChatLoading();
            this.addMessage(response, 'bot');
        } catch (error) {
            this.hideChatLoading();
            this.addMessage('Sorry, I\'m having connection issues. Please try again! 🤖', 'bot');
        }
    }

    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'user' ? '👤' : '🤖';

        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.textContent = content;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageText);
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showChatLoading() {
        this.isLoading = true;
        this.chatLoading.style.display = 'flex';
        this.chatSend.disabled = true;
    }

    hideChatLoading() {
        this.isLoading = false;
        this.chatLoading.style.display = 'none';
        this.chatSend.disabled = false;
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    async getGeminiResponse(userMessage) {
        const prompt = `You are CineBot, an AI movie recommendation assistant. Be helpful, friendly, and enthusiastic about movies. Keep responses concise but informative. User message: ${userMessage}`;

        const response = await fetch(this.GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Gemini API Error:', response.status, errorData);
            throw new Error('API Error');
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    // MOVIE SEARCH FUNCTIONALITY
    initMovieSearch() {
        // TMDb API
        this.TMDB_API_KEY = '8265bd1679663a7ea12ac168da84d2e8';
        this.TMDB_BASE_URL = 'https://api.themoviedb.org/3';
        this.IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

        this.searchInput = document.getElementById('movieSearchInput');
        this.searchButton = document.getElementById('searchButton');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.resultsGrid = document.getElementById('resultsGrid');
        this.resultsSection = document.getElementById('resultsSection');
        this.noResults = document.getElementById('noResults');

        this.setupMovieSearchEvents();
        console.log('Movie search initialized');
    }

    setupMovieSearchEvents() {
        if (this.searchButton) {
            this.searchButton.addEventListener('click', () => this.handleSearch());
        }
        if (this.searchInput) {
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });
        }
    }

    async handleSearch() {
        const query = this.searchInput.value.trim();
        if (!query) {
            this.showError('Please enter a movie title to search');
            return;
        }

        console.log('Searching for:', query);
        this.showMovieLoading();

        try {
            const url = `${this.TMDB_BASE_URL}/search/movie?api_key=${this.TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`;
            console.log('API URL:', url);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            this.hideMovieLoading();
            this.displayMovieResults(data.results || []);

        } catch (error) {
            console.error('Search error:', error);
            this.hideMovieLoading();
            this.showError(`Search failed: ${error.message}. Please check your connection and try again.`);
        }
    }

    async searchPopular() {
        console.log('Loading popular movies...');
        this.showMovieLoading();

        try {
            const url = `${this.TMDB_BASE_URL}/movie/popular?api_key=${this.TMDB_API_KEY}&page=1`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.hideMovieLoading();
            this.displayMovieResults(data.results || []);
            this.searchInput.value = 'Popular Movies';

        } catch (error) {
            console.error('Popular movies error:', error);
            this.hideMovieLoading();
            this.showError('Failed to load popular movies. Please try again.');
        }
    }

    displayMovieResults(movies) {
        this.resultsGrid.innerHTML = '';
        this.hideAllSections();

        if (!movies || movies.length === 0) {
            this.noResults.style.display = 'block';
            return;
        }

        this.resultsSection.style.display = 'block';

        movies.slice(0, 12).forEach((movie, index) => {
            const card = this.createMovieCard(movie, index);
            this.resultsGrid.appendChild(card);
        });

        console.log(`Displayed ${Math.min(movies.length, 12)} movies`);
    }

    createMovieCard(movie, index) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.style.animationDelay = `${index * 0.1}s`;

        const posterPath = movie.poster_path
            ? `${this.IMAGE_BASE_URL}${movie.poster_path}`
            : null;

        const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown';
        const releaseDate = movie.release_date ? new Date(movie.release_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'Unknown';

        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        const voteCount = movie.vote_count ? movie.vote_count.toLocaleString() : '0';
        const popularity = movie.popularity ? Math.round(movie.popularity) : 'N/A';

        const genreNames = this.getGenreNames(movie.genre_ids || []);

        const languageNames = {
            'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
            'it': 'Italian', 'ja': 'Japanese', 'ko': 'Korean', 'zh': 'Chinese',
            'hi': 'Hindi', 'ar': 'Arabic', 'ru': 'Russian', 'pt': 'Portuguese'
        };
        const language = languageNames[movie.original_language] || movie.original_language?.toUpperCase() || 'Unknown';

        const overview = movie.overview || 'No description available for this movie.';
        const starRating = this.createStarRating(movie.vote_average);

        card.innerHTML = `
            ${posterPath
                ? `<img src="${posterPath}" alt="${movie.title}" class="movie-poster" loading="lazy">`
                : `<div class="movie-poster no-image">🎬</div>`
            }
            <div class="movie-info">
                <div class="movie-header">
                    <h3 class="movie-title">${movie.title}</h3>
                    ${movie.original_title !== movie.title ?
                `<p class="original-title">Original: ${movie.original_title}</p>` : ''
            }
                </div>
                
                <div class="movie-meta-detailed">
                    <div class="meta-row">
                        <span class="meta-label">Release:</span>
                        <span class="meta-value">${releaseDate}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Language:</span>
                        <span class="meta-value">${language}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Genres:</span>
                        <span class="meta-value">${genreNames}</span>
                    </div>
                </div>
                
                <div class="rating-section">
                    <div class="rating-stars">
                        ${starRating}
                    </div>
                    <div class="rating-details">
                        <span class="rating-score">${rating}/10</span>
                        <span class="rating-votes">(${voteCount} votes)</span>
                    </div>
                    <div class="popularity-badge">
                        Popularity: ${popularity}
                    </div>
                </div>
                
                <div class="movie-overview-full">
                    <h4 class="overview-title">Plot Summary</h4>
                    <p class="overview-text">${overview}</p>
                </div>
                
                <div class="movie-actions">
                    <button class="action-btn primary" onclick="window.cineAlgo.showMovieDetails('${movie.id}')">
                        <span>📱</span> Details
                    </button>
                    <button class="action-btn secondary" onclick="window.cineAlgo.addToWatchlist('${movie.id}')">
                        <span>➕</span> Watchlist
                    </button>
                    <button class="action-btn tertiary" onclick="window.cineAlgo.shareMovie('${movie.id}', '${movie.title.replace(/'/g, "\\'")}')">
                        <span>📤</span> Share
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    getGenreNames(genreIds) {
        const genreMap = {
            28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
            99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
            27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
            10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
        };

        if (!genreIds || genreIds.length === 0) return 'Unknown';

        const genres = genreIds.slice(0, 3).map(id => genreMap[id] || 'Unknown').filter(g => g !== 'Unknown');
        return genres.length > 0 ? genres.join(', ') : 'Unknown';
    }

    createStarRating(voteAverage) {
        const rating = voteAverage || 0;
        const stars = Math.round(rating / 2);
        let starHTML = '';

        for (let i = 1; i <= 5; i++) {
            if (i <= stars) {
                starHTML += '<span class="star filled">★</span>';
            } else {
                starHTML += '<span class="star empty">☆</span>';
            }
        }

        return starHTML;
    }

    showMovieLoading() {
        this.hideAllSections();
        if (this.loadingSpinner) {
            this.loadingSpinner.style.display = 'flex';
        }
    }

    hideMovieLoading() {
        if (this.loadingSpinner) {
            this.loadingSpinner.style.display = 'none';
        }
    }

    hideAllSections() {
        if (this.loadingSpinner) this.loadingSpinner.style.display = 'none';
        if (this.resultsSection) this.resultsSection.style.display = 'none';
        if (this.noResults) this.noResults.style.display = 'none';
    }

    showError(message) {
        console.error('Movie Search Error:', message);
        this.hideAllSections();

        this.resultsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
                <h3 style="color: var(--text-primary); margin-bottom: 10px;">Search Error</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">${message}</p>
                <button onclick="window.cineAlgo.searchInput.focus()" 
                        style="background: var(--accent-gradient); border: none; color: white; padding: 12px 24px; border-radius: 15px; cursor: pointer; font-family: 'Poppins', sans-serif;">
                    Try Again
                </button>
            </div>
        `;

        this.resultsSection.style.display = 'block';
    }

    // WATCHLIST FUNCTIONALITY
    initWatchlist() {
        this.watchlist = JSON.parse(localStorage.getItem('cinealgo-watchlist')) || [];
        this.watchlistGrid = document.getElementById('watchlistGrid');
        this.watchlistEmpty = document.getElementById('watchlistEmpty');

        this.setupWatchlistEvents();
        this.displayWatchlist();
        this.updateWatchlistStats();

        console.log('Watchlist initialized with', this.watchlist.length, 'movies');
    }

    setupWatchlistEvents() {
        const filterBtns = document.querySelectorAll('.watchlist .filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterWatchlist(e.target.dataset.filter);
            });
        });
    }

    async addToWatchlist(movieId) {
        try {
            if (this.watchlist.some(movie => movie.id == movieId)) {
                this.showNotification('Movie already in watchlist! 📚', 'info');
                return;
            }

            const url = `${this.TMDB_BASE_URL}/movie/${movieId}?api_key=${this.TMDB_API_KEY}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Failed to fetch movie details');
            }

            const movie = await response.json();

            const watchlistMovie = {
                id: movie.id,
                title: movie.title,
                original_title: movie.original_title,
                poster_path: movie.poster_path,
                backdrop_path: movie.backdrop_path,
                overview: movie.overview,
                release_date: movie.release_date,
                vote_average: movie.vote_average,
                vote_count: movie.vote_count,
                popularity: movie.popularity,
                genre_ids: movie.genres ? movie.genres.map(g => g.id) : [],
                genres: movie.genres || [],
                runtime: movie.runtime || 120,
                original_language: movie.original_language,
                added_date: new Date().toISOString(),
                watched: false
            };

            this.watchlist.unshift(watchlistMovie);
            this.saveWatchlist();
            this.displayWatchlist();
            this.updateWatchlistStats();

            this.showNotification(`Added "${movie.title}" to watchlist! 🎬`, 'success');

        } catch (error) {
            console.error('Error adding to watchlist:', error);
            this.showNotification('Failed to add movie to watchlist', 'error');
        }
    }

    removeFromWatchlist(movieId) {
        const movieIndex = this.watchlist.findIndex(movie => movie.id == movieId);
        if (movieIndex !== -1) {
            const movie = this.watchlist[movieIndex];
            this.watchlist.splice(movieIndex, 1);
            this.saveWatchlist();
            this.displayWatchlist();
            this.updateWatchlistStats();

            this.showNotification(`Removed "${movie.title}" from watchlist`, 'info');
        }
    }

    displayWatchlist(filter = 'all') {
        if (!this.watchlistGrid || !this.watchlistEmpty) return;

        let moviesToShow = [...this.watchlist];

        switch (filter) {
            case 'recent':
                moviesToShow = moviesToShow.sort((a, b) => new Date(b.added_date) - new Date(a.added_date));
                break;
            case 'rated':
                moviesToShow = moviesToShow.filter(m => m.vote_average >= 7).sort((a, b) => b.vote_average - a.vote_average);
                break;
            case 'genres':
                moviesToShow = moviesToShow.sort((a, b) => {
                    const aGenre = a.genres[0]?.name || 'Unknown';
                    const bGenre = b.genres[0]?.name || 'Unknown';
                    return aGenre.localeCompare(bGenre);
                });
                break;
        }

        this.watchlistGrid.innerHTML = '';

        if (moviesToShow.length === 0) {
            this.watchlistEmpty.style.display = 'block';
            this.watchlistGrid.style.display = 'none';
            return;
        }

        this.watchlistEmpty.style.display = 'none';
        this.watchlistGrid.style.display = 'grid';

        moviesToShow.forEach((movie, index) => {
            const card = this.createWatchlistCard(movie, index);
            this.watchlistGrid.appendChild(card);
        });
    }

    createWatchlistCard(movie, index) {
        const card = document.createElement('div');
        card.className = 'watchlist-movie-card';
        card.style.animationDelay = `${index * 0.1}s`;

        const posterPath = movie.poster_path
            ? `${this.IMAGE_BASE_URL}${movie.poster_path}`
            : null;

        const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        const overview = movie.overview || 'No description available.';
        const addedDate = new Date(movie.added_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });

        card.innerHTML = `
            <div class="watchlist-card-header">
                ${posterPath
                ? `<img src="${posterPath}" alt="${movie.title}" class="watchlist-poster" loading="lazy">`
                : `<div class="watchlist-poster no-image">🎬</div>`
            }
                <div class="added-date">Added ${addedDate}</div>
                <button class="remove-btn" onclick="window.cineAlgo.removeFromWatchlist('${movie.id}')" title="Remove from watchlist">
                    ✕
                </button>
            </div>
            <div class="watchlist-movie-info">
                <h3 class="watchlist-movie-title">${movie.title}</h3>
                <div class="watchlist-movie-meta">
                    <span class="watchlist-year">${year}</span>
                    <div class="watchlist-rating">
                        <span>⭐</span>
                        <span>${rating}</span>
                    </div>
                </div>
                <p class="watchlist-overview">${overview.length > 120 ? overview.slice(0, 120) + '...' : overview}</p>
                <div class="watchlist-actions">
                    <button class="watch-now-btn" onclick="window.cineAlgo.watchMovie('${movie.id}')">
                        <span>▶️</span> Watch Now
                    </button>
                    <button class="details-btn" onclick="window.cineAlgo.showMovieDetails('${movie.id}')" title="View details">
                        ℹ️
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    filterWatchlist(filter) {
        this.displayWatchlist(filter);
    }

    updateWatchlistStats() {
        const count = this.watchlist.length;
        const totalRuntime = this.watchlist.reduce((total, movie) => total + (movie.runtime || 120), 0);
        const hours = Math.floor(totalRuntime / 60);
        const minutes = totalRuntime % 60;

        const countElements = document.querySelectorAll('#watchlistCount, #navWatchlistCount');
        countElements.forEach(el => {
            if (el) el.textContent = count;
        });

        const runtimeEl = document.getElementById('totalRuntime');
        if (runtimeEl) {
            runtimeEl.textContent = `${hours}h ${minutes}m`;
        }

        const badge = document.getElementById('navWatchlistCount');
        if (badge) {
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    saveWatchlist() {
        localStorage.setItem('cinealgo-watchlist', JSON.stringify(this.watchlist));
    }

    clearWatchlist() {
        if (this.watchlist.length === 0) {
            this.showNotification('Watchlist is already empty!', 'info');
            return;
        }

        if (confirm(`Are you sure you want to remove all ${this.watchlist.length} movies from your watchlist?`)) {
            this.watchlist = [];
            this.saveWatchlist();
            this.displayWatchlist();
            this.updateWatchlistStats();
            this.showNotification('Watchlist cleared successfully!', 'success');
        }
    }

    exportWatchlist() {
        if (this.watchlist.length === 0) {
            this.showNotification('No movies to export!', 'info');
            return;
        }

        const exportData = this.watchlist.map(movie => ({
            title: movie.title,
            year: movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown',
            rating: movie.vote_average,
            added_date: new Date(movie.added_date).toLocaleDateString()
        }));

        const csvContent = "data:text/csv;charset=utf-8,"
            + "Title,Year,Rating,Added Date\n"
            + exportData.map(row => `"${row.title}","${row.year}","${row.rating}","${row.added_date}"`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "my_watchlist.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification('Watchlist exported successfully! 📥', 'success');
    }

    watchMovie(movieId) {
        const movie = this.watchlist.find(m => m.id == movieId);
        if (movie) {
            movie.watched = true;
            this.saveWatchlist();
            this.showNotification(`Enjoy watching "${movie.title}"! 🍿`, 'success');
            console.log('Opening movie for watching:', movie.title);
        }
    }

    // UTILITY FUNCTIONS
    showMovieDetails(movieId) {
        console.log('Showing details for movie ID:', movieId);
        this.showNotification(`Loading details for movie ID: ${movieId}`, 'info');
    }

    shareMovie(movieId, title) {
        console.log('Sharing movie:', title);
        if (navigator.share) {
            navigator.share({
                title: title,
                text: `Check out this movie: ${title}`,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(`Check out this movie: ${title} - ${window.location.href}`);
            this.showNotification('Movie link copied to clipboard! 📋', 'success');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">✕</button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 4000);
    }

    // NAVIGATION
    initNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');

                    const targetSection = document.querySelector(href);
                    if (targetSection) {
                        targetSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });

        // Update active nav on scroll
        window.addEventListener('scroll', () => {
            const sections = document.querySelectorAll('section[id]');
            const scrollY = window.pageYOffset;

            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');

                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    window.cineAlgo = new CineAlgo();
    console.log('CineAlgo app initialized! 🎬');
});