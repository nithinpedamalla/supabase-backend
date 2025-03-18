require("dotenv").config();
const express = require("express");
//const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const cors = require("cors");
//app.use(cors());
const allowedOrigin = "https://curious-cendol-9b3d9a.netlify.app"; // No trailing slash

app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post("/signup", async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Signup successful!", data });
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // Check if the user exists
    const { data: user, error: fetchError } = await supabase
        .from("auth.users")
        .select("id")
        .eq("email", email)
        .single();

    if (fetchError || !user) {
        return res.status(400).json({ error: "User not found. Please sign up first." });
    }

    // Proceed with login
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Login successful!", data });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
