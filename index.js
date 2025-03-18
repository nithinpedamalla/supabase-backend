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
console.log("SUPABASE_URL:", process.env.SUPABASE_URL); // Debugging
console.log("SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "Loaded" : "Missing");

router.post("/signup", async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabase.from("users").insert([{ email, password }]);

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: "User created successfully", data });
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("password", password)
        .single();

    if (error || !data) return res.status(401).json({ error: "Invalid credentials" });

    res.json({ message: "Login successful", user: data });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
