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

// // Signup Route
// router.post("/signup", async (req, res) => {
//     const { email, password } = req.body;
//     console.log("in signup");

//     // Check if user already exists
//     const { data: existingUser, error: checkError } = await supabase
//         .from("users")
//         .select("email")
//         .eq("email", email)
//         .single();

//     if (existingUser) {
//         return res.status(400).json({ error: "User already exists" });
//     }

//     // Hash password before storing
//    // const hashedPassword = await bcrypt.hash(password, 10);
//     console.log("hashed passowrd");

//     const { data, error } = await supabase.from("users").insert([{ 
//         email: String(email), 
//         password: String(password) 
//     }]);
//     console.log( "After hased password");

    
// if (error) {
//     console.log("Insert Error:", error.message);
//     return res.status(400).json({ error: error.message });
// }
//     res.status(201).json({ message: "User created successfully", data });
// });

router.post("/signup", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Step 1: Sign up using Supabase Auth (sends verification email)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
        });

        if (authError) {
            console.error("Signup Error:", authError.message);
            return res.status(400).json({ error: authError.message });
        }

        // Step 2: Store email and password in 'users' table
        const { data, error } = await supabase
            .from("users")
            .insert([{ email, password }]);

        if (error) {
            console.error("Database Insert Error:", error.message);
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({
            message: "Signup successful. Check your email for verification.",
            user: authData
        });

    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Login Route
// router.post("/login", async (req, res) => {
//     const { email, password } = req.body;

//     // Fetch user data
//     const { data: user, error } = await supabase
//         .from("users")
//         .select("email, password")
//         .eq("email", email)
//         .eq("password", password)
//         .single();

//     if (error || !user) {
//         return res.status(401).json({ error: "Invalid credentials" });
//     }

//     res.json({ message: "Login successful", user: { email: user.email } });
// });

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Step 1: Authenticate with Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            return res.status(401).json({ error: "Invalid credentials or email not verified" });
        }

        // Step 2: Check if user exists in 'users' table
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("email")
            .eq("email", email)
            .single();

        if (userError || !user) {
            return res.status(401).json({ error: "User not found in database" });
        }

        res.json({ message: "Login successful", session: authData.session });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});


// Use the router
app.use("/", router);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
