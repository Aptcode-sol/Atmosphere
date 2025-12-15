export function getImageSource(url: any, placeholder?: any) {
    try {
        // guard: null/undefined
        if (!url) {
            if (placeholder) return placeholder;
            return { uri: 'https://via.placeholder.com/400x400.png?text=Image' };
        }

        // numeric require (local asset) - React Native accepts numbers
        if (typeof url === 'number') return url;

        if (typeof url === 'string') {
            const trimmed = url.trim();
            if (!trimmed) {
                if (placeholder) return placeholder;
                return { uri: 'https://via.placeholder.com/400x400.png?text=Image' };
            }
            if (trimmed.startsWith('data:') || trimmed.startsWith('http') || trimmed.startsWith('https')) {
                return { uri: trimmed };
            }
            // fallback to uri
            return { uri: trimmed };
        }

        if (typeof url === 'object') {
            if (Array.isArray(url) && url.length > 0) {
                return getImageSource(url[0], placeholder);
            }

            // common shapes: { url }, { src }, { path }
            const possible = (url.url || url.src || url.path || url.uri);
            if (possible) return getImageSource(possible, placeholder);

            // some APIs provide media: [{ url }] or media: [{ src }]
            if (Array.isArray(url.media) && url.media.length > 0) {
                const first = url.media[0];
                return getImageSource(first?.url || first?.src || first || placeholder, placeholder);
            }

            // if object has nested file info
            if (url.file && (url.file.url || url.file.path)) {
                return getImageSource(url.file.url || url.file.path, placeholder);
            }
        }

        // last resort
        if (placeholder) return placeholder;
        return { uri: 'https://via.placeholder.com/400x400.png?text=Image' };
    } catch (e) {
        // defensive fallback
         
        console.warn('getImageSource error for url:', url, e);
        if (placeholder) return placeholder;
        return { uri: 'https://via.placeholder.com/400x400.png?text=Image' };
    }
}
