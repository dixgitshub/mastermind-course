// --- Supabase Client Initialization ---
// IMPORTANT: Replace these with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Initialize the global client from the CDN UMD build
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Auth Wrapper Functions ---

async function signInWithGoogle() {
    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin // Redirects back to the current origin
            }
        });
        if (error) throw error;
        // The redirect handles the rest
    } catch (error) {
        console.error("Error signing in with Google:", error.message);
        if(window.showToast) window.showToast("Google Login Failed: " + error.message);
    }
}

async function signOut() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        if(window.showToast) window.showToast("Logged out successfully.");
        // App.js listener handles the UI redirect
    } catch (error) {
        console.error("Error signing out:", error.message);
    }
}

// --- Profile Data Fetching ---
async function fetchUserProfile(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('first_name, xp, streak, level')
            .eq('id', userId)
            .single();
            
        if (error && error.code !== 'PGRST116') throw error; // ignore no rows error specifically
        
        return data || { xp: 0, streak: 0, level: 1, first_name: 'Student' };
    } catch (error) {
        console.warn("Could not fetch profile, using defaults.", error);
        return { xp: 0, streak: 0, level: 1, first_name: 'Student' };
    }
}

// Export functions to global scope for easy access from HTML standard handlers
window.supabaseApi = {
    signInWithGoogle,
    signOut,
    fetchUserProfile
};
