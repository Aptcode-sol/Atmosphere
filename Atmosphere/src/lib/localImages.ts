// Local images module. Place a `placeholder.png` file under `src/assets/placeholder.png` to use local fallback.
// If the file does not exist, the code will still work and fall back to remote placeholder URIs.
let PLACEHOLDER: any = null;
try {
    // developer should add src/assets/placeholder.png to use this
    PLACEHOLDER = require('../assets/placeholder.png');
} catch {
    PLACEHOLDER = null;
}

export { PLACEHOLDER };
