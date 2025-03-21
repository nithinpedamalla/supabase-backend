require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const router = express.Router();
const allowedOrigin = "https://curious-cendol-9b3d9a.netlify.app";

app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "Loaded" : "Missing");

// Signup with email & phone verification
router.post("/signup", async (req, res) => {
    try {
        const { email, password, phone } = req.body;

        // Step 1: Sign up using Supabase Auth (sends email confirmation & phone OTP)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            phone
        });

        if (authError) {
            console.error("Signup Error:", authError.message);
            return res.status(400).json({ error: authError.message });
        }

        // Step 2: Store user details in 'users' table
        const { data, error } = await supabase
            .from("users")
            .insert([{ email, password, phone, phone_verified: false }]);

        if (error) {
            console.error("Database Insert Error:", error.message);
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({
            message: "Signup successful. Verify email and phone.",
            user: authData
        });

    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Send OTP for phone verification
router.post("/send-otp", async (req, res) => {
    const { phone } = req.body;

    const { error } = await supabase.auth.signInWithOtp({ phone });

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    res.json({ message: "OTP sent successfully!" });
});

// Verify phone OTP
router.post("/verify-otp", async (req, res) => {
    const { phone, otp } = req.body;

    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    // Update `phone_verified` in the database
    await supabase.from("users").update({ phone_verified: true }).eq("phone", phone);

    res.json({ message: "Phone number verified!" });
});

// Login Route
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Authenticate with Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            return res.status(401).json({ error: "Invalid credentials or email not verified" });
        }

        // Check if phone is verified
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("email, phone_verified")
            .eq("email", email)
            .single();

        if (userError || !user) {
            return res.status(401).json({ error: "User not found in database" });
        }

        if (!user.phone_verified) {
            return res.status(403).json({ error: "Phone number not verified" });
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
