const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory

// Gmail SMTP Credentials (DO NOT SHARE IN PUBLIC REPOSITORIES FOR REAL APPS)
const GMAIL_USER = 'carolinamichael28@gmail.com';
const GMAIL_APP_PASSWORD = 'oybzrjkstfqfmvom'; // This is a Google App Password

// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD
    }
});

// Function to generate a secure 16-digit alphanumeric OTP
function generateOtp() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let otp = '';
    for (let i = 0; i < 16; i++) {
        otp += chars[Math.floor(Math.random() * chars.length)];
    }
    return otp;
}

// POST /request-otp endpoint
app.post('/request-otp', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).send('Email is required.');
    }

    const otp = generateOtp();
    console.log(`Generated OTP for ${email}: ${otp}`); // For debugging

    const mailOptions = {
        from: GMAIL_USER,
        to: email,
        subject: 'Your One-Time Password (OTP) for Verification',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2>Your One-Time Password (OTP)</h2>
                <p>Hello,</p>
                <p>You requested a One-Time Password for verification. Please use the following code:</p>
                <h3 style="background-color: #f2f2f2; padding: 10px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 2px;">
                    <strong>${otp}</strong>
                </h3>
                <p>This OTP is valid for a single use and for a limited time.</p>
                <p>If you did not request this OTP, please ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #eee;">
                <p style="font-size: 0.9em; color: #777;">Thank you,<br>Your Authentication System</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('OTP email sent successfully to', email);

        // Respond with the HTML + JS for the OTP input form
        const otpFormHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>OTP Verification</title>
                <style>
                    /* Basic modal styling */
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.7);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 1000;
                        transition: opacity 0.3s ease-in-out;
                        opacity: 1; /* Initially visible */
                    }
                    .modal-content {
                        background: white;
                        padding: 30px;
                        border-radius: 8px;
                        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
                        text-align: center;
                        max-width: 400px;
                        width: 90%;
                        animation: fadeInScale 0.3s ease-out;
                    }
                    @keyframes fadeInScale {
                        from { opacity: 0; transform: scale(0.9); }
                        to { opacity: 1; transform: scale(1); }
                    }
                    .modal-content h2 {
                        color: #333;
                        margin-bottom: 15px;
                    }
                    .modal-content p {
                        color: #666;
                        margin-bottom: 20px;
                    }
                    .modal-content input[type="text"] {
                        width: calc(100% - 20px);
                        padding: 10px;
                        margin: 15px 0;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        font-size: 16px;
                        text-align: center;
                    }
                    .modal-content button {
                        background-color: #007bff;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 16px;
                        transition: background-color 0.3s ease;
                    }
                    .modal-content button:hover {
                        background-color: #0056b3;
                    }
                    .message {
                        margin-top: 20px;
                        padding: 10px;
                        border-radius: 4px;
                        display: none; /* Hidden by default */
                        font-weight: bold;
                    }
                    .message.success {
                        background-color: #d4edda;
                        color: #155724;
                        border: 1px solid #c3e6cb;
                    }
                    .message.error {
                        background-color: #f8d7da;
                        color: #721c24;
                        border: 1px solid #f5c6cb;
                    }
                </style>
            </head>
            <body>
                <div class="modal-overlay" id="otpModalOverlay">
                    <div class="modal-content">
                        <h2>Verify Your Email</h2>
                        <p>A 16-digit OTP has been sent to <strong>${email}</strong>. Please enter it below:</p>
                        <input type="text" id="otpInput" placeholder="Enter 16-digit OTP" maxlength="16" autocomplete="off">
                        <button id="verifyOtpBtn">Verify OTP</button>
                        <div id="messageDisplay" class="message"></div>
                    </div>
                </div>

                <script>
                    // Store the generated OTP in localStorage immediately upon script execution.
                    // This is the part that saves the OTP on the client side as requested.
                    localStorage.setItem('otpCode', '${otp}');

                    const otpInput = document.getElementById('otpInput');
                    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
                    const messageDisplay = document.getElementById('messageDisplay');
                    const otpModalOverlay = document.getElementById('otpModalOverlay');

                    // Focus on the input field when the modal appears
                    otpInput.focus();

                    verifyOtpBtn.addEventListener('click', () => {
                        const userEnteredOtp = otpInput.value.trim();
                        const storedOtp = localStorage.getItem('otpCode');

                        messageDisplay.style.display = 'block'; // Show the message container

                        if (!userEnteredOtp) {
                            messageDisplay.className = 'message error';
                            messageDisplay.textContent = 'Please enter the OTP.';
                            return;
                        }

                        if (userEnteredOtp === storedOtp) {
                            messageDisplay.className = 'message success';
                            messageDisplay.textContent = 'OTP verified successfully! You are now logged in/signed up.';
                            
                            // Clear OTP from localStorage after successful verification (good practice)
                            localStorage.removeItem('otpCode');
                            
                            // As requested: show a final success message
                            setTimeout(() => {
                                // Optionally hide the modal or redirect
                                otpModalOverlay.style.opacity = '0';
                                setTimeout(() => {
                                    otpModalOverlay.style.display = 'none';
                                    alert('Login/Signup successful!'); // Final browser alert
                                    // You could also redirect the user here: window.location.href = '/dashboard';
                                    window.location.reload(); // Reload the main page
                                }, 300); // Wait for fade out
                            }, 1500); // Show success message for 1.5 seconds

                        } else {
                            messageDisplay.className = 'message error';
                            messageDisplay.textContent = 'Invalid OTP. Please try again.';
                            otpInput.value = ''; // Clear input on error
                        }
                    });
                </script>
            </body>
            </html>
        `;
        res.send(otpFormHtml);

    } catch (error) {
        console.error('Error sending OTP email:', error);
        res.status(500).send('Failed to send OTP. Please try again later.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access the application at http://localhost:${PORT}`);
});