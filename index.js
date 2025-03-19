require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcrypt");

const app = express();
const router = express.Router();
const allowedOrigin = "https://curious-cendol-9b3d9a.netlify.app";

app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "Loaded" : "Missing");

// Signup Route
router.post("/signup", async (req, res) => {
    const { email, password } = req.body;
    console.log("in signup");

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("email")
        .eq("email", email)
        .single();

    if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("hashed passowrd");

    const { data, error } = await supabase.from("users").insert([{ email, password: hashedPassword }]);
    console.log( "After hased password");

    
if (error) {
    console.log("Insert Error:", error.message);
    return res.status(400).json({ error: error.message });
}
    res.status(201).json({ message: "User created successfully", data });
});

// Login Route
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // Fetch user data
    const { data: user, error } = await supabase
        .from("users")
        .select("email, password")
        .eq("email", email)
        .single();

    if (error || !user) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({ message: "Login successful", user: { email: user.email } });
});

// Use the router
app.use("/", router);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
